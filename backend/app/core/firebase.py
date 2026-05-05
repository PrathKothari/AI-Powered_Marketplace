import os
import firebase_admin
from firebase_admin import credentials
from app.core.config import settings


def init_firebase():
    """
    Initializes the Firebase Admin SDK using either a service-account JSON file
    referenced by the `GOOGLE_APPLICATION_CREDENTIALS` environment variable,
    or by constructing a credential dict from `FIREBASE_PRIVATE_KEY` and
    related settings. The file-based flow is preferred to avoid PEM parsing
    issues when the private key is stored as an environment string.
    """
    if firebase_admin._apps:
        return

    # Prefer a JSON service account file if provided via env var (ADC path)
    svc_path = os.getenv("GOOGLE_APPLICATION_CREDENTIALS")
    try:
        if svc_path and os.path.exists(svc_path):
            cred = credentials.Certificate(svc_path)
        else:
            # Fallback: construct a credentials dict from env vars
            cert_dict = {
                "type": "service_account",
                "project_id": settings.FIREBASE_PROJECT_ID,
                "private_key": (settings.FIREBASE_PRIVATE_KEY or "").replace("\\n", "\n"),
                "client_email": settings.FIREBASE_CLIENT_EMAIL,
                "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                "token_uri": "https://oauth2.googleapis.com/token",
                "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
                "client_x509_cert_url": f"https://www.googleapis.com/robot/v1/metadata/x509/{(settings.FIREBASE_CLIENT_EMAIL or "").replace('@', '%40')}"
            }
            cred = credentials.Certificate(cert_dict)

        options = {}
        if settings.FIREBASE_STORAGE_BUCKET:
            options["storageBucket"] = settings.FIREBASE_STORAGE_BUCKET
        firebase_admin.initialize_app(cred, options or None)
    except Exception:
        # If initialization fails, don't crash the entire app — leave Firebase uninitialized
        # and allow the rest of the application to continue. The error will be visible
        # in logs so developers can address credential formatting issues.
        import logging

        logging.getLogger(__name__).exception("Failed to initialize Firebase Admin SDK")
