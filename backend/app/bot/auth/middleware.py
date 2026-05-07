"""Authentication guard for Telegram bot handlers."""

from __future__ import annotations

import functools
import logging
from collections.abc import Awaitable, Callable
from datetime import datetime, timezone
from typing import Any

from firebase_admin import firestore as fa_firestore
from telegram import KeyboardButton, ReplyKeyboardMarkup, Update
from telegram.ext import ContextTypes

from app.bot.auth.strings import normalize_language, t
from app.core.config import settings

logger = logging.getLogger(__name__)

AUTH_SESSION_CACHE_KEY = "_telegram_auth_session"
AUTH_UPDATE_CONSUMED_KEY = "_telegram_auth_update_consumed"


def get_telegram_user_id(update: Update) -> int | None:
    if update.effective_user:
        return update.effective_user.id
    if update.effective_chat:
        return update.effective_chat.id
    return None


def _get_db():
    return fa_firestore.client()


def fetch_session(telegram_id: int | str) -> dict[str, Any] | None:
    doc = _get_db().collection("telegram_sessions").document(str(telegram_id)).get()
    if not doc.exists:
        return None
    return doc.to_dict() or {}


def is_authenticated_session(session: dict[str, Any] | None) -> bool:
    return bool(session and session.get("uid"))


def _to_utc_seconds(ts: Any) -> float | None:
    """Convert a Firestore Timestamp or Python datetime to UTC epoch seconds."""
    if ts is None:
        return None
    if hasattr(ts, "timestamp"):
        return ts.timestamp()
    return float(ts)


def is_session_idle_expired(session: dict[str, Any]) -> bool:
    """Return True if the session has been idle past its allowed timeout."""
    last_ts = _to_utc_seconds(session.get("lastActivityAt"))
    if last_ts is None:
        return False
    keep_logged_in = session.get("keepLoggedIn", False)
    timeout = (
        settings.TELEGRAM_KEEP_LOGGED_IN_SECONDS
        if keep_logged_in
        else settings.TELEGRAM_IDLE_TIMEOUT_SECONDS
    )
    return (datetime.now(timezone.utc).timestamp() - last_ts) > timeout


def update_last_activity(
    telegram_id: int | str,
    session_cache: dict[str, Any] | None = None,
) -> None:
    """Write lastActivityAt to Firestore and update the in-memory cache."""
    now = datetime.now(timezone.utc)
    if session_cache is not None:
        session_cache["lastActivityAt"] = now
    try:
        _get_db().collection("telegram_sessions").document(str(telegram_id)).update(
            {"lastActivityAt": fa_firestore.SERVER_TIMESTAMP}
        )
    except Exception as exc:
        logger.warning("Failed to update lastActivityAt for %s: %s", telegram_id, exc)


def mark_update_consumed(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    context.user_data[AUTH_UPDATE_CONSUMED_KEY] = getattr(update, "update_id", True)


def pop_if_current_update_consumed(update: Update, context: ContextTypes.DEFAULT_TYPE) -> bool:
    consumed = context.user_data.get(AUTH_UPDATE_CONSUMED_KEY)
    update_id = getattr(update, "update_id", None)
    is_consumed = consumed == update_id if update_id is not None else bool(consumed)
    if is_consumed:
        context.user_data.pop(AUTH_UPDATE_CONSUMED_KEY, None)
    return is_consumed


async def prompt_for_contact(update: Update) -> None:
    if not update.effective_message:
        return

    keyboard = ReplyKeyboardMarkup(
        [[KeyboardButton(t("en", "share_contact_button"), request_contact=True)]],
        resize_keyboard=True,
        one_time_keyboard=False,
        is_persistent=True,
    )
    await update.effective_message.reply_text(
        "👇 Tap the *Share Contact* button below to verify and get started.",
        reply_markup=keyboard,
        parse_mode="Markdown",
    )


def require_auth(handler: Callable[[Update, ContextTypes.DEFAULT_TYPE], Awaitable[Any]]):
    """Decorator that enforces authentication and idle-session timeout."""

    @functools.wraps(handler)
    async def wrapper(update: Update, context: ContextTypes.DEFAULT_TYPE):
        if pop_if_current_update_consumed(update, context):
            return None

        telegram_id = get_telegram_user_id(update)
        if telegram_id is None:
            logger.warning("Telegram update without user/chat id skipped by auth middleware")
            return None

        cached_session = context.user_data.get(AUTH_SESSION_CACHE_KEY)
        session = cached_session if cached_session is not None else fetch_session(telegram_id)
        context.user_data[AUTH_SESSION_CACHE_KEY] = session or {}

        if is_authenticated_session(session):
            if is_session_idle_expired(session):
                # Evict stale cache; re-fetch to confirm the account still exists
                context.user_data.pop(AUTH_SESSION_CACHE_KEY, None)
                fresh_session = fetch_session(telegram_id)

                if is_authenticated_session(fresh_session):
                    # Telegram identity confirmed via the incoming update — restore
                    context.user_data[AUTH_SESSION_CACHE_KEY] = fresh_session
                    update_last_activity(telegram_id, session_cache=fresh_session)
                    language = normalize_language(fresh_session.get("language"))
                    name = fresh_session.get("name") or "there"
                    if update.effective_message:
                        await update.effective_message.reply_text(
                            t(language, "session_restored", name=name)
                        )
                    return await handler(update, context)

                # No registered account found — start full re-auth
                await prompt_for_contact(update)
                mark_update_consumed(update, context)
                return None

            update_last_activity(telegram_id, session_cache=session)
            return await handler(update, context)

        await prompt_for_contact(update)
        mark_update_consumed(update, context)
        return None

    return wrapper
