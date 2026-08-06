import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.pool import StaticPool
from app.db.session import Base, engine as db_engine
from app.core.config import settings
from fastapi.testclient import TestClient
from app.main import app
from app.db.session import get_db


@pytest.fixture(scope="session")
def test_engine():
    """Create a SQLAlchemy engine pointed at the TEST database."""
    # Check that the database URL contains "test"
    if "test" not in settings.database_url:
        raise ValueError("TEST_DATABASE_URL must point to the test database (tracker_test), never the dev database")
    
    # Create an in-memory SQLite database for testing
    test_engine = create_engine(
        settings.database_url,
        echo=False,
        poolclass=StaticPool,
        connect_args={"check_same_thread": False}
    )
    return test_engine


@pytest.fixture(scope="session")
def test_session_factory(test_engine):
    """Create a session factory for the test database."""
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)
    return TestingSessionLocal


@pytest.fixture(scope="function")
def test_db(test_session_factory):
    """Create all tables before the test session and drop them after."""
    Base.metadata.create_all(bind=test_engine)
    yield test_session_factory()
    Base.metadata.drop_all(bind=test_engine)


@pytest.fixture(scope="function")
def db_session(test_db):
    """Wrap each test in a transaction and roll it back after, so tests don't leak state into each other."""
    # Start a new transaction for the test
    transaction = test_db.begin()
    try:
        yield test_db
    finally:
        # Roll back the transaction to clean up after the test
        transaction.rollback()


@pytest.fixture(scope="function")
def client():
    """Create a TestClient fixture with get_db dependency overridden to use the test session."""
    
    def override_get_db():
        # Use the same database session for all requests in this test
        yield db_session
    
    # Override the get_db dependency in the app
    app.dependency_overrides[get_db] = override_get_db
    
    # Create and return a TestClient
    with TestClient(app) as c:
        yield c
    
    # Clean up the dependency override after the test
    app.dependency_overrides.clear()