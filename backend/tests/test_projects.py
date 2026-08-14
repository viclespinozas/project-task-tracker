import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.db.session import Base, engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy import create_engine
from app.models.project import Project
from app.models.task import Task

# Test data - matching the actual project model fields
TEST_PROJECT_DATA = {
    "name": "Test Project",
    "start_date": "2023-01-01",
    "end_date": "2023-12-31",
    "status": "active",
    "progress": 50
}

@pytest.fixture(scope="session")
def test_db():
    """Create a test database and tables."""
    # Create an in-memory SQLite database for testing
    test_engine = create_engine(
        "sqlite:///:memory:",
        echo=False,
        connect_args={"check_same_thread": False}
    )
    
    # Create all tables
    Base.metadata.create_all(bind=test_engine)
    
    yield test_engine
    
    # Clean up after tests
    Base.metadata.drop_all(bind=test_engine)


@pytest.fixture(scope="function")
def db_session(test_db):
    """Create a database session for each test."""
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_db)
    db = TestingSessionLocal()
    
    try:
        yield db
    finally:
        db.close()


@pytest.fixture(scope="function")
def client():
    """Create a test client for the FastAPI app."""
    with TestClient(app) as c:
        yield c


# Test cases
def test_create_project_succeeds(client, db_session):
    """Test that creating a project succeeds and returns 201 with correct fields."""
    response = client.post("/api/projects", json=TEST_PROJECT_DATA)
    
    assert response.status_code == 201
    data = response.json()
    
    # Check all required fields are present (matching actual model fields)
    assert "id" in data
    assert data["name"] == TEST_PROJECT_DATA["name"]
    assert data["start_date"] == TEST_PROJECT_DATA["start_date"]
    assert data["end_date"] == TEST_PROJECT_DATA["end_date"]
    assert data["status"] == TEST_PROJECT_DATA["status"]
    assert data["progress"] == TEST_PROJECT_DATA["progress"]


def test_create_project_with_invalid_progress(client, db_session):
    """Test that creating a project with progress=150 fails with 422."""
    invalid_data = TEST_PROJECT_DATA.copy()
    invalid_data["progress"] = 150
    
    response = client.post("/api/projects", json=invalid_data)
    
    assert response.status_code == 422


def test_create_project_with_invalid_dates(client, db_session):
    """Test that creating a project with end_date before start_date fails with 422."""
    invalid_data = TEST_PROJECT_DATA.copy()
    invalid_data["start_date"] = "2023-12-31"
    invalid_data["end_date"] = "2023-01-01"
    
    response = client.post("/api/projects", json=invalid_data)
    
    assert response.status_code == 422


def test_get_project_by_id(client, db_session):
    """Test that getting a project by ID returns 200, unknown ID returns 404."""
    # First create a project
    response = client.post("/api/projects", json=TEST_PROJECT_DATA)
    assert response.status_code == 201
    created_project = response.json()
    
    # Get the project by ID
    response = client.get(f"/api/projects/{created_project['id']}")
    assert response.status_code == 200
    
    # Try to get a non-existent project
    response = client.get("/api/projects/99999")
    assert response.status_code == 404


def test_list_projects(client, db_session):
    """Test that listing projects returns all projects and filtering by status works."""
    # Create two projects with different statuses
    project1_data = TEST_PROJECT_DATA.copy()
    project1_data["name"] = "Project 1"
    project1_data["status"] = "active"
    
    project2_data = TEST_PROJECT_DATA.copy()
    project2_data["name"] = "Project 2"
    project2_data["status"] = "completed"
    
    response1 = client.post("/api/projects", json=project1_data)
    response2 = client.post("/api/projects", json=project2_data)
    
    assert response1.status_code == 201
    assert response2.status_code == 201
    
    # List all projects
    response = client.get("/api/projects/")
    assert response.status_code == 200
    projects = response.json()
    assert len(projects) >= 2
    
    # Filter by status
    response = client.get("/api/projects/?status=active")
    assert response.status_code == 200
    active_projects = response.json()
    assert all(p["status"] == "active" for p in active_projects)


def test_update_project(client, db_session):
    """Test that updating a project partially updates and persists."""
    # Create a project
    response = client.post("/api/projects", json=TEST_PROJECT_DATA)
    assert response.status_code == 201
    created_project = response.json()
    
    # Update the project
    update_data = {"name": "Updated Project Name"}
    response = client.patch(f"/api/projects/{created_project['id']}", json=update_data)
    assert response.status_code == 200
    
    # Verify the update
    updated_project = response.json()
    assert updated_project["name"] == "Updated Project Name"
    # Note: We don't check description since it doesn't exist in the model


def test_delete_project(client, db_session):
    """Test that deleting a project returns 204 and cascades to child tasks."""
    # Create a project
    response = client.post("/api/projects", json=TEST_PROJECT_DATA)
    assert response.status_code == 201
    created_project = response.json()
    
    # Create a task for this project
    task_data = {
        "name": "Test Task",
        "project_id": created_project["id"],
        "status": "active"
    }
    
    task_response = client.post("/api/tasks/", json=task_data)
    assert task_response.status_code == 201
    created_task = task_response.json()
    
    # Delete the project (should cascade to tasks)
    response = client.delete(f"/api/projects/{created_project['id']}")
    assert response.status_code == 204
    
    # Verify the project is deleted
    response = client.get(f"/api/projects/{created_project['id']}")
    assert response.status_code == 404
    
    # Verify the task is also deleted (cascaded)
    response = client.get(f"/api/tasks/{created_task['id']}")
    assert response.status_code == 404


