import hashlib
from typing import Literal

LegalFormType = Literal["ip", "ooo"]

WEIGHTS_10 = (2, 4, 10, 3, 5, 9, 4, 6, 8)
WEIGHTS_12_1 = (7, 2, 4, 10, 3, 5, 9, 4, 6, 8)
WEIGHTS_12_2 = (3, 7, 2, 4, 10, 3, 5, 9, 4, 6, 8)


def compute_inn_10(prefix9: str) -> str:
    """Генерирует валидный 10-значный ИНН (ООО) по 9 цифрам."""
    if len(prefix9) != 9 or not prefix9.isdigit():
        raise ValueError("prefix9 must be 9 digits")
    checksum = sum(int(d) * w for d, w in zip(prefix9, WEIGHTS_10)) % 11 % 10
    return f"{prefix9}{checksum}"


def compute_inn_12(prefix10: str) -> str:
    """Генерирует валидный 12-значный ИНН (ИП) по 10 цифрам."""
    if len(prefix10) != 10 or not prefix10.isdigit():
        raise ValueError("prefix10 must be 10 digits")
    n11 = sum(int(d) * w for d, w in zip(prefix10, WEIGHTS_12_1)) % 11 % 10
    first11 = f"{prefix10}{n11}"
    n12 = sum(int(d) * w for d, w in zip(first11, WEIGHTS_12_2)) % 11 % 10
    return f"{first11}{n12}"


def validate_inn(raw_inn: str) -> tuple[bool, LegalFormType | None, str]:
    """
    Проверяет формат и контрольные цифры ИНН.
    Возвращает (is_valid, legal_form, error_message).
    10 цифр -> 'ooo', 12 цифр -> 'ip'.
    """
    inn = raw_inn.strip()
    if not inn.isdigit():
        return False, None, "ИНН должен состоять только из цифр"

    if len(inn) == 10:
        if inn == "0" * 10:
            return False, None, "Некорректный ИНН"
        expected = compute_inn_10(inn[:9])
        if inn != expected:
            return False, None, "Неверная контрольная цифра 10-значного ИНН организации"
        return True, "ooo", ""

    if len(inn) == 12:
        if inn == "0" * 12:
            return False, None, "Некорректный ИНН"
        expected = compute_inn_12(inn[:10])
        if inn != expected:
            return False, None, "Неверные контрольные цифры 12-значного ИНН предпринимателя"
        return True, "ip", ""

    return False, None, "ИНН должен содержать 10 цифр (для ООО) или 12 цифр (для ИП)"


def pick_deterministic_profile_index(inn: str, data_version: str, pool_size: int) -> int:
    """
    Детерминированно выбирает индекс профиля из пула подходящей правовой формы
    по нормализованному ИНН и версии набора данных.
    """
    if pool_size <= 0:
        raise ValueError("pool_size must be positive")
    digest = hashlib.sha256(f"{inn.strip()}:{data_version}".encode("utf-8")).hexdigest()
    return int(digest[:16], 16) % pool_size