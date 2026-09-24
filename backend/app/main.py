from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.models import Project, Task  # Import models to register them with SQLAlchemy
from app.routers.projects import router as projects_router
from app.routers.tasks import router as tasks_router

app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(projects_router, prefix="/api")
app.include_router(tasks_router, prefix="/api")

@app.get("/health")
def health_check():
    return {"status": "ok"}
