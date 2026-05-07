"""Telegram auth ConversationHandler."""

from __future__ import annotations

import logging
import warnings
from typing import Any

from firebase_admin import firestore as fa_firestore
from telegram import (
    InlineKeyboardButton,
    InlineKeyboardMarkup,
    KeyboardButton,
    ReplyKeyboardMarkup,
    ReplyKeyboardRemove,
    Update,
)

from app.bot.menu import main_menu_keyboard
from telegram.warnings import PTBUserWarning
from telegram.ext import (
    CallbackQueryHandler,
    CommandHandler,
    ContextTypes,
    ConversationHandler,
    MessageHandler,
    filters,
)

from app.bot.auth.middleware import (
    AUTH_SESSION_CACHE_KEY,
    fetch_session,
    get_telegram_user_id,
    is_authenticated_session,
    mark_update_consumed,
    prompt_for_contact,
    update_last_activity,
)
from app.bot.auth.strings import LANGUAGE_LABELS, SUPPORTED_LANGUAGES, normalize_language, t
from app.core.config import settings
from app.bot.utils.firebase_phone import (
    extract_phone_number,
    get_or_create_user_by_phone,
    link_telegram_id,
    normalize_phone_number,
)

logger = logging.getLogger(__name__)

AUTH_CONVERSATION_NAME = "telegram_auth"
SHARE_CONTACT, LANGUAGE_SELECT, NAME_INPUT = range(3)

_AUTH_PHONE_KEY = "_telegram_auth_phone"
_AUTH_LANGUAGE_KEY = "_telegram_auth_language"


def _get_db():
    return fa_firestore.client()


def _session_ref(telegram_id: int | str):
    return _get_db().collection("telegram_sessions").document(str(telegram_id))


def _write_session(telegram_id: int | str, data: dict[str, Any]) -> None:
    payload = {**data, "updatedAt": fa_firestore.SERVER_TIMESTAMP}
    _session_ref(telegram_id).set(payload, merge=True)


def _update_session(telegram_id: int | str, data: dict[str, Any]) -> None:
    payload = {**data, "updatedAt": fa_firestore.SERVER_TIMESTAMP}
    _session_ref(telegram_id).update(payload)


def _clear_conversation_state(telegram_id: int | str) -> None:
    try:
        _session_ref(telegram_id).update({"conversation_state": fa_firestore.DELETE_FIELD})
    except Exception:
        logger.debug("No Telegram conversation state to clear for %s", telegram_id)


def _language_keyboard() -> InlineKeyboardMarkup:
    rows = [
        [
            InlineKeyboardButton(LANGUAGE_LABELS["en"], callback_data="auth_lang:en"),
            InlineKeyboardButton(LANGUAGE_LABELS["hi"], callback_data="auth_lang:hi"),
        ],
        [
            InlineKeyboardButton(LANGUAGE_LABELS["bn"], callback_data="auth_lang:bn"),
            InlineKeyboardButton(LANGUAGE_LABELS["mr"], callback_data="auth_lang:mr"),
        ],
        [
            InlineKeyboardButton(LANGUAGE_LABELS["ta"], callback_data="auth_lang:ta"),
            InlineKeyboardButton(LANGUAGE_LABELS["gu"], callback_data="auth_lang:gu"),
        ],
    ]
    return InlineKeyboardMarkup(rows)


def _contact_keyboard() -> ReplyKeyboardMarkup:
    return ReplyKeyboardMarkup(
        [[KeyboardButton(t("en", "share_contact_button"), request_contact=True)]],
        resize_keyboard=True,
        one_time_keyboard=False,
        is_persistent=True,
    )


def _keep_logged_in_keyboard(language: str) -> InlineKeyboardMarkup:
    return InlineKeyboardMarkup([[
        InlineKeyboardButton(t(language, "keep_logged_in_yes"), callback_data="auth_keep:yes"),
        InlineKeyboardButton(t(language, "keep_logged_in_no"), callback_data="auth_keep:no"),
    ]])


def _verification_label(language: str, phone_source: str) -> str:
    if phone_source == "sms_otp":
        return "SMS OTP verified"
    return t(language, "verified_contact")


def _completion_summary(
    *,
    language: str,
    name: str,
    phone: str,
    phone_source: str,
    returning: bool = False,
) -> str:
    if returning:
        header = t(language, "welcome_back", name=name)
    else:
        header = t(language, "welcome_new_header", name=name)

    return (
        f"{header}\n\n"
        f"Name: {name}\n"
        f"Language: {LANGUAGE_LABELS[language]}\n"
        f"Phone: {phone}\n"
        f"Verification: {_verification_label(language, phone_source)}\n\n"
        f"Please re-send your message!"
    )


async def start_auth(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Entry point for any unauthenticated Telegram message."""
    telegram_id = get_telegram_user_id(update)
    if telegram_id is None:
        return ConversationHandler.END

    session = fetch_session(telegram_id)
    context.user_data[AUTH_SESSION_CACHE_KEY] = session or {}
    if is_authenticated_session(session):
        return ConversationHandler.END

    mark_update_consumed(update, context)

    contact = update.effective_message.contact if update.effective_message else None
    if contact:
        return await handle_contact(update, context)

    _write_session(telegram_id, {"uid": None})
    await prompt_for_contact(update)
    return SHARE_CONTACT


async def handle_contact(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Accept Telegram-verified contact and branch to returning/new user flow."""
    mark_update_consumed(update, context)
    telegram_id = get_telegram_user_id(update)
    contact = update.effective_message.contact if update.effective_message else None
    if telegram_id is None or contact is None:
        await prompt_for_contact(update)
        return SHARE_CONTACT

    if contact.user_id and contact.user_id != telegram_id:
        await update.effective_message.reply_text(
            t("en", "share_contact"),
            reply_markup=_contact_keyboard(),
            parse_mode="Markdown",
        )
        return SHARE_CONTACT

    phone = normalize_phone_number(contact.phone_number)
    return await continue_with_phone(update, context, phone)


async def continue_with_phone(
    update: Update,
    context: ContextTypes.DEFAULT_TYPE,
    phone: str,
    *,
    phone_verified: bool = True,
    phone_source: str = "telegram_contact",
):
    """Branch to returning/new user flow after obtaining a phone number."""
    telegram_id = get_telegram_user_id(update)
    if telegram_id is None or not update.effective_message:
        return ConversationHandler.END

    context.user_data[_AUTH_PHONE_KEY] = phone

    try:
        phone_user = get_or_create_user_by_phone(phone)
        if phone_user:
            link_telegram_id(
                uid=phone_user.uid,
                telegram_id=telegram_id,
                phone=phone_user.phone,
                name=phone_user.name,
                language=normalize_language(phone_user.language),
                phone_verified=phone_verified,
                phone_source=phone_source,
            )
            session = {
                "uid": phone_user.uid,
                "phone": phone_user.phone,
                "phoneVerified": phone_verified,
                "phoneSource": phone_source,
                "name": phone_user.name,
                "language": normalize_language(phone_user.language),
            }
            context.user_data[AUTH_SESSION_CACHE_KEY] = session
            _clear_conversation_state(telegram_id)
            update_last_activity(telegram_id, session_cache=session)
            await update.effective_message.reply_text(
                _completion_summary(
                    language=session["language"],
                    name=phone_user.name,
                    phone=phone_user.phone,
                    phone_source=phone_source,
                    returning=True,
                ),
                reply_markup=main_menu_keyboard(),
            )
            await update.effective_message.reply_text(
                t(session["language"], "keep_logged_in_prompt"),
                reply_markup=_keep_logged_in_keyboard(session["language"]),
            )
            return ConversationHandler.END

        _write_session(
            telegram_id,
            {
                "uid": None,
                "phone": phone,
                "phoneVerified": phone_verified,
                "phoneSource": phone_source,
            },
        )
        await update.effective_message.reply_text(
            t("en", "pick_language"),
            reply_markup=_language_keyboard(),
        )
        return LANGUAGE_SELECT
    except Exception as exc:
        logger.error("Telegram phone auth failed: %s", exc, exc_info=True)
        await update.effective_message.reply_text(
            t("en", "auth_error"),
            reply_markup=ReplyKeyboardRemove(),
        )
        return ConversationHandler.END


async def handle_language_selection(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Store the new user's language preference and ask for their name."""
    mark_update_consumed(update, context)
    query = update.callback_query
    telegram_id = get_telegram_user_id(update)
    if query is None or telegram_id is None:
        return LANGUAGE_SELECT

    await query.answer()
    _, language = (query.data or "auth_lang:en").split(":", maxsplit=1)
    language = normalize_language(language)
    context.user_data[_AUTH_LANGUAGE_KEY] = language
    _write_session(telegram_id, {"language": language})

    await query.edit_message_text(
        t(language, "language_selected", language_label=LANGUAGE_LABELS[language])
    )
    await query.message.reply_text(t(language, "ask_name"))
    return NAME_INPUT


async def handle_name_input(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Create the Firebase user and finish Telegram onboarding."""
    mark_update_consumed(update, context)
    telegram_id = get_telegram_user_id(update)
    if telegram_id is None or not update.effective_message:
        return ConversationHandler.END

    name = (update.effective_message.text or "").strip()
    language = normalize_language(context.user_data.get(_AUTH_LANGUAGE_KEY))
    if not name:
        await update.effective_message.reply_text(t(language, "ask_name"))
        return NAME_INPUT

    session = fetch_session(telegram_id) or {}
    phone = context.user_data.get(_AUTH_PHONE_KEY)
    if not phone:
        phone = session.get("phone")

    if not phone:
        await prompt_for_contact(update)
        return SHARE_CONTACT

    try:
        phone_user = get_or_create_user_by_phone(phone, name=name, language=language)
        if phone_user is None:
            raise RuntimeError("Firebase phone user was not created")

        link_telegram_id(
            uid=phone_user.uid,
            telegram_id=telegram_id,
            phone=phone_user.phone,
            name=name,
            language=language,
            phone_verified=True,
            phone_source=session.get("phoneSource") or "telegram_contact",
        )
        context.user_data[AUTH_SESSION_CACHE_KEY] = {
            "uid": phone_user.uid,
            "phone": phone_user.phone,
            "phoneVerified": True,
            "phoneSource": session.get("phoneSource") or "telegram_contact",
            "name": name,
            "language": language,
        }
        context.user_data.pop(_AUTH_PHONE_KEY, None)
        context.user_data.pop(_AUTH_LANGUAGE_KEY, None)
        _clear_conversation_state(telegram_id)
        update_last_activity(telegram_id, session_cache=context.user_data.get(AUTH_SESSION_CACHE_KEY))

        await update.effective_message.reply_text(
            _completion_summary(
                language=language,
                name=name,
                phone=phone_user.phone,
                phone_source=session.get("phoneSource") or "telegram_contact",
            ),
            reply_markup=main_menu_keyboard(),
        )
        await update.effective_message.reply_text(
            t(language, "keep_logged_in_prompt"),
            reply_markup=_keep_logged_in_keyboard(language),
        )
        return ConversationHandler.END
    except Exception as exc:
        logger.error("Telegram onboarding completion failed: %s", exc, exc_info=True)
        await update.effective_message.reply_text(t(language, "auth_error"))
        return ConversationHandler.END


async def ask_for_contact_again(update: Update, context: ContextTypes.DEFAULT_TYPE):
    mark_update_consumed(update, context)
    if update.effective_message:
        await update.effective_message.reply_text(
            t("en", "invalid_phone"),
            reply_markup=_contact_keyboard(),
            parse_mode="Markdown",
        )
    return SHARE_CONTACT


async def ask_for_name_again(update: Update, context: ContextTypes.DEFAULT_TYPE):
    mark_update_consumed(update, context)
    language = normalize_language(context.user_data.get(_AUTH_LANGUAGE_KEY))
    if update.effective_message:
        await update.effective_message.reply_text(t(language, "ask_name"))
    return NAME_INPUT


async def ask_for_language_again(update: Update, context: ContextTypes.DEFAULT_TYPE):
    mark_update_consumed(update, context)
    if update.callback_query:
        await update.callback_query.answer()
    if update.effective_message:
        await update.effective_message.reply_text(
            t("en", "pick_language"),
            reply_markup=_language_keyboard(),
        )
    return LANGUAGE_SELECT


async def clear_timed_out_auth(update: Update, context: ContextTypes.DEFAULT_TYPE):
    telegram_id = get_telegram_user_id(update)
    if telegram_id is not None:
        _session_ref(telegram_id).set(
            {
                "uid": None,
                "conversation_state": {},
                "updatedAt": fa_firestore.SERVER_TIMESTAMP,
            },
            merge=True,
        )
    context.user_data.pop(_AUTH_PHONE_KEY, None)
    context.user_data.pop(_AUTH_LANGUAGE_KEY, None)
    context.user_data.pop(AUTH_SESSION_CACHE_KEY, None)
    return ConversationHandler.END


async def handle_keep_logged_in(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Callback for the 'Keep me logged in' inline keyboard shown after auth."""
    query = update.callback_query
    if query is None:
        return
    await query.answer()

    telegram_id = get_telegram_user_id(update)
    if telegram_id is None:
        return

    keep = (query.data or "").endswith("yes")
    try:
        _session_ref(telegram_id).update({"keepLoggedIn": keep})
    except Exception as exc:
        logger.warning("Failed to set keepLoggedIn for %s: %s", telegram_id, exc)

    session = context.user_data.get(AUTH_SESSION_CACHE_KEY, {})
    session["keepLoggedIn"] = keep
    context.user_data[AUTH_SESSION_CACHE_KEY] = session

    language = normalize_language(session.get("language"))
    msg_key = "keep_logged_in_set" if keep else "keep_logged_in_skipped"
    await query.edit_message_text(t(language, msg_key))


def build_auth_conversation_handler(conversation_timeout: int | None = 600) -> ConversationHandler:
    """Build the auth ConversationHandler registered before normal bot handlers."""
    language_pattern = "^auth_lang:(" + "|".join(SUPPORTED_LANGUAGES) + ")$"
    with warnings.catch_warnings():
        warnings.filterwarnings(
            "ignore",
            message="If 'per_message=False', 'CallbackQueryHandler' will not be tracked for every message.*",
            category=PTBUserWarning,
        )
        return ConversationHandler(
            name=AUTH_CONVERSATION_NAME,
            persistent=True,
            entry_points=[
                CommandHandler("start", start_auth),
                CommandHandler("login", start_auth),
                MessageHandler(filters.ALL, start_auth),
            ],
            states={
                SHARE_CONTACT: [
                    MessageHandler(filters.CONTACT, handle_contact),
                    MessageHandler(filters.ALL, ask_for_contact_again),
                ],
                LANGUAGE_SELECT: [
                    CallbackQueryHandler(handle_language_selection, pattern=language_pattern),
                    CallbackQueryHandler(ask_for_language_again),
                    MessageHandler(filters.ALL, ask_for_language_again),
                ],
                NAME_INPUT: [
                    MessageHandler(filters.TEXT & ~filters.COMMAND, handle_name_input),
                    MessageHandler(filters.ALL, ask_for_name_again),
                ],
                ConversationHandler.TIMEOUT: [
                    MessageHandler(filters.ALL, clear_timed_out_auth),
                    CallbackQueryHandler(clear_timed_out_auth),
                ],
            },
            fallbacks=[CommandHandler("start", start_auth)],
            conversation_timeout=conversation_timeout,
            allow_reentry=True,
        )
