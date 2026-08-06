from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from app.core.config import settings

# Only create the engine if it's not being imported during alembic operations
import sys
if 'alembic' not in sys.modules:
    SQLALCHEMY_DATABASE_URL = settings.database_url
    engine = create_engine(SQLALCHEMY_DATABASE_URL)
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
else:
    # For Alembic environment, we'll handle this differently
    engine = None
    SQLALCHEMY_DATABASE_URL = None

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
