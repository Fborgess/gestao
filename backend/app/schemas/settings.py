from pydantic import BaseModel
from typing import Optional


class SettingsUpdate(BaseModel):
    data_entry_case: Optional[str] = None  # "upper" | "title" | "free"


class SettingsResponse(BaseModel):
    data_entry_case: str = "title"
