from sqlalchemy import create_engine
from sqlalchemy.orm import Session
from database import Base, SessionLocal
from models import Creator, Form, Question, Response, Answer, QuestionOption
from datetime import datetime, timedelta
import uuid

def seed_database():
    db = SessionLocal()
    
    # Check if already seeded
    if db.query(Form).count() > 0:
        print("Database already seeded!")
        db.close()
        return
    
    # Create default creator
    creator = Creator(name="Demo User")
    db.add(creator)
    db.commit()
    db.refresh(creator)
    
    # ===== FORM 1: Course Satisfaction (Multiple Choice) =====
    form1 = Form(
        creator_id=creator.id,
        title="Course Satisfaction Survey",
        description="Rate your experience with our course",
        public_slug=str(uuid.uuid4()),
        is_published=True
    )
    db.add(form1)
    db.commit()
    db.refresh(form1)
    
    # Form 1 Questions
    q1 = Question(form_id=form1.id, question_text="Overall course rating?", question_type="multiple_choice", is_required=True, order=0)
    q2 = Question(form_id=form1.id, question_text="Content difficulty level?", question_type="multiple_choice", is_required=True, order=1)
    q3 = Question(form_id=form1.id, question_text="Would you recommend this course?", question_type="multiple_choice", is_required=True, order=2)
    db.add_all([q1, q2, q3])
    db.commit()
    
    # Options for Q1
    opt1_1 = QuestionOption(question_id=q1.id, option_text="Excellent", order=0)
    opt1_2 = QuestionOption(question_id=q1.id, option_text="Good", order=1)
    opt1_3 = QuestionOption(question_id=q1.id, option_text="Average", order=2)
    opt1_4 = QuestionOption(question_id=q1.id, option_text="Poor", order=3)
    
    # Options for Q2
    opt2_1 = QuestionOption(question_id=q2.id, option_text="Too Easy", order=0)
    opt2_2 = QuestionOption(question_id=q2.id, option_text="Just Right", order=1)
    opt2_3 = QuestionOption(question_id=q2.id, option_text="Too Hard", order=2)
    
    # Options for Q3
    opt3_1 = QuestionOption(question_id=q3.id, option_text="Definitely", order=0)
    opt3_2 = QuestionOption(question_id=q3.id, option_text="Maybe", order=1)
    opt3_3 = QuestionOption(question_id=q3.id, option_text="No", order=2)
    
    db.add_all([opt1_1, opt1_2, opt1_3, opt1_4, opt2_1, opt2_2, opt2_3, opt3_1, opt3_2, opt3_3])
    db.commit()
    
    # 10 responses for Form 1
    ratings = ["Excellent", "Good", "Excellent", "Good", "Average", "Good", "Excellent", "Average", "Good", "Excellent"]
    difficulty = ["Just Right", "Too Easy", "Just Right", "Too Hard", "Just Right", "Just Right", "Too Easy", "Just Right", "Too Hard", "Just Right"]
    recommend = ["Definitely", "Definitely", "Maybe", "Definitely", "Maybe", "Definitely", "Definitely", "No", "Definitely", "Definitely"]
    
    for i in range(10):
        resp = Response(form_id=form1.id, created_at=datetime.now() - timedelta(hours=10-i))
        db.add(resp)
        db.commit()
        db.refresh(resp)
        
        ans1 = Answer(response_id=resp.id, question_id=q1.id, answer_value=ratings[i])
        ans2 = Answer(response_id=resp.id, question_id=q2.id, answer_value=difficulty[i])
        ans3 = Answer(response_id=resp.id, question_id=q3.id, answer_value=recommend[i])
        db.add_all([ans1, ans2, ans3])
    
    db.commit()
    
    # ===== FORM 2: Product Feedback (Text-based) =====
    form2 = Form(
        creator_id=creator.id,
        title="Product Feedback",
        description="Tell us what you think about our product",
        public_slug=str(uuid.uuid4()),
        is_published=True
    )
    db.add(form2)
    db.commit()
    db.refresh(form2)
    
    # Form 2 Questions
    q4 = Question(form_id=form2.id, question_text="What did you like most?", question_type="short_text", is_required=True, order=0)
    q5 = Question(form_id=form2.id, question_text="What needs improvement?", question_type="long_text", is_required=False, order=1)
    q6 = Question(form_id=form2.id, question_text="Your email for follow-up", question_type="short_text", is_required=False, order=2)
    db.add_all([q4, q5, q6])
    db.commit()
    
    # 10 responses for Form 2
    likes = [
        "Great UI design",
        "Easy to use",
        "Fast performance",
        "Good documentation",
        "Affordable pricing",
        "Excellent support",
        "Feature-rich",
        "Clean interface",
        "Good value",
        "Very intuitive"
    ]
    
    improvements = [
        "Add dark mode",
        "Mobile app needed",
        "Better search",
        "More templates",
        "API access",
        "Offline mode",
        "Better reports",
        "More integrations",
        "Advanced filters",
        None
    ]
    
    emails = [
        "user1@example.com",
        "user2@example.com",
        "user3@example.com",
        None,
        "user5@example.com",
        "user6@example.com",
        None,
        "user8@example.com",
        "user9@example.com",
        "user10@example.com"
    ]
    
    for i in range(10):
        resp = Response(form_id=form2.id, created_at=datetime.now() - timedelta(hours=10-i))
        db.add(resp)
        db.commit()
        db.refresh(resp)
        
        ans4 = Answer(response_id=resp.id, question_id=q4.id, answer_value=likes[i])
        ans5 = Answer(response_id=resp.id, question_id=q5.id, answer_value=improvements[i])
        ans6 = Answer(response_id=resp.id, question_id=q6.id, answer_value=emails[i])
        db.add_all([ans4, ans5, ans6])
    
    db.commit()
    
    print("✅ Database seeded with 2 forms + 10 responses each!")
    db.close()

if __name__ == "__main__":
    seed_database()