import firebase_admin
from firebase_admin import credentials
from app.core.config import settings

def init_firebase():
    """
    Initializes the Firebase Admin SDK using credentials from settings.
    """
    if not firebase_admin._apps:
        cert_dict = {
            "type": "service_account",
            "project_id": settings.FIREBASE_PROJECT_ID,
            "private_key": settings.FIREBASE_PRIVATE_KEY.replace('\\n', '\n'),
            "client_email": settings.FIREBASE_CLIENT_EMAIL,
            "auth_uri": "https://accounts.google.com/o/oauth2/auth",
            "token_uri": "https://oauth2.googleapis.com/token",
            "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
            "client_x509_cert_url": f"https://www.googleapis.com/robot/v1/metadata/x509/{settings.FIREBASE_CLIENT_EMAIL.replace('@', '%40')}"
        }
        
        cred = credentials.Certificate(cert_dict)
        firebase_admin.initialize_app(cred)
