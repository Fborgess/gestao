import os
from dotenv import load_dotenv

load_dotenv()

_db_url = os.getenv("DATABASE_URL", "sqlite:///./gestao.db")
if _db_url.startswith("sqlite:///./"):
    _db_url = "sqlite:///" + os.path.abspath(os.path.join(os.path.dirname(__file__), "..", _db_url.replace("sqlite:///./", "")))

DATABASE_URL = _db_url
SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key-change-in-production")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "480"))
