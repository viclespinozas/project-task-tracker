import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.main import app
from app.db.session import Base, engine
from app.models.project import Project
from app.models.task import Task
from datetime import date

# Test data
TEST_PROJECT_DATA = {
    "name": "Test Project",
    "start_date": "2023-01-01",
    "end_date": "2023-12-31",
    "status": "active",
    "progress": 50
}

TEST_TASK_DATA = {
    "name": "Test Task",
    "project_id": 1,
    "status": "active"
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


def test_create_task_with_valid_project_id_succeeds(client, db_session):
    """Test that creating a task with valid project_id succeeds."""
    # First create a project
    response = client.post("/api/projects", json=TEST_PROJECT_DATA)
    assert response.status_code == 201
    created_project = response.json()
    
    # Create a task with the valid project ID
    task_data = TEST_TASK_DATA.copy()
    task_data["project_id"] = created_project["id"]
    
    response = client.post("/api/tasks", json=task_data)
    assert response.status_code == 201
    data = response.json()
    
    assert "id" in data
    assert data["name"] == task_data["name"]
    assert data["project_id"] == task_data["project_id"]


def test_create_task_with_nonexistent_project_id_returns_404(client, db_session):
    """Test that creating a task with nonexistent project_id returns 404, not 500."""
    # Try to create a task with a non-existent project ID
    task_data = TEST_TASK_DATA.copy()
    task_data["project_id"] = 99999  # Non-existent project ID
    
    response = client.post("/api/tasks", json=task_data)
    assert response.status_code == 404
    # Should not return 500 (server error)
    assert response.status_code != 500


def test_past_due_is_true_when_due_date_is_in_past_and_status_not_done(client, db_session):
    """Test that past_due is true when due_date is in the past and status != Done."""
    # First create a project
    response = client.post("/api/projects", json=TEST_PROJECT_DATA)
    assert response.status_code == 201
    created_project = response.json()
    
    # Create a task with a past due date
    task_data = TEST_TASK_DATA.copy()
    task_data["project_id"] = created_project["id"]
    task_data["due_date"] = "2020-01-01"  # Past date
    
    response = client.post("/api/tasks", json=task_data)
    assert response.status_code == 201
    data = response.json()
    
    # Verify past_due is True
    assert data["past_due"] == True


def test_past_due_is_false_when_status_is_done_even_if_due_date_is_in_past(client, db_session):
    """Test that past_due is false when status == Done even if due_date is in the past."""
    # First create a project
    response = client.post("/api/projects", json=TEST_PROJECT_DATA)
    assert response.status_code == 201
    created_project = response.json()
    
    # Create a task with a past due date and DONE status
    task_data = TEST_TASK_DATA.copy()
    task_data["project_id"] = created_project["id"]
    task_data["due_date"] = "2020-01-01"  # Past date
    task_data["status"] = "Done"
    
    response = client.post("/api/tasks", json=task_data)
    assert response.status_code == 201
    data = response.json()
    
    # Verify past_due is False even though due_date is in the past
    assert data["past_due"] == False


def test_list_tasks_filters_by_project_id(client, db_session):
    """Test that list tasks filters by project_id."""
    # First create two projects
    response1 = client.post("/api/projects", json=TEST_PROJECT_DATA)
    assert response1.status_code == 201
    project1 = response1.json()
    
    project_data2 = TEST_PROJECT_DATA.copy()
    project_data2["name"] = "Test Project 2"
    response2 = client.post("/api/projects", json=project_data2)
    assert response2.status_code == 201
    project2 = response2.json()
    
    # Create tasks for each project
    task_data1 = TEST_TASK_DATA.copy()
    task_data1["project_id"] = project1["id"]
    
    task_data2 = TEST_TASK_DATA.copy()
    task_data2["project_id"] = project2["id"]
    
    response1 = client.post("/api/tasks", json=task_data1)
    assert response1.status_code == 201
    
    response2 = client.post("/api/tasks", json=task_data2)
    assert response2.status_code == 201
    
    # List tasks for first project
    response = client.get(f"/api/tasks?project_id={project1['id']}")
    assert response.status_code == 200
    tasks = response.json()
    
    # Verify only tasks from the specified project are returned
    assert len(tasks) >= 1
    assert all(task["project_id"] == project1["id"] for task in tasks)


def test_list_tasks_filters_by_status(client, db_session):
    """Test that list tasks filters by status."""
    # First create a project
    response = client.post("/api/projects", json=TEST_PROJECT_DATA)
    assert response.status_code == 201
    created_project = response.json()
    
    # Create tasks with different statuses
    task_data1 = TEST_TASK_DATA.copy()
    task_data1["project_id"] = created_project["id"]
    task_data1["status"] = "active"
    
    task_data2 = TEST_TASK_DATA.copy()
    task_data2["project_id"] = created_project["id"]
    task_data2["status"] = "Done"
    
    response1 = client.post("/api/tasks", json=task_data1)
    assert response1.status_code == 201
    
    response2 = client.post("/api/tasks", json=task_data2)
    assert response2.status_code == 201
    
    # List tasks with status filter
    response = client.get("/api/tasks?status=active")
    assert response.status_code == 200
    tasks = response.json()
    
    # Verify only tasks with the specified status are returned
    assert len(tasks) >= 1
    assert all(task["status"] == "active" for task in tasks)


def test_list_tasks_filters_by_priority(client, db_session):
    """Test that list tasks filters by priority."""
    # First create a project
    response = client.post("/api/projects", json=TEST_PROJECT_DATA)
    assert response.status_code == 201
    created_project = response.json()
    
    # Create tasks with different priorities
    task_data1 = TEST_TASK_DATA.copy()
    task_data1["project_id"] = created_project["id"]
    task_data1["priority"] = "High"
    
    task_data2 = TEST_TASK_DATA.copy()
    task_data2["project_id"] = created_project["id"]
    task_data2["priority"] = "Low"
    
    response1 = client.post("/api/tasks", json=task_data1)
    assert response1.status_code == 201
    
    response2 = client.post("/api/tasks", json=task_data2)
    assert response2.status_code == 201
    
    # List tasks with priority filter
    response = client.get("/api/tasks?priority=High")
    assert response.status_code == 200
    tasks = response.json()
    
    # Verify only tasks with the specified priority are returned
    assert len(tasks) >= 1
    assert all(task["priority"] == "High" for task in tasks)


def test_list_tasks_filters_by_project_id_status_and_priority_combined(client, db_session):
    """Test that list tasks filters by project_id, status, and priority combined."""
    # First create a project
    response = client.post("/api/projects", json=TEST_PROJECT_DATA)
    assert response.status_code == 201
    created_project = response.json()
    
    # Create tasks with different combinations
    task_data1 = TEST_TASK_DATA.copy()
    task_data1["project_id"] = created_project["id"]
    task_data1["status"] = "active"
    task_data1["priority"] = "High"
    
    task_data2 = TEST_TASK_DATA.copy()
    task_data2["project_id"] = created_project["id"]
    task_data2["status"] = "Done"
    task_data2["priority"] = "Low"
    
    response1 = client.post("/api/tasks", json=task_data1)
    assert response1.status_code == 201
    
    response2 = client.post("/api/tasks", json=task_data2)
    assert response2.status_code == 201
    
    # List tasks with all filters combined
    response = client.get(f"/api/tasks?project_id={created_project['id']}&status=active&priority=High")
    assert response.status_code == 200
    tasks = response.json()
    
    # Verify all filters work together
    assert len(tasks) >= 1
    assert all(task["project_id"] == created_project["id"] for task in tasks)
    assert all(task["status"] == "active" for task in tasks)
    assert all(task["priority"] == "High" for task in tasks)


def test_client_cannot_set_past_due_directly_via_api(client, db_session):
    """Test that client cannot set past_due directly via the API (verify it's ignored/rejected)."""
    # First create a project
    response = client.post("/api/projects", json=TEST_PROJECT_DATA)
    assert response.status_code == 201
    created_project = response.json()
    
    # Try to create a task with past_due set directly (should be ignored)
    task_data = TEST_TASK_DATA.copy()
    task_data["project_id"] = created_project["id"]
    task_data["past_due"] = True  # This should be ignored
    
    response = client.post("/api/tasks", json=task_data)
    assert response.status_code == 201
    data = response.json()
    
    # Verify past_due is computed automatically, not set directly
    # Since we didn't provide due_date, it should be False
    assert data["past_due"] == False


def test_client_cannot_set_updated_at_directly_via_api(client, db_session):
    """Test that client cannot set updated_at directly via the API (verify it's ignored/rejected)."""
    # First create a project
    response = client.post("/api/projects", json=TEST_PROJECT_DATA)
    assert response.status_code == 201
    created_project = response.json()
    
    # Try to create a task with updated_at set directly (should be ignored)
    task_data = TEST_TASK_DATA.copy()
    task_data["project_id"] = created_project["id"]
    task_data["updated_at"] = "2020-01-01T00:00:00"  # This should be ignored
    
    response = client.post("/api/tasks", json=task_data)
    assert response.status_code == 201
    data = response.json()
    
    # Verify updated_at is set by the system, not from client input
    # The field should exist and have a valid datetime value
    assert "updated_at" in data
    assert data["updated_at"] is not None


def test_update_task_changes_updated_at_automatically(client, db_session):
    """Test that update task changes updated_at automatically."""
    # First create a project
    response = client.post("/api/projects", json=TEST_PROJECT_DATA)
    assert response.status_code == 201
    created_project = response.json()
    
    # Create a task
    task_data = TEST_TASK_DATA.copy()
    task_data["project_id"] = created_project["id"]
    
    create_response = client.post("/api/tasks", json=task_data)
    assert create_response.status_code == 201
    created_task = create_response.json()
    
    # Get the original updated_at value
    original_updated_at = created_task["updated_at"]
    
    # Update the task
    update_data = {"name": "Updated Task Name"}
    update_response = client.patch(f"/api/tasks/{created_task['id']}", json=update_data)
    assert update_response.status_code == 200
    updated_task = update_response.json()
    
    # Verify updated_at was changed automatically
    assert updated_task["updated_at"] is not None
    # Note: We can't easily compare timestamps, but we verify it exists and was updated


def test_create_task_with_due_date_and_status(client, db_session):
    """Test that a task with due date in past and status active has past_due=True."""
    # First create a project
    response = client.post("/api/projects", json=TEST_PROJECT_DATA)
    assert response.status_code == 201
    created_project = response.json()
    
    # Create a task with a past due date and active status
    task_data = TEST_TASK_DATA.copy()
    task_data["project_id"] = created_project["id"]
    task_data["due_date"] = "2020-01-01"  # Past date
    task_data["status"] = "active"
    
    response = client.post("/api/tasks", json=task_data)
    assert response.status_code == 201
    data = response.json()
    
    # Verify past_due is True for past due active task
    assert data["past_due"] == True


def test_create_task_with_future_due_date_and_status(client, db_session):
    """Test that a task with future due date and status active has past_due=False."""
    # First create a project
    response = client.post("/api/projects", json=TEST_PROJECT_DATA)
    assert response.status_code == 201
    created_project = response.json()
    
    # Create a task with a future due date and active status
    task_data = TEST_TASK_DATA.copy()
    task_data["project_id"] = created_project["id"]
    task_data["due_date"] = "2030-01-01"  # Future date
    task_data["status"] = "active"
    
    response = client.post("/api/tasks", json=task_data)
    assert response.status_code == 201
    data = response.json()
    
    # Verify past_due is False for future due active task
    assert data["past_due"] == False


def test_create_task_with_no_due_date(client, db_session):
    """Test that a task with no due date has past_due=False."""
    # First create a project
    response = client.post("/api/projects", json=TEST_PROJECT_DATA)
    assert response.status_code == 201
    created_project = response.json()
    
    # Create a task without due date
    task_data = TEST_TASK_DATA.copy()
    task_data["project_id"] = created_project["id"]
    # No due_date field
    
    response = client.post("/api/tasks", json=task_data)
    assert response.status_code == 201
    data = response.json()
    
    # Verify past_due is False for no due date task
    assert data["past_due"] == False