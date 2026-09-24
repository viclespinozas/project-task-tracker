import React, { useState, useEffect } from 'react';
import { apiClient } from '../api/client';
import KanbanBoard from '../components/KanbanBoard';
import ModalForm from '../components/ModalForm';

const TasksPage = () => {
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState('task'); // 'project' or 'task'
  const [modalTitle, setModalTitle] = useState('');
  const [initialModalData, setInitialModalData] = useState(null);
  const [validationErrors, setValidationErrors] = useState(null);

  // Define columns for the kanban board
  const columns = [
    { value: 'Inbox', label: 'Inbox' },
    { value: 'Waiting', label: 'Waiting' },
    { value: 'Next', label: 'Next' },
    { value: 'Doing', label: 'Doing' },
    { value: 'Done', label: 'Done' }
  ];

  // Fetch projects and tasks on component mount
  useEffect(() => {
    const fetchTasksAndProjects = async () => {
      try {
        setLoading(true);
        
        // Fetch all projects for the filter dropdown
        const projectsResponse = await apiClient.get('/projects');
        setProjects(projectsResponse);
        
        // Fetch all tasks
        const tasksResponse = await apiClient.get('/tasks');
        setTasks(tasksResponse);
        setError(null);
      } catch (err) {
        console.error('Failed to fetch data:', err);
        setError('Failed to load tasks and projects');
      } finally {
        setLoading(false);
      }
    };

    fetchTasksAndProjects();
  }, []);

  // Get task status for kanban board
  const getItemStatus = (task) => {
    return task.status || 'Inbox';
  };

  // Handle status change via drag and drop
  const onStatusChange = async (taskId, newStatus) => {
    // Optimistically update local state
    setTasks(prevTasks => 
      prevTasks.map(task => 
        task.id === taskId ? { ...task, status: newStatus } : task
      )
    );

    try {
      // PATCH the task status to backend
      await apiClient.patch(`/tasks/${taskId}`, { 
        status: newStatus 
      });
    } catch (err) {
      console.error('Failed to update task status:', err);
      // Revert local state on API failure
      setTasks(prevTasks => 
        prevTasks.map(task => 
          task.id === taskId ? { ...task, status: task.status } : task
        )
      );
      setError('Failed to update task status');
    }
  };

  // Render card content for each task
  const renderCard = (task) => {
    const isPastDue = task.due_date && new Date(task.due_date) < new Date();

    return (
      <div className={`kanban-card-content ${isPastDue ? 'past-due' : ''}`}>
        <h4>{task.name}</h4>
        <div className="card-meta">
          {task.assignee && <span className="chip chip-assignee">{task.assignee}</span>}
          {task.priority && (
            <span className={`chip chip-priority chip-priority-${task.priority.toLowerCase()}`}>
              {task.priority}
            </span>
          )}
        </div>
        {task.due_date && (
          <p className="due-date">
            Due: {new Date(task.due_date).toLocaleDateString()}
            {isPastDue && <span className="past-due-flag">Past due</span>}
          </p>
        )}
      </div>
    );
  };

  // Handle adding a new task
  const handleAddTask = (status) => {
    setModalTitle('Create Task');
    setInitialModalData({ status });
    setIsModalOpen(true);
    setValidationErrors(null);
  };

  // Handle editing an existing task
  const handleEditTask = (task) => {
    setModalTitle('Edit Task');
    setInitialModalData(task);
    setIsModalOpen(true);
    setValidationErrors(null);
  };

  // Submit form data to backend
  const handleSubmitForm = async (formData) => {
    try {
      if (initialModalData && initialModalData.id) {
        // Update existing task
        await apiClient.patch(`/tasks/${initialModalData.id}`, formData);
        // Refresh tasks list
        const response = await apiClient.get('/tasks');
        setTasks(response);
      } else {
        // Create new task
        await apiClient.post('/tasks', formData);
        // Refresh tasks list
        const response = await apiClient.get('/tasks');
        setTasks(response);
      }
      setIsModalOpen(false);
    } catch (error) {
      if (error.response && error.response.status === 422) {
        // Handle validation errors
        setValidationErrors(error.response.data.detail || {});
      } else {
        setError('Failed to save task');
        console.error('Failed to save task:', error);
      }
    }
  };

  // Filter tasks by selected project
  const filteredTasks = selectedProjectId 
    ? tasks.filter(task => task.project_id === selectedProjectId)
    : tasks;

  if (loading) {
    return (
      <div className="page">
        <h1>Tasks</h1>
        <p className="state-message">Loading tasks and projects…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page">
        <h1>Tasks</h1>
        <p className="state-message error">{error}</p>
      </div>
    );
  }

  return (
    <div className="page">
      <h1>Tasks</h1>
      
      {/* Project filter dropdown */}
      <div className="project-filter">
        <label htmlFor="projectFilter">Filter by Project: </label>
        <select 
          id="projectFilter"
          value={selectedProjectId || ''}
          onChange={(e) => setSelectedProjectId(e.target.value ? parseInt(e.target.value) : null)}
        >
          <option value="">All Projects</option>
          {projects.map(project => (
            <option key={project.id} value={project.id}>
              {project.name}
            </option>
          ))}
        </select>
      </div>
      
      <KanbanBoard
        items={filteredTasks}
        columns={columns}
        getItemStatus={getItemStatus}
        onStatusChange={onStatusChange}
        renderCard={renderCard}
        onAddItem={handleAddTask}
        onEditItem={handleEditTask}
      />
      
      <ModalForm
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSubmitForm}
        title={modalTitle}
        type="task"
        initialData={initialModalData}
        validationErrors={validationErrors}
      />
    </div>
  );
}

export default TasksPage
