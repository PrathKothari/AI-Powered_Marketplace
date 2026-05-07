"""
KalaSetu Telegram Bot — Entry point.

Can run standalone (python -m app.bot.main) OR be started as a
background thread from the FastAPI application.
"""

import asyncio
import logging
import threading

from telegram.error import InvalidToken
from telegram.ext import (
    ApplicationBuilder,
    CallbackQueryHandler,
    CommandHandler,
    MessageHandler,
    filters,
)

from app.bot.auth.conversation import build_auth_conversation_handler, handle_keep_logged_in
from app.bot.auth.persistence import FirestoreConversationPersistence
from app.bot.cart.handlers import handle_cart_callback
from app.bot.catalog.handlers import handle_catalog_callback, show_recommendations
from app.bot.handlers import (
    handle_image_message,
    handle_text_message,
    help_command,
    start_command,
)
from app.bot.live.handlers import handle_live_callback, post_live_chat
from app.bot.notifications.dispatcher import register_notification_jobs
from app.bot.orders.handlers import build_checkout_conversation_handler, handle_order_callbacks
from app.bot.payments.handlers import handle_pay_callback
from app.bot.sell.conversation import build_sell_conversation_handler
from app.core.config import settings

logger = logging.getLogger(__name__)
logging.getLogger("httpx").setLevel(logging.WARNING)

_bot_thread: threading.Thread | None = None


def _build_app():
    """Build the telegram Application with all handlers registered."""
    token = settings.TELEGRAM_BOT_TOKEN
    app = (
        ApplicationBuilder()
        .token(token)
        .persistence(FirestoreConversationPersistence())
        .build()
    )

    conversation_timeout = 600 if getattr(app, "_job_queue", None) is not None else None

    # ── Group 0: Auth ConversationHandler (highest priority) ──────────────
    app.add_handler(build_auth_conversation_handler(conversation_timeout=conversation_timeout), group=0)

    # ── Group 1: Feature ConversationHandlers ────────────────────────────
    app.add_handler(build_sell_conversation_handler(), group=1)
    app.add_handler(build_checkout_conversation_handler(), group=1)

    # ── Group 2: Commands & keep-logged-in callback ───────────────────────
    app.add_handler(CommandHandler("start", start_command), group=2)
    app.add_handler(CommandHandler("help", help_command), group=2)
    app.add_handler(CallbackQueryHandler(handle_keep_logged_in, pattern=r"^auth_keep:(yes|no)$"), group=2)

    # ── Group 3: Catalog callbacks (cat:, prod:, artisan:) ────────────────
    app.add_handler(
        CallbackQueryHandler(handle_catalog_callback, pattern=r"^(cat:|prod:|artisan:)"),
        group=3,
    )

    # ── Group 4: Cart callbacks (cart_add:, cart_remove:, cart_clear, cart_detail:) ──
    app.add_handler(
        CallbackQueryHandler(
            handle_cart_callback,
            pattern=r"^(cart_add:|cart_remove:|cart_clear|cart_detail:)",
        ),
        group=4,
    )

    # ── Group 5: Order & checkout callbacks ──────────────────────────────
    app.add_handler(
        CallbackQueryHandler(
            handle_order_callbacks,
            pattern=r"^(order_list:|order_detail:|order_ship:|order_confirm:)",
        ),
        group=5,
    )

    # ── Group 6: Payment callbacks ────────────────────────────────────────
    app.add_handler(CallbackQueryHandler(handle_pay_callback, pattern=r"^pay:"), group=6)

    # ── Group 7: Live stream callbacks ────────────────────────────────────
    app.add_handler(
        CallbackQueryHandler(handle_live_callback, pattern=r"^live:"),
        group=7,
    )

    # ── Group 8: Recommendations shortcut ────────────────────────────────
    app.add_handler(CommandHandler("recommendations", show_recommendations), group=8)

    # ── Group 9: Image & text message handlers ────────────────────────────
    # Live chat intercept: if user is in a live:chat session, post to Firestore
    app.add_handler(
        MessageHandler(filters.TEXT & ~filters.COMMAND, post_live_chat),
        group=9,
    )
    app.add_handler(MessageHandler(filters.PHOTO, handle_image_message), group=9)
    # General text (menu taps + AI chat/search) — lower priority than live chat
    app.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, handle_text_message), group=10)

    # ── Notification jobs ─────────────────────────────────────────────────
    if app.job_queue is not None:
        register_notification_jobs(app.job_queue)

    return app


async def _run_bot_async():
    """Run the bot using the low-level async API (no signal handlers)."""
    app = _build_app()

    await app.initialize()
    await app.start()
    await app.updater.start_polling(drop_pending_updates=True)

    logger.info("🤖 KalaSetu Telegram Bot started — https://t.me/KalaSetu_bot")

    try:
        while True:
            await asyncio.sleep(1)
    except (asyncio.CancelledError, KeyboardInterrupt):
        pass
    finally:
        await app.updater.stop()
        await app.stop()
        await app.shutdown()


def _run_bot_in_thread():
    """Create a new event loop in this thread and run the bot."""
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    try:
        loop.run_until_complete(_run_bot_async())
    except Exception as e:
        logger.error("Telegram bot crashed: %s", e)
    finally:
        loop.close()


def start_bot_background():
    """Start the Telegram bot in a daemon background thread.
    Called from FastAPI's lifespan event so everything runs in one process."""
    global _bot_thread

    if not settings.TELEGRAM_BOT_TOKEN:
        logger.warning("TELEGRAM_BOT_TOKEN not set — Telegram bot will NOT start.")
        return

    if _bot_thread and _bot_thread.is_alive():
        logger.info("Telegram bot is already running.")
        return

    _bot_thread = threading.Thread(target=_run_bot_in_thread, daemon=True, name="telegram-bot")
    _bot_thread.start()
    logger.info("Telegram bot thread launched.")


# Allow standalone execution: python -m app.bot.main
if __name__ == "__main__":
    import sys
    from app.core.firebase import init_firebase

    logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")

    if not settings.TELEGRAM_BOT_TOKEN:
        logger.error("TELEGRAM_BOT_TOKEN is not set in .env. Exiting.")
        sys.exit(1)

    init_firebase()

    app = _build_app()
    logger.info("🤖 KalaSetu Bot is starting... (Press Ctrl+C to stop)")
    try:
        app.run_polling(drop_pending_updates=True)
    except InvalidToken:
        logger.error(
            "Telegram bot token is invalid. Generate a new token in BotFather, "
            "update TELEGRAM_BOT_TOKEN in backend/.env, then restart the bot."
        )
        sys.exit(1)
