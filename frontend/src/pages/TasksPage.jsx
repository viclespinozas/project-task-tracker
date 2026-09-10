import React, { useState, useEffect } from 'react';
import { apiClient } from '../api/client';
import KanbanBoard from '../components/KanbanBoard';

const TasksPage = () => {
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedProjectId, setSelectedProjectId] = useState(null);

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
        {task.assignee && <p>Assignee: {task.assignee}</p>}
        {task.priority && <p>Priority: {task.priority}</p>}
        {task.due_date && (
          <p>
            Due: {new Date(task.due_date).toLocaleDateString()}
            {isPastDue && <span className="past-due-flag"> (PAST DUE)</span>}
          </p>
        )}
      </div>
    );
  };

  // Filter tasks by selected project
  const filteredTasks = selectedProjectId 
    ? tasks.filter(task => task.project_id === selectedProjectId)
    : tasks;

  if (loading) {
    return (
      <div>
        <h1>Tasks</h1>
        <p>Loading tasks and projects...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <h1>Tasks</h1>
        <p>Error: {error}</p>
      </div>
    );
  }

  return (
    <div>
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
      />
    </div>
  );
}

export default TasksPage
