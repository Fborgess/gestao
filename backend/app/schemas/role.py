from pydantic import BaseModel
from typing import List, Optional


class RoleModuleCreate(BaseModel):
    module: str
    access_level: str = "edit"


class RoleCreate(BaseModel):
    name: str
    is_admin: bool = False
    is_default: bool = False
    modules: List[RoleModuleCreate] = []


class RoleUpdate(BaseModel):
    name: Optional[str] = None
    is_admin: Optional[bool] = None
    is_default: Optional[bool] = None
    modules: Optional[List[RoleModuleCreate]] = None


class RoleModuleResponse(BaseModel):
    id: int
    module: str
    access_level: str

    class Config:
        from_attributes = True


class RoleResponse(BaseModel):
    id: int
    name: str
    is_admin: bool
    is_default: bool
    modules: List[RoleModuleResponse] = []

    class Config:
        from_attributes = True
