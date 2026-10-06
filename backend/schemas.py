from pydantic import BaseModel 
from typing import List, Optional 
from datetime import datetime 
 
class FormCreate(BaseModel): 
    title: str 
    description: Optional[str] = None 
 
class FormUpdate(BaseModel): 
    title: Optional[str] = None 
    description: Optional[str] = None 
    is_published: Optional[bool] = None 
 
class FormResponse(BaseModel): 
    id: int 
    title: str 
    description: Optional[str] 
    is_published: bool 
    public_slug: str 
    created_at: datetime 
 
    class Config: 
        from_attributes = True 
