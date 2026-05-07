"""Firestore-backed persistence for Telegram auth conversation state."""

from __future__ import annotations

import asyncio
import logging
from collections.abc import MutableMapping
from typing import Any

from firebase_admin import firestore as fa_firestore
from telegram.ext import BasePersistence

logger = logging.getLogger(__name__)


class FirestoreConversationPersistence(BasePersistence):
    """Persist PTB ConversationHandler states under telegram_sessions/{tg_id}."""

    def __init__(self, update_interval: int = 30):
        super().__init__(update_interval=update_interval)

    def _sessions(self):
        return fa_firestore.client().collection("telegram_sessions")

    async def get_conversations(self, name: str) -> dict[tuple[Any, ...], Any]:
        # Returning an empty dict on startup is intentional — we rely on
        # update_conversation to write state incrementally. Scanning the entire
        # collection on every restart would be expensive at scale and is
        # unnecessary because incomplete auth sessions time out at 10 minutes.
        return {}

    def _do_update_conversation(self, name: str, key: tuple[Any, ...], new_state: Any) -> None:
        telegram_id = self._telegram_id_from_key(key)
        if telegram_id is None:
            return
        ref = self._sessions().document(str(telegram_id))
        if new_state is None:
            ref.update(
                {
                    f"conversation_state.{name}": fa_firestore.DELETE_FIELD,
                    "updatedAt": fa_firestore.SERVER_TIMESTAMP,
                }
            )
        else:
            ref.set(
                {
                    "conversation_state": {name: {"key": list(key), "state": new_state}},
                    "updatedAt": fa_firestore.SERVER_TIMESTAMP,
                },
                merge=True,
            )

    async def update_conversation(self, name: str, key: tuple[Any, ...], new_state: Any) -> None:
        try:
            loop = asyncio.get_event_loop()
            await loop.run_in_executor(None, self._do_update_conversation, name, key, new_state)
        except Exception as exc:
            logger.error("Failed to persist Telegram conversation state: %s", exc)

    @staticmethod
    def _telegram_id_from_key(key: tuple[Any, ...]) -> Any | None:
        if not key:
            return None
        if len(key) >= 2:
            return key[1]
        return key[0]

    async def get_user_data(self) -> dict[int, dict[str, Any]]:
        return {}

    async def update_user_data(self, user_id: int, data: MutableMapping[str, Any]) -> None:
        return None

    async def refresh_user_data(self, user_id: int, user_data: MutableMapping[str, Any]) -> None:
        return None

    async def drop_user_data(self, user_id: int) -> None:
        return None

    async def get_chat_data(self) -> dict[int, dict[str, Any]]:
        return {}

    async def update_chat_data(self, chat_id: int, data: MutableMapping[str, Any]) -> None:
        return None

    async def refresh_chat_data(self, chat_id: int, chat_data: MutableMapping[str, Any]) -> None:
        return None

    async def drop_chat_data(self, chat_id: int) -> None:
        return None

    async def get_bot_data(self) -> dict[str, Any]:
        return {}

    async def update_bot_data(self, data: MutableMapping[str, Any]) -> None:
        return None

    async def refresh_bot_data(self, bot_data: MutableMapping[str, Any]) -> None:
        return None

    async def get_callback_data(self) -> Any:
        return None

    async def update_callback_data(self, data: Any) -> None:
        return None

    async def flush(self) -> None:
        return None
