from fastapi import APIRouter, Depends, HTTPException 
from sqlalchemy.orm import Session 
from database import SessionLocal 
from models import Form, Creator 
from schemas import FormCreate, FormUpdate, FormResponse 
import uuid 
 
router = APIRouter() 
 
def get_db(): 
    db = SessionLocal() 
    try: 
        yield db 
    finally: 
        db.close() 
 
@router.post("/forms", response_model=FormResponse) 
def create_form(form: FormCreate, db: Session = Depends(get_db)): 
    creator = db.query(Creator).first() 
    if not creator: 
        creator = Creator(name="Default User") 
        db.add(creator) 
        db.commit() 
        db.refresh(creator) 
    new_form = Form( 
        creator_id=creator.id, 
        title=form.title, 
        description=form.description, 
        public_slug=str(uuid.uuid4()) 
    ) 
    db.add(new_form) 
    db.commit() 
    db.refresh(new_form) 
    return new_form 
 
@router.get("/forms") 
def list_forms(db: Session = Depends(get_db)): 
    forms = db.query(Form).all() 
    return forms 
 
@router.get("/forms/{form_id}", response_model=FormResponse) 
def get_form(form_id: int, db: Session = Depends(get_db)): 
    form = db.query(Form).filter(Form.id == form_id).first() 
    if not form: 
        raise HTTPException(status_code=404, detail="Form not found") 
    return form 
 
@router.patch("/forms/{form_id}", response_model=FormResponse) 
def update_form(form_id: int, form_update: FormUpdate, db: Session = Depends(get_db)): 
    form = db.query(Form).filter(Form.id == form_id).first() 
    if not form: 
        raise HTTPException(status_code=404, detail="Form not found") 
    if form_update.title: 
        form.title = form_update.title 
    if form_update.description is not None: 
        form.description = form_update.description 
    if form_update.is_published is not None: 
        form.is_published = form_update.is_published 
    db.commit() 
    db.refresh(form) 
    return form 
 
@router.delete("/forms/{form_id}") 
def delete_form(form_id: int, db: Session = Depends(get_db)): 
    form = db.query(Form).filter(Form.id == form_id).first() 
    if not form: 
        raise HTTPException(status_code=404, detail="Form not found") 
    db.delete(form) 
    db.commit() 
    return {"message": "Form deleted"} 
