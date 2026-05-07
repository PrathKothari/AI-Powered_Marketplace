"""Firebase Auth and Firestore helpers for Telegram phone onboarding."""

from __future__ import annotations

import logging
import re
from dataclasses import dataclass
from typing import Any

from firebase_admin import auth, firestore as fa_firestore

logger = logging.getLogger(__name__)


@dataclass(frozen=True)
class PhoneUser:
    uid: str
    phone: str
    name: str
    language: str
    created: bool = False


def normalize_phone_number(phone_number: str) -> str:
    """Normalize Telegram contact phone numbers to a Firebase-friendly E.164 value."""
    raw = (phone_number or "").strip()
    if raw.startswith("+"):
        digits = re.sub(r"\D", "", raw)
        return f"+{digits}" if digits else raw

    digits = re.sub(r"\D", "", raw)
    if digits.startswith("00"):
        digits = digits[2:]
    if len(digits) == 10:
        digits = f"91{digits}"
    return f"+{digits}" if digits else raw


def extract_phone_number(text: str) -> str | None:
    """Extract a typed Indian phone number and normalize it to E.164."""
    digits = re.sub(r"\D", "", text or "")
    if digits.startswith("00"):
        digits = digits[2:]

    if len(digits) == 10:
        return normalize_phone_number(digits)
    if len(digits) == 12 and digits.startswith("91"):
        return normalize_phone_number(digits)
    if len(digits) == 13 and digits.startswith("091"):
        return normalize_phone_number(digits[1:])
    return None


def _get_db():
    return fa_firestore.client()


def _user_doc(uid: str) -> dict[str, Any]:
    doc = _get_db().collection("users").document(uid).get()
    if not doc.exists:
        return {}
    return doc.to_dict() or {}


def get_or_create_user_by_phone(
    phone_number: str,
    *,
    name: str | None = None,
    language: str = "en",
) -> PhoneUser | None:
    """Return an existing Firebase phone user, or create one when a name is supplied."""
    phone = normalize_phone_number(phone_number)

    try:
        user_record = auth.get_user_by_phone_number(phone)
        user_doc = _user_doc(user_record.uid)
        display_name = user_doc.get("name") or user_record.display_name or name or "there"
        user_language = user_doc.get("language") or language or "en"
        return PhoneUser(
            uid=user_record.uid,
            phone=phone,
            name=display_name,
            language=user_language,
            created=False,
        )
    except auth.UserNotFoundError:
        if not name:
            return None

    user_record = auth.create_user(phone_number=phone, display_name=name)
    return PhoneUser(
        uid=user_record.uid,
        phone=phone,
        name=name,
        language=language,
        created=True,
    )


def link_telegram_id(
    *,
    uid: str,
    telegram_id: int | str,
    phone: str,
    name: str,
    language: str,
    phone_verified: bool = True,
    phone_source: str = "telegram_contact",
) -> None:
    """Link a Firebase user to a Telegram account in Firestore."""
    db = _get_db()
    telegram_id = str(telegram_id)
    now = fa_firestore.SERVER_TIMESTAMP

    user_ref = db.collection("users").document(uid)
    user_payload = {
        "uid": uid,
        "role": "user",
        "telegramId": telegram_id,
        "phone": phone,
        "phoneVerified": phone_verified,
        "phoneSource": phone_source,
        "name": name,
        "language": language,
        "updatedAt": now,
    }
    if not user_ref.get().exists:
        user_payload["createdAt"] = now

    user_ref.set(user_payload, merge=True)
    db.collection("telegram_sessions").document(telegram_id).set(
        {
            "uid": uid,
            "phone": phone,
            "phoneVerified": phone_verified,
            "phoneSource": phone_source,
            "name": name,
            "language": language,
            "lastActivityAt": now,
            "updatedAt": now,
        },
        merge=True,
    )
