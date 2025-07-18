from dotenv import load_dotenv
load_dotenv()
import os
from .firebase_upload import upload_folder_to_firebase

def create_dummy_files(test_folder):
    os.makedirs(test_folder, exist_ok=True)
    with open(os.path.join(test_folder, "test.txt"), "w") as f:
        f.write("This is a test file.")
    with open(os.path.join(test_folder, "test.jpg"), "wb") as f:
        f.write(os.urandom(1024))  # 1KB random bytes
    with open(os.path.join(test_folder, "test.mp4"), "wb") as f:
        f.write(os.urandom(2048))  # 2KB random bytes

def test_upload_dummy_folder():
    test_folder = "queue/test_upload"
    create_dummy_files(test_folder)
    upload_folder_to_firebase(test_folder, bucket_path_prefix="queue/test_upload")
    print("✅ Dummy files uploaded. Check Firebase Storage for 'queue/test_upload/'.")

if __name__ == "__main__":
    test_upload_dummy_folder() 