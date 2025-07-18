import os
from firebase_admin import storage
from .firebase_setup import get_firebase_app

def upload_folder_to_firebase(local_folder: str, bucket_path_prefix: str = "queue/"):
    """
    Uploads all files in a local folder to Firebase Storage under the given prefix.
    """
    app = get_firebase_app()
    bucket = storage.bucket(app=app)

    for root, _, files in os.walk(local_folder):
        for filename in files:
            local_path = os.path.join(root, filename)
            relative_path = os.path.relpath(local_path, local_folder)
            firebase_path = os.path.join(bucket_path_prefix, relative_path).replace("\\", "/")

            blob = bucket.blob(firebase_path)
            blob.upload_from_filename(local_path)
            blob.make_public()
            print(f"[🔥] Uploaded {firebase_path}") 