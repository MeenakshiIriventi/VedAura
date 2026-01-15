from pydantic import BaseModel, Field, EmailStr
from typing import Optional 
class UserModel(BaseModel):
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    username: str = Field(...)
    email: EmailStr = Field(...)
    age: int = Field(..., gt=0)
    history: Optional[str] = None # Stores medical history context

    class Config:
        allow_population_by_field_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}