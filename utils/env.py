import os
from dotenv import load_dotenv

def load_env():
    load_dotenv()

def get_env(key):
    value = os.getenv(key)
    if not value:
        raise RuntimeError(f"Environment variable {key} not set.")
    return value 