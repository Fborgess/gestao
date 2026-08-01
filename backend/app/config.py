import os
from dotenv import load_dotenv

load_dotenv()

_db_url = os.getenv("DATABASE_URL", "sqlite:///./gestao.db")
if _db_url.startswith("sqlite:///./"):
    _db_url = "sqlite:///" + os.path.abspath(os.path.join(os.path.dirname(__file__), "..", _db_url.replace("sqlite:///./", "")))

DATABASE_URL = _db_url
DEFAULT_SECRET = "your-secret-key-change-in-production"
SECRET_KEY = os.getenv("SECRET_KEY", DEFAULT_SECRET)
if SECRET_KEY == DEFAULT_SECRET and not _db_url.startswith("sqlite"):
    raise RuntimeError(
        "SECRET_KEY não configurada. Defina SECRET_KEY no ambiente (ex.: python -c \"import secrets; print(secrets.token_hex(32))\")"
    )
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "480"))
