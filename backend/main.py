from fastapi import FastAPI 
from fastapi.middleware.cors import CORSMiddleware 
from .database import engine
from .models import Base
from .routes import router 
 
Base.metadata.create_all(bind=engine) 
 
app = FastAPI() 
 
app.add_middleware( 
    CORSMiddleware, 
    allow_origins=["*"], 
    allow_credentials=True, 
    allow_methods=["*"], 
    allow_headers=["*"], 
) 
 
app.include_router(router) 
 
@app.get("/health") 
def health(): 
    return {"status": "ok"} 
