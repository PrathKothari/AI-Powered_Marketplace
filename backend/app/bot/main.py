"""
KalaSetu Telegram Bot — Entry point.

Can run standalone (python -m app.bot.main) OR be started as a
background thread from the FastAPI application.
"""

import asyncio
import logging
import threading

from telegram.ext import ApplicationBuilder, CommandHandler, MessageHandler, filters

from app.core.config import settings
from app.bot.handlers import (
    start_command,
    help_command,
    handle_text_message,
    handle_image_message,
)

logger = logging.getLogger(__name__)

_bot_thread: threading.Thread | None = None


def _build_app():
    """Build the telegram Application with all handlers registered."""
    token = settings.TELEGRAM_BOT_TOKEN
    app = ApplicationBuilder().token(token).build()

    app.add_handler(CommandHandler("start", start_command))
    app.add_handler(CommandHandler("help", help_command))
    app.add_handler(MessageHandler(filters.PHOTO, handle_image_message))
    app.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, handle_text_message))

    return app


async def _run_bot_async():
    """Run the bot using the low-level async API (no signal handlers)."""
    app = _build_app()

    await app.initialize()
    await app.start()
    await app.updater.start_polling(drop_pending_updates=True)

    logger.info("🤖 KalaSetu Telegram Bot started — https://t.me/KalaSetu_bot")

    # Keep running until the thread is interrupted
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

    # Standalone mode — use run_polling in main thread (signal handlers work here)
    app = _build_app()
    logger.info("🤖 KalaSetu Bot is starting... (Press Ctrl+C to stop)")
    app.run_polling(drop_pending_updates=True)
