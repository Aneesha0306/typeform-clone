from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, ForeignKey 
from sqlalchemy.orm import relationship 
from datetime import datetime 
from .database import Base
 
class Creator(Base): 
    __tablename__ = "creators" 
    id = Column(Integer, primary_key=True, index=True) 
    name = Column(String, nullable=False) 
    created_at = Column(DateTime, default=datetime.utcnow) 
    forms = relationship("Form", back_populates="creator") 
 
class Form(Base): 
    __tablename__ = "forms" 
    id = Column(Integer, primary_key=True, index=True) 
    creator_id = Column(Integer, ForeignKey("creators.id"), nullable=False) 
    title = Column(String, nullable=False) 
    description = Column(Text) 
    is_published = Column(Boolean, default=False) 
    public_slug = Column(String, unique=True, index=True) 
    created_at = Column(DateTime, default=datetime.utcnow) 
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow) 
    creator = relationship("Creator", back_populates="forms") 
    questions = relationship("Question", back_populates="form", cascade="all, delete-orphan") 
    responses = relationship("Response", back_populates="form", cascade="all, delete-orphan") 
 
class Question(Base): 
    __tablename__ = "questions" 
    id = Column(Integer, primary_key=True, index=True) 
    form_id = Column(Integer, ForeignKey("forms.id"), nullable=False) 
    question_text = Column(String, nullable=False) 
    question_type = Column(String, nullable=False) 
    description = Column(Text) 
    is_required = Column(Boolean, default=False) 
    order = Column(Integer, nullable=False) 
    created_at = Column(DateTime, default=datetime.utcnow) 
    form = relationship("Form", back_populates="questions") 
    options = relationship("QuestionOption", back_populates="question", cascade="all, delete-orphan") 
    answers = relationship("Answer", back_populates="question", cascade="all, delete-orphan") 
 
class QuestionOption(Base): 
    __tablename__ = "question_options" 
    id = Column(Integer, primary_key=True, index=True) 
    question_id = Column(Integer, ForeignKey("questions.id"), nullable=False) 
    option_text = Column(String, nullable=False) 
    order = Column(Integer, nullable=False) 
    question = relationship("Question", back_populates="options") 
 
class Response(Base): 
    __tablename__ = "responses" 
    id = Column(Integer, primary_key=True, index=True) 
    form_id = Column(Integer, ForeignKey("forms.id"), nullable=False) 
    created_at = Column(DateTime, default=datetime.utcnow) 
    form = relationship("Form", back_populates="responses") 
    answers = relationship("Answer", back_populates="response", cascade="all, delete-orphan") 
 
class Answer(Base): 
    __tablename__ = "answers" 
    id = Column(Integer, primary_key=True, index=True) 
    response_id = Column(Integer, ForeignKey("responses.id"), nullable=False) 
    question_id = Column(Integer, ForeignKey("questions.id"), nullable=False) 
    answer_value = Column(Text, nullable=True) 
    response = relationship("Response", back_populates="answers") 
    question = relationship("Question", back_populates="answers") 
