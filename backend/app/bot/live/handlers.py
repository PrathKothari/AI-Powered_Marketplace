"""Live stream handlers for the KalaSetu Telegram Bot (Phase 6)."""

from __future__ import annotations

import logging
from typing import Any, Dict, List

from firebase_admin import firestore as fa_firestore
from telegram import InlineKeyboardButton, InlineKeyboardMarkup, Update
from telegram.constants import ParseMode
from telegram.ext import ContextTypes

from app.bot.auth.middleware import AUTH_SESSION_CACHE_KEY, require_auth

logger = logging.getLogger(__name__)

PAGE_SIZE = 5


def _db():
    return fa_firestore.client()


# ──────────────────────────────────────────────
# Keyboard builders
# ──────────────────────────────────────────────

def _live_list_keyboard(
    sessions: List[Dict[str, Any]], page: int, total: int
) -> InlineKeyboardMarkup:
    rows: List[List[InlineKeyboardButton]] = []
    for s in sessions:
        sid = s.get("id") or s.get("sessionId") or ""
        title = (s.get("title") or "Live Stream")[:30]
        viewers = s.get("viewerCount", 0)
        rows.append(
            [InlineKeyboardButton(f"🔴 {title} ({viewers} watching)", callback_data=f"live:join:{sid}")]
        )

    nav: List[InlineKeyboardButton] = []
    total_pages = max(1, (total + PAGE_SIZE - 1) // PAGE_SIZE)
    if page > 0:
        nav.append(InlineKeyboardButton("⬅️ Prev", callback_data=f"live:list:{page - 1}"))
    if page < total_pages - 1:
        nav.append(InlineKeyboardButton("Next ➡️", callback_data=f"live:list:{page + 1}"))
    if nav:
        rows.append(nav)

    return InlineKeyboardMarkup(rows)


def _live_session_keyboard(session_id: str) -> InlineKeyboardMarkup:
    return InlineKeyboardMarkup(
        [
            [InlineKeyboardButton("💬 Send a chat message", callback_data=f"live:chat:{session_id}")],
            [InlineKeyboardButton("🔙 Back to streams", callback_data="live:list:0")],
        ]
    )


# ──────────────────────────────────────────────
# Public handlers
# ──────────────────────────────────────────────

@require_auth
async def show_live_streams(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Display active live streams."""
    await _send_live_list(update, context, page=0, edit=False)


async def _send_live_list(
    update: Update,
    context: ContextTypes.DEFAULT_TYPE,
    page: int,
    edit: bool,
) -> None:
    db = _db()
    try:
        docs = (
            db.collection("live_sessions")
            .where("status", "==", "live")
            .limit(50)
            .stream()
        )
        sessions: List[Dict[str, Any]] = []
        for doc in docs:
            s = doc.to_dict() or {}
            s["id"] = doc.id
            sessions.append(s)
    except Exception as exc:
        logger.error("Failed to fetch live sessions: %s", exc)
        sessions = []

    if not sessions:
        msg = "📡 No live streams right now. Check back later!"
        if edit and update.callback_query:
            await update.callback_query.edit_message_text(msg)
        else:
            await update.effective_message.reply_text(msg)
        return

    total = len(sessions)
    start = page * PAGE_SIZE
    page_sessions = sessions[start : start + PAGE_SIZE]

    text = f"📡 *Live Streams* ({total} active)"
    keyboard = _live_list_keyboard(page_sessions, page, total)

    if edit and update.callback_query:
        await update.callback_query.edit_message_text(
            text, parse_mode=ParseMode.MARKDOWN, reply_markup=keyboard
        )
    else:
        await update.effective_message.reply_text(
            text, parse_mode=ParseMode.MARKDOWN, reply_markup=keyboard
        )


async def handle_live_callback(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Route all live: callbacks."""
    query = update.callback_query
    await query.answer()
    data: str = query.data or ""

    # ── live:list:{page} ──────────────────────────────────────────────────
    if data.startswith("live:list:"):
        page = int(data.split(":", 2)[2])
        await _send_live_list(update, context, page=page, edit=True)
        return

    # ── live:join:{session_id} ────────────────────────────────────────────
    if data.startswith("live:join:"):
        session_id = data[len("live:join:"):]
        db = _db()
        try:
            doc = db.collection("live_sessions").document(session_id).get()
        except Exception as exc:
            logger.error("Failed to fetch live session %s: %s", session_id, exc)
            await query.edit_message_text("Could not load stream details.")
            return

        if not doc.exists:
            await query.edit_message_text("Stream not found or has ended.")
            return

        s: Dict[str, Any] = doc.to_dict() or {}
        title = s.get("title") or "Live Stream"
        desc = (s.get("description") or "")[:200]
        viewers = s.get("viewerCount", 0)
        hls_url = s.get("hlsUrl") or ""

        lines = [
            f"🔴 *{title}*",
            f"👥 {viewers} watching",
        ]
        if desc:
            lines.append(f"\n_{desc}_")
        if hls_url:
            lines.append(f"\n📺 [Watch Stream]({hls_url})")
        else:
            lines.append("\n_Stream URL not yet available. Use the chat below to interact!_")

        # Fetch last 5 chat messages
        try:
            chat_docs = (
                db.collection("live_chat_messages")
                .where("sessionId", "==", session_id)
                .order_by("createdAt", direction=fa_firestore.Query.DESCENDING)
                .limit(5)
                .stream()
            )
            chat_msgs: List[Dict[str, Any]] = []
            for cdoc in chat_docs:
                chat_msgs.append(cdoc.to_dict() or {})
            chat_msgs.reverse()
        except Exception:
            chat_msgs = []

        if chat_msgs:
            lines.append("\n💬 *Recent Chat:*")
            for msg in chat_msgs:
                sender = msg.get("userName") or "User"
                text = (msg.get("text") or "")[:80]
                lines.append(f"  {sender}: {text}")

        await query.edit_message_text(
            "\n".join(lines),
            parse_mode=ParseMode.MARKDOWN,
            reply_markup=_live_session_keyboard(session_id),
            disable_web_page_preview=False,
        )
        return

    # ── live:chat:{session_id} ────────────────────────────────────────────
    if data.startswith("live:chat:"):
        session_id = data[len("live:chat:"):]
        context.user_data["_live_chat_session"] = session_id
        await query.answer()
        await query.message.reply_text(
            "Type your chat message and send it. It will be posted to the live stream.",
        )
        return


async def post_live_chat(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Post a user's text message to the active live chat session."""
    session_id: str = context.user_data.get("_live_chat_session") or ""
    if not session_id:
        return  # Not in a live chat context — let other handlers process

    session: Dict[str, Any] = context.user_data.get(AUTH_SESSION_CACHE_KEY) or {}
    uid: str = session.get("uid") or ""
    user_name: str = session.get("name") or session.get("displayName") or "User"
    text = (update.message.text or "").strip()
    if not text:
        return

    db = _db()
    try:
        db.collection("live_chat_messages").add(
            {
                "sessionId": session_id,
                "userId": uid,
                "userName": user_name,
                "text": text,
                "createdAt": fa_firestore.SERVER_TIMESTAMP,
            }
        )
        # Clear session so next message isn't also treated as chat
        context.user_data.pop("_live_chat_session", None)
        await update.message.reply_text("💬 Message sent to the live chat!")
    except Exception as exc:
        logger.error("Failed to post live chat message for session %s: %s", session_id, exc)
        await update.message.reply_text("Could not send message. Please try again.")
