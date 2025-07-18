import os
import firebase_admin
from firebase_admin import credentials, storage

_firebase_app = None

def get_firebase_app():
    global _firebase_app
    if _firebase_app is None:
        # For local development, try to use service account file
        # For Firebase Functions, this will use default credentials
        try:
            cred_path = os.getenv("FIREBASE_CREDENTIALS_PATH")
            if cred_path and os.path.exists(cred_path):
                cred = credentials.Certificate(cred_path)
                _firebase_app = firebase_admin.initialize_app(cred)
            else:
                # Use default credentials (works in Firebase Functions)
                _firebase_app = firebase_admin.initialize_app()
        except Exception as e:
            print(f"Firebase initialization error: {e}")
            # Fallback to default credentials
            _firebase_app = firebase_admin.initialize_app()
    return _firebase_app 