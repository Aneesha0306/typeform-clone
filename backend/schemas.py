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

class QuestionOptionCreate(BaseModel):
    option_text: str

class QuestionOptionResponse(BaseModel):
    id: int
    question_id: int
    option_text: str
    order: int

    class Config:
        from_attributes = True
 
class QuestionCreate(BaseModel): 
    question_text: str 
    question_type: str 
    description: Optional[str] = None 
    is_required: bool = False
    options: Optional[List[QuestionOptionCreate]] = None
 
class QuestionUpdate(BaseModel): 
    question_text: Optional[str] = None 
    description: Optional[str] = None 
    is_required: Optional[bool] = None 
 
class QuestionResponse(BaseModel): 
    id: int 
    form_id: int 
    question_text: str 
    question_type: str 
    description: Optional[str] 
    is_required: bool 
    order: int
    options: List[QuestionOptionResponse] = []
 
    class Config: 
        from_attributes = True 
 
class AnswerCreate(BaseModel): 
    question_id: int 
    answer_value: Optional[str] = None 
 
class ResponseSubmit(BaseModel): 
    answers: List[AnswerCreate] 
 
class AnswerResponse(BaseModel): 
    id: int 
    question_id: int 
    answer_value: Optional[str] 
 
    class Config: 
        from_attributes = True 
 
class ResponseResponse(BaseModel): 
    id: int 
    form_id: int 
    created_at: datetime 
    answers: List[AnswerResponse] 
 
    class Config: 
        from_attributes = True