import firebase_admin
from firebase_admin import credentials
from app.core.config import settings


def init_firebase():
    """Initialize the Firebase Admin SDK.

    Prefers Application Default Credentials (GOOGLE_APPLICATION_CREDENTIALS env
    var or workload identity on Cloud Run). Falls back to building a cert from
    individual FIREBASE_* env vars for local dev setups that don't have a
    service account JSON file.
    """
    if firebase_admin._apps:
        return

    options = {}
    if settings.FIREBASE_STORAGE_BUCKET:
        options["storageBucket"] = settings.FIREBASE_STORAGE_BUCKET

    if settings.FIREBASE_PRIVATE_KEY and settings.FIREBASE_CLIENT_EMAIL:
        raw_key = settings.FIREBASE_PRIVATE_KEY.strip()
        if (raw_key.startswith('"') and raw_key.endswith('"')) or \
           (raw_key.startswith("'") and raw_key.endswith("'")):
            raw_key = raw_key[1:-1]
        private_key = raw_key.replace('\\n', '\n')
        cert_dict = {
            "type": "service_account",
            "project_id": settings.FIREBASE_PROJECT_ID,
            "private_key": private_key,
            "client_email": settings.FIREBASE_CLIENT_EMAIL,
            "auth_uri": "https://accounts.google.com/o/oauth2/auth",
            "token_uri": "https://oauth2.googleapis.com/token",
            "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
            "client_x509_cert_url": f"https://www.googleapis.com/robot/v1/metadata/x509/{settings.FIREBASE_CLIENT_EMAIL.replace('@', '%40')}",
        }
        cred = credentials.Certificate(cert_dict)
    else:
        cred = credentials.ApplicationDefault()

    firebase_admin.initialize_app(cred, options or None)
