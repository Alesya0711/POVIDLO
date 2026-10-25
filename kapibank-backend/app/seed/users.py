from sqlmodel import Session, select
from app.models.user import UserModel
from app.services.auth import get_password_hash

DEMO_USERS = [
    {
        "id": "user-client-demo-01",
        "email": "client@kapibank.demo",
        "plain_password": "client123",
        "role": "client",
        "full_name": "Предприниматель Алексей (Капибанк)",
        "bound_inn": None,
    },
    {
        "id": "user-staff-demo-01",
        "email": "staff@kapibank.demo",
        "plain_password": "staff123",
        "role": "bank_staff",
        "full_name": "Сотрудник банка Капибанкир",
        "bound_inn": None,
    },
]


def seed_users(session: Session) -> None:
    existing_emails = {u.email for u in session.exec(select(UserModel)).all()}
    for raw in DEMO_USERS:
        if raw["email"] in existing_emails:
            continue
        user = UserModel(
            id=raw["id"],
            email=raw["email"],
            hashed_password=get_password_hash(raw["plain_password"]),
            role=raw["role"],
            full_name=raw["full_name"],
            bound_inn=raw["bound_inn"],
        )
        session.add(user)
    session.commit()