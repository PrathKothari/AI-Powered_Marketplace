# Telegram Bot — Auth & Onboarding Design

**Date:** 2026-05-04  
**Phase:** 1 of 5 (Auth + Onboarding)  
**Status:** Approved

---

## Overview

Extend the existing KalaSetu Telegram bot (`backend/app/bot/`) to handle user authentication and onboarding entirely within the conversation — no browser, no web redirect. Any message from an unauthenticated user triggers the auth flow inline. Unified accounts (no buyer/seller role split). Multilingual support for Hindi, English, Bengali, Marathi, Tamil, and Gujarati.

---

## Conversation Flow

### Any first message (unauthenticated user)

```
User sends ANY message (text / photo / voice / etc.)
  ↓
require_auth middleware checks telegram_sessions/{tg_id} in Firestore
  ↓
Not authenticated → start auth flow:

Bot: "Hi! Please share your contact to get started." [Share Contact button]
User: [taps button — phone number shared]
  ↓
Check Firebase Auth by phone number
  ↓
  ├── Found → returning user
  │     Bot: "Welcome back, {name}! 🙏"
  │     Store telegramId + restore language pref → authenticated
  │
  └── Not found → new user
        Bot: shows language picker (inline keyboard)
             [English] [हिंदी] [বাংলা] [मराठी] [தமிழ்] [ગુજરાતી]
        User: [picks language]
        Bot: "What is your name?" (in chosen language)
        User: "Ramesh Kumar"
        Bot: "Welcome, Ramesh! 🙏 You're all set." (in chosen language)
             "Please re-send your message!"
        → Firebase user created, Firestore doc written, authenticated
```

### `/start` command

Still supported as the Telegram-recommended entry point (shown as the default CTA when opening a new bot). Triggers the same auth check — if already authenticated, replies with "Welcome back, {name}!" immediately.

### Already authenticated user

Every subsequent message bypasses the auth flow entirely (one Firestore read confirms the session, then routes normally to search/chat handlers).

---

## Architecture

### New files

```
backend/app/bot/
  auth/
    __init__.py
    conversation.py      — ConversationHandler + state machine (SHARE_CONTACT → LANGUAGE_SELECT → NAME_INPUT → done)
    persistence.py       — FirestoreConversationPersistence: saves PTB state to Firestore so restarts don't lose mid-signup progress
    middleware.py        — require_auth() decorator used by all message handlers
    strings.py           — hardcoded auth prompts in all 6 languages (no Gemini dependency in auth flow)
  utils/
    __init__.py
    firebase_phone.py    — get_or_create_user_by_phone(), link_telegram_id() using Firebase Admin SDK
```

### Modified files

- `bot/main.py` — register `AuthConversationHandler`; wire `require_auth` into existing handlers
- `bot/handlers.py` — wrap `handle_text_message` and `handle_image_message` with `require_auth`

### Component responsibilities

| Component | Responsibility |
|---|---|
| `FirestoreConversationPersistence` | Saves PTB ConversationHandler state to `telegram_sessions/{tg_id}`; restores on bot restart |
| `AuthConversationHandler` | PTB state machine: SHARE_CONTACT → LANGUAGE_SELECT → NAME_INPUT → done |
| `require_auth` | Intercepts every message; checks `telegram_sessions/{tg_id}` for linked `uid`; if missing, triggers auth flow |
| `firebase_phone.py` | Firebase Admin SDK calls — `get_user_by_phone_number` / `create_user`; no OTP, no reCAPTCHA |
| `strings.py` | All auth prompts in en/hi/bn/mr/ta/gu; used during auth flow before language pref is known |

---

## Data Model

### `users/{uid}` (Firestore — existing collection, new fields added)

```
telegramId: string       — Telegram user ID, for quick reverse-lookup
phone:      string       — E.164 format, e.g. "+919876543210"
name:       string
language:   string       — "en" | "hi" | "bn" | "mr" | "ta" | "gu"
createdAt:  timestamp
```

### `telegram_sessions/{tg_id}` (Firestore — new collection)

```
uid:                string    — linked Firebase Auth UID (null if mid-signup)
language:           string    — chosen language code
conversation_state: map       — PTB ConversationHandler persistence blob
updatedAt:          timestamp
```

---

## Language System

### Auth flow prompts (`strings.py`)

All prompts for the auth flow are hardcoded in all 6 languages. No Gemini dependency — auth works even if the AI service is unavailable.

```python
STRINGS = {
    "en": {
        "share_contact": "Hi! Please share your contact to get started.",
        "pick_language": "Choose your language:",
        "ask_name":      "What's your name?",
        "welcome_new":   "Welcome, {name}! 🙏 You're all set. Please re-send your message!",
        "welcome_back":  "Welcome back, {name}! 🙏",
    },
    "hi": {
        "share_contact": "नमस्ते! शुरू करने के लिए अपना नंबर शेयर करें।",
        "pick_language": "अपनी भाषा चुनें:",
        "ask_name":      "आपका नाम क्या है?",
        "welcome_new":   "स्वागत है, {name}! 🙏 आप तैयार हैं। अपना संदेश दोबारा भेजें!",
        "welcome_back":  "वापसी पर स्वागत है, {name}! 🙏",
    },
    # bn, mr, ta, gu follow same structure
}
```

Language selection is an inline keyboard with native-script button labels:
`[English]  [हिंदी]  [বাংলা]  [मराठी]  [தமிழ்]  [ગુજરાતી]`

### Gemini responses after auth

Existing `handle_text_message` and `handle_image_message` handlers pass a language instruction to Gemini:
```
"Always respond in {language_name}."
```
No structural changes to the handlers — just inject the language from the user's session.

---

## Firebase Phone Auth

- Phone number obtained from Telegram's `contact.phone_number` (Telegram-verified, no additional OTP needed)
- Normalised to E.164 format before any Firebase call
- `firebase_admin.auth.get_user_by_phone_number(phone)` — returns existing user or raises `UserNotFoundError`
- `firebase_admin.auth.create_user(phone_number=phone, display_name=name)` — creates new user
- `telegramId` written to `users/{uid}` doc; `uid` written to `telegram_sessions/{tg_id}`

---

## Edge Cases

| Scenario | Handling |
|---|---|
| Message sent before auth is complete | `require_auth` intercepts, starts auth flow |
| Phone already linked to a different Telegram ID | Overwrite `telegramId` — one phone, one account |
| User abandons signup mid-flow (silent for 10 min) | PTB conversation times out, session state cleared from Firestore; user restarts naturally on next message |
| Firebase phone auth fails | Bot sends a generic error in English (language unknown at failure point), exception logged, no Firebase internals exposed |
| `/start` sent by already-authenticated user | Skip auth flow, reply "Welcome back, {name}!" immediately |
| Language not in supported set | Default to English |

---

## Testing

- **Unit:** `firebase_phone.py` — mock Firebase Admin SDK; verify get/create paths
- **Unit:** `strings.py` — assert all 6 languages have all required keys
- **Unit:** `middleware.py` — mock Firestore; verify authenticated vs unauthenticated routing
- **Integration:** ConversationHandler state machine — mock PTB `Update` objects through SHARE_CONTACT → LANGUAGE_SELECT → NAME_INPUT states; assert Firestore writes

---

## Out of Scope (future phases)

- Auto-detect language from user's message text (Phase 1 uses explicit picker; auto-detect is Phase 5)
- SMS OTP double-verification (not needed; Telegram phone is trusted)
- Linking an existing website account to the bot account
- Buyer/seller role distinction (accounts are unified)
