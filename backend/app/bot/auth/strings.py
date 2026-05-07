"""Localized Telegram auth flow strings."""

from __future__ import annotations

from typing import Final


SUPPORTED_LANGUAGES: Final[tuple[str, ...]] = ("en", "hi", "bn", "mr", "ta", "gu")

LANGUAGE_LABELS: Final[dict[str, str]] = {
    "en": "English",
    "hi": "हिंदी",
    "bn": "বাংলা",
    "mr": "मराठी",
    "ta": "தமிழ்",
    "gu": "ગુજરાતી",
}

LANGUAGE_NAMES: Final[dict[str, str]] = {
    "en": "English",
    "hi": "Hindi",
    "bn": "Bengali",
    "mr": "Marathi",
    "ta": "Tamil",
    "gu": "Gujarati",
}

STRINGS: Final[dict[str, dict[str, str]]] = {
    "en": {
        "share_contact": "👋 Welcome to KalaSetu!\n\n👇 Tap the *Share Contact* button that just appeared at the bottom of your screen to verify your number and get started.",
        "share_contact_button": "Share Contact",
        "invalid_phone": "👇 Please tap the *Share Contact* button at the bottom of your screen.\n\nOn Telegram Web: look for the keyboard icon (⌨️) next to the message input box.",
        "language_selected": "Language selected: {language_label}",
        "pick_language": "Choose your language:",
        "ask_name": "What's your name?",
        "welcome_new_header": "Welcome, {name}! \U0001f64f You're all set.",
        "welcome_new": "Welcome, {name}! \U0001f64f You're all set.\n\nLanguage: {language_label}\nPhone: {phone}\nVerification: Telegram contact verified\n\nPlease re-send your message!",
        "welcome_back": "Welcome back, {name}! \U0001f64f",
        "auth_error": "Sorry, I couldn't set up your account right now. Please try again in a moment.",
        "profile": "Your KalaSetu profile:\n\nName: {name}\nLanguage: {language_label}\nPhone: {phone}\nVerification: {verification}",
        "verified_contact": "Telegram contact verified",
        "not_verified": "Not verified",
        "session_restored": "Your session had expired. Welcome back, {name}! \U0001f64f You're all set.",
        "keep_logged_in_prompt": "Would you like to stay logged in?",
        "keep_logged_in_yes": "Keep me logged in (7 days)",
        "keep_logged_in_no": "Log out after 1 hour",
        "keep_logged_in_set": "Done! You'll stay logged in for 7 days.",
        "keep_logged_in_skipped": "OK! You'll be logged out after 1 hour of inactivity.",
    },
    "hi": {
        "share_contact": "नमस्ते! शुरू करने के लिए नीचे दिए बटन से अपना नंबर शेयर करें।",
        "share_contact_button": "संपर्क शेयर करें",
        "invalid_phone": "कृपया नीचे Share Contact बटन दबाएं।",
        "language_selected": "भाषा चुनी गई: {language_label}",
        "pick_language": "अपनी भाषा चुनें:",
        "ask_name": "आपका नाम क्या है?",
        "welcome_new_header": "स्वागत है, {name}! \U0001f64f आप तैयार हैं।",
        "welcome_new": "स्वागत है, {name}! \U0001f64f आप तैयार हैं।\n\nभाषा: {language_label}\nफोन: {phone}\nसत्यापन: Telegram contact verified\n\nअपना संदेश दोबारा भेजें!",
        "welcome_back": "वापसी पर स्वागत है, {name}! \U0001f64f",
        "auth_error": "माफ कीजिए, अभी आपका खाता सेट नहीं हो पाया। कृपया थोड़ी देर बाद फिर कोशिश करें।",
        "profile": "आपकी KalaSetu प्रोफाइल:\n\nनाम: {name}\nभाषा: {language_label}\nफोन: {phone}\nसत्यापन: {verification}",
        "verified_contact": "Telegram contact verified",
        "not_verified": "सत्यापित नहीं",
        "session_restored": "आपका session expire हो गया था। वापसी पर स्वागत है, {name}! \U0001f64f आप तैयार हैं।",
        "keep_logged_in_prompt": "क्या आप logged in रहना चाहते हैं?",
        "keep_logged_in_yes": "7 दिन तक logged in रखें",
        "keep_logged_in_no": "1 घंटे बाद logout करें",
        "keep_logged_in_set": "ठीक है! आप 7 दिनों तक logged in रहेंगे।",
        "keep_logged_in_skipped": "ठीक है! 1 घंटे की निष्क्रियता के बाद logout हो जाएगा।",
    },
    "bn": {
        "share_contact": "নমস্কার! শুরু করতে নিচের বোতাম দিয়ে আপনার নম্বর শেয়ার করুন।",
        "share_contact_button": "যোগাযোগ শেয়ার করুন",
        "invalid_phone": "নিচের Share Contact বোতাম চাপুন।",
        "language_selected": "ভাষা নির্বাচিত: {language_label}",
        "pick_language": "আপনার ভাষা বেছে নিন:",
        "ask_name": "আপনার নাম কী?",
        "welcome_new_header": "স্বাগতম, {name}! \U0001f64f সব তৈরি।",
        "welcome_new": "স্বাগতম, {name}! \U0001f64f সব তৈরি।\n\nভাষা: {language_label}\nফোন: {phone}\nযাচাই: Telegram contact verified\n\nআপনার বার্তাটি আবার পাঠান!",
        "welcome_back": "আবার স্বাগতম, {name}! \U0001f64f",
        "auth_error": "দুঃখিত, এখন আপনার অ্যাকাউন্ট সেট আপ করা গেল না। একটু পরে আবার চেষ্টা করুন।",
        "profile": "আপনার KalaSetu প্রোফাইল:\n\nনাম: {name}\nভাষা: {language_label}\nফোন: {phone}\nযাচাই: {verification}",
        "verified_contact": "Telegram contact verified",
        "not_verified": "যাচাই হয়নি",
        "session_restored": "আপনার session মেয়াদোত্তীর্ণ হয়েছিল। আবার স্বাগতম, {name}! \U0001f64f সব তৈরি।",
        "keep_logged_in_prompt": "আপনি কি logged in থাকতে চান?",
        "keep_logged_in_yes": "৭ দিন logged in রাখুন",
        "keep_logged_in_no": "১ ঘণ্টা পরে logout করুন",
        "keep_logged_in_set": "ঠিক আছে! আপনি ৭ দিন logged in থাকবেন।",
        "keep_logged_in_skipped": "ঠিক আছে! ১ ঘণ্টা নিষ্ক্রিয় থাকলে logout হবেন।",
    },
    "mr": {
        "share_contact": "नमस्कार! सुरुवात करण्यासाठी खालील बटण दाबा आणि आपला नंबर शेअर करा.",
        "share_contact_button": "संपर्क शेअर करा",
        "invalid_phone": "कृपया खाली Share Contact बटण दाबा.",
        "language_selected": "भाषा निवडली: {language_label}",
        "pick_language": "आपली भाषा निवडा:",
        "ask_name": "आपले नाव काय आहे?",
        "welcome_new_header": "स्वागत आहे, {name}! \U0001f64f आपण तयार आहात.",
        "welcome_new": "स्वागत आहे, {name}! \U0001f64f आपण तयार आहात.\n\nभाषा: {language_label}\nफोन: {phone}\nपडताळणी: Telegram contact verified\n\nकृपया आपला संदेश पुन्हा पाठवा!",
        "welcome_back": "पुन्हा स्वागत आहे, {name}! \U0001f64f",
        "auth_error": "माफ करा, आत्ता आपले खाते सेट करता आले नाही. कृपया थोड्या वेळाने पुन्हा प्रयत्न करा.",
        "profile": "आपली KalaSetu प्रोफाइल:\n\nनाव: {name}\nभाषा: {language_label}\nफोन: {phone}\nपडताळणी: {verification}",
        "verified_contact": "Telegram contact verified",
        "not_verified": "पडताळलेले नाही",
        "session_restored": "तुमचा session expire झाला होता. पुन्हा स्वागत आहे, {name}! \U0001f64f आपण तयार आहात.",
        "keep_logged_in_prompt": "तुम्हाला logged in राहायचे आहे का?",
        "keep_logged_in_yes": "7 दिवस logged in राहा",
        "keep_logged_in_no": "1 तासानंतर logout करा",
        "keep_logged_in_set": "ठीक आहे! तुमी 7 दिवस logged in राहाल.",
        "keep_logged_in_skipped": "ठीक आहे! 1 तास निष्क्रिय राहिल्यास logout होईल.",
    },
    "ta": {
        "share_contact": "வணக்கம்! தொடங்க கீழே உள்ள பட்டனை தடவி உங்கள் தொடர்பை பகிரவும்.",
        "share_contact_button": "தொடர்பை பகிரவும்",
        "invalid_phone": "கீழே உள்ள Share Contact பட்டனை தடவும்.",
        "language_selected": "மொழி தேர்ந்தெடுக்கப்பட்டது: {language_label}",
        "pick_language": "உங்கள் மொழியைத் தேர்வு செய்யவும்:",
        "ask_name": "உங்கள் பெயர் என்ன?",
        "welcome_new_header": "வரவேற்கிறோம், {name}! \U0001f64f அனைத்தும் தயார்.",
        "welcome_new": "வரவேற்கிறோம், {name}! \U0001f64f அனைத்தும் தயார்.\n\nமொழி: {language_label}\nதொலைபேசி: {phone}\nசரிபார்ப்பு: Telegram contact verified\n\nஉங்கள் செய்தியை மீண்டும் அனுப்பவும்!",
        "welcome_back": "மீண்டும் வரவேற்கிறோம், {name}! \U0001f64f",
        "auth_error": "மன்னிக்கவும், இப்போது உங்கள் கணக்கை அமைக்க முடியவில்லை. சிறிது நேரத்தில் மீண்டும் முயற்சிக்கவும்.",
        "profile": "உங்கள் KalaSetu சுயவிவரம்:\n\nபெயர்: {name}\nமொழி: {language_label}\nதொலைபேசி: {phone}\nசரிபார்ப்பு: {verification}",
        "verified_contact": "Telegram contact verified",
        "not_verified": "சரிபார்க்கப்படவில்லை",
        "session_restored": "உங்கள் session காலாவதியாகியது. மீண்டும் வரவேற்கிறோம், {name}! \U0001f64f அனைத்தும் தயார்.",
        "keep_logged_in_prompt": "நீங்கள் logged in ஆக இருக்க விரும்புகிறீர்களா?",
        "keep_logged_in_yes": "7 நாட்கள் logged in ஆக இருங்கள்",
        "keep_logged_in_no": "1 மணி நேரம் கழித்து logout ஆகுங்கள்",
        "keep_logged_in_set": "சரி! நீங்கள் 7 நாட்கள் logged in ஆக இரப்பீர்கள்.",
        "keep_logged_in_skipped": "சரி! 1 மணி நேரம் செயலற்று இருந்தால் logout ஆவீர்கள்.",
    },
    "gu": {
        "share_contact": "એક ક્ષણ! શરૂ કરવા નીચેના બટન દાબી તમારો સંપર્ક શેર કરો.",
        "share_contact_button": "સંપર્ક શેર કરો",
        "invalid_phone": "કૃપા કરીને નીચે Share Contact બટન દાબો.",
        "language_selected": "ભાષા પસંદ થઈ: {language_label}",
        "pick_language": "તમારી ભાષા પસંદ કરો:",
        "ask_name": "તમારું નામ શું છે?",
        "welcome_new_header": "સ્વાગત છે, {name}! \U0001f64f તમે તૈયાર છો.",
        "welcome_new": "સ્વાગત છે, {name}! \U0001f64f તમે તૈયાર છો.\n\nભાષા: {language_label}\nફોન: {phone}\nચકાસણી: Telegram contact verified\n\nકૃપા કરીને તમારો સંદેશ ફરી મોકલો!",
        "welcome_back": "ફરી સ્વાગત છે, {name}! \U0001f64f",
        "auth_error": "માફ કરશો, અત્યારે તમારું એકાઉન્ટ સેટ થઈ શક્યું નથી. કૃપા કરીને થોડી વારમાં ફરી પ્રયાસ કરો.",
        "profile": "તમારી KalaSetu પ્રોફાઇલ:\n\nનામ: {name}\nભાષા: {language_label}\nફોન: {phone}\nચકાસણી: {verification}",
        "verified_contact": "Telegram contact verified",
        "not_verified": "ચકાસાયેલ નથી",
        "session_restored": "તમારો session expire થઈ ગયો હતો. ફરી સ્વાગત છે, {name}! \U0001f64f તમે તૈયાર છો.",
        "keep_logged_in_prompt": "શું તમે logged in રહેવા માંગો છો?",
        "keep_logged_in_yes": "7 દિવસ logged in રહો",
        "keep_logged_in_no": "1 કલાક પછી logout કરો",
        "keep_logged_in_set": "ચોક્કસ! તમે 7 દિવસ logged in રહેશો.",
        "keep_logged_in_skipped": "ચોક્કસ! 1 કલાક નિષ્ક્રિય રહ્૯ા પછી logout થઈ જશો.",
    },
}


def normalize_language(language: str | None) -> str:
    """Return a supported language code, defaulting to English."""
    if language in SUPPORTED_LANGUAGES:
        return language
    return "en"


def t(language: str | None, key: str, **kwargs: str) -> str:
    """Fetch a localized auth string."""
    language = normalize_language(language)
    template = STRINGS[language].get(key, STRINGS["en"][key])
    return template.format(**kwargs)
