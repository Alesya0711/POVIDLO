from fastapi import status
from sqlmodel import Session, select
from app.core.config import settings
from app.core.errors import AppException
from app.models.company import CompanyProfileModel, InnProfileBindingModel
from app.services.inn import pick_deterministic_profile_index, validate_inn

def resolve_or_bind_company_profile(session: Session, raw_inn: str) -> tuple[str, CompanyProfileModel]:
    is_valid, legal_form, err_msg = validate_inn(raw_inn)
    if not is_valid or legal_form is None:
        raise AppException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            code="VALIDATION_ERROR",
            message="Проверьте введённые данные",
            field_errors=[{"field": "inn", "message": err_msg}],
        )

    clean_inn = raw_inn.strip()

    # 1. Проверяем сохранённую привязку ИНН
    existing_binding = session.get(InnProfileBindingModel, clean_inn)
    if existing_binding:
        bound_profile = session.get(CompanyProfileModel, existing_binding.profile_id)
        if bound_profile:
            return clean_inn, bound_profile

    # 2. Проверяем, совпадает ли ИНН с одним из 20 известных эталонных ИНН
    direct_match = session.exec(
        select(CompanyProfileModel).where(CompanyProfileModel.sample_inn == clean_inn)
    ).first()
    if direct_match:
        chosen_profile = direct_match
    else:
        # 3. Детерминированно выбираем профиль той же правовой формы (ip / ooo)
        pool = list(
            session.exec(
                select(CompanyProfileModel)
                .where(CompanyProfileModel.legal_form == legal_form)
                .order_by(CompanyProfileModel.id)
            ).all()
        )
        if not pool:
            raise AppException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                code="SERVICE_UNAVAILABLE",
                message="Сведения о компании сейчас недоступны. Попробуйте позже.",
            )
        idx = pick_deterministic_profile_index(clean_inn, settings.DATA_VERSION, len(pool))
        chosen_profile = pool[idx]

    binding = InnProfileBindingModel(
        inn=clean_inn,
        profile_id=chosen_profile.id,
        data_version=settings.DATA_VERSION,
    )
    session.add(binding)
    session.flush()
    return clean_inn, chosen_profile
