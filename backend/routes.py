from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import SessionLocal
from models import Form, Creator, Question, Response, Answer, QuestionOption
from schemas import FormCreate, FormUpdate, FormResponse, QuestionCreate, QuestionUpdate, QuestionResponse, AnswerCreate, ResponseSubmit, AnswerResponse, ResponseResponse
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

@router.post("/forms/{form_id}/questions", response_model=QuestionResponse)
def create_question(form_id: int, question: QuestionCreate, db: Session = Depends(get_db)):
    form = db.query(Form).filter(Form.id == form_id).first()
    if not form:
        raise HTTPException(status_code=404, detail="Form not found")
    order = db.query(Question).filter(Question.form_id == form_id).count()
    new_question = Question(
        form_id=form_id,
        question_text=question.question_text,
        question_type=question.question_type,
        description=question.description,
        is_required=question.is_required,
        order=order
    )
    db.add(new_question)
    db.commit()
    db.refresh(new_question)

    # Add options if provided
    if question.options:
        for idx, opt in enumerate(question.options):
            question_option = QuestionOption(
                question_id=new_question.id,
                option_text=opt.option_text,
                order=idx
            )
            db.add(question_option)
        db.commit()
        db.refresh(new_question)

    return new_question

@router.get("/forms/{form_id}/questions")
def list_questions(form_id: int, db: Session = Depends(get_db)):
    form = db.query(Form).filter(Form.id == form_id).first()
    if not form:
        raise HTTPException(status_code=404, detail="Form not found")
    questions = db.query(Question).filter(Question.form_id == form_id).order_by(Question.order).all()

    # Load options for each question
    for q in questions:
        q.options = db.query(QuestionOption).filter(QuestionOption.question_id == q.id).order_by(QuestionOption.order).all()

    return questions

@router.patch("/questions/{question_id}")
def update_question(question_id: int, question_update: dict, db: Session = Depends(get_db)):
    question = db.query(Question).filter(Question.id == question_id).first()
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")

    # Update basic fields
    if question_update.get("question_text"):
        question.question_text = question_update["question_text"]
    if question_update.get("description") is not None:
        question.description = question_update["description"]
    if question_update.get("is_required") is not None:
        question.is_required = question_update["is_required"]

    # Handle options update
    if "options" in question_update and question_update["options"] is not None:
        # Delete all existing options for this question
        db.query(QuestionOption).filter(QuestionOption.question_id == question_id).delete()

        # Add new options
        for idx, opt in enumerate(question_update["options"]):
            option_text = opt.get("option_text") if isinstance(opt, dict) else opt
            question_option = QuestionOption(
                question_id=question_id,
                option_text=option_text,
                order=idx
            )
            db.add(question_option)

    db.commit()
    db.refresh(question)

    # Load options for response
    question.options = db.query(QuestionOption).filter(QuestionOption.question_id == question_id).order_by(QuestionOption.order).all()

    return question

@router.delete("/questions/{question_id}")
def delete_question(question_id: int, db: Session = Depends(get_db)):
    question = db.query(Question).filter(Question.id == question_id).first()
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")
    form_id = question.form_id
    db.delete(question)
    db.commit()
    remaining = db.query(Question).filter(Question.form_id == form_id).order_by(Question.order).all()
    for idx, q in enumerate(remaining):
        q.order = idx
    db.commit()
    return {"message": "Question deleted"}

@router.post("/forms/{form_id}/responses")
def submit_response(form_id: int, response_data: ResponseSubmit, db: Session = Depends(get_db)):
    form = db.query(Form).filter(Form.id == form_id).first()
    if not form:
        raise HTTPException(status_code=404, detail="Form not found")
    if not form.is_published:
        raise HTTPException(status_code=400, detail="Form is not published")
    new_response = Response(form_id=form_id)
    db.add(new_response)
    db.commit()
    db.refresh(new_response)
    for ans in response_data.answers:
        answer = Answer(
            response_id=new_response.id,
            question_id=ans.question_id,
            answer_value=ans.answer_value
        )
        db.add(answer)
    db.commit()
    db.refresh(new_response)
    return new_response

@router.get("/forms/{form_id}/responses")
def list_responses(form_id: int, db: Session = Depends(get_db)):
    form = db.query(Form).filter(Form.id == form_id).first()
    if not form:
        raise HTTPException(status_code=404, detail="Form not found")
    responses = db.query(Response).filter(Response.form_id == form_id).all()
    result = []
    for response in responses:
        answers = db.query(Answer).filter(Answer.response_id == response.id).all()
        response.answers = answers
        result.append(response)
    return result

@router.get("/responses/{response_id}")
def get_response(response_id: int, db: Session = Depends(get_db)):
    response = db.query(Response).filter(Response.id == response_id).first()
    if not response:
        raise HTTPException(status_code=404, detail="Response not found")
    return response

@router.get("/forms/public/{public_slug}")
def get_form_by_slug(public_slug: str, db: Session = Depends(get_db)):
    form = db.query(Form).filter(Form.public_slug == public_slug).first()
    if not form:
        raise HTTPException(status_code=404, detail="Form not found")
    return form