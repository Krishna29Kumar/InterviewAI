from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from app.core.config import settings
from app.core.database import connect_db, close_db
from app.routers import auth, interview, dashboard
from app.routers.anomaly import router as anomaly_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    await connect_db()
    yield
    await close_db()

app = FastAPI(
    title="InterviewAI API",
    description="AI-Powered Mock Interview Platform",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_URL, "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(interview.router)
app.include_router(dashboard.router)
app.include_router(anomaly_router)

@app.get("/health")
async def health():
    return {"status": "ok", "db": "MongoDB Atlas", "app": "InterviewAI"}

@app.get("/")
async def root():
    return {"message": "InterviewAI API — visit /docs"}
