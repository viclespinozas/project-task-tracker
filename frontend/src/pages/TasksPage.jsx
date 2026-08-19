import React, { useState, useEffect } from 'react';
import KanbanBoard from '../components/KanbanBoard';
import { apiClient } from '../api/client';

const TasksPage = () => {
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedProjectId, setSelectedProjectId] = useState(null);

  // Define the columns for task status
  const columns = [
    { status: 'Inbox', label: 'Inbox' },
    { status: 'Waiting', label: 'Waiting' },
    { status: 'Next', label: 'Next' },
    { status: 'Doing', label: 'Doing' },
    { status: 'Done', label: 'Done' }
  ];

  // Fetch projects and tasks on component mount
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setLoading(true);
        
        // Fetch projects for the filter dropdown
        const projectsData = await apiClient.get('/projects');
        setProjects(projectsData);
        
        // Fetch tasks (initially all tasks, will be filtered later)
        const tasksData = await apiClient.get('/tasks');
        setTasks(tasksData);
        setError(null);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchInitialData();
  }, []);

  // Fetch tasks when project filter changes
  useEffect(() => {
    const fetchTasks = async () => {
      try {
        setLoading(true);
        
        // Build query parameters
        let endpoint = '/tasks';
        const params = new URLSearchParams();
        
        if (selectedProjectId) {
          params.append('project_id', selectedProjectId);
        }
        
        if (params.toString()) {
          endpoint += `?${params.toString()}`;
        }
        
        const tasksData = await apiClient.get(endpoint);
        setTasks(tasksData);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    // Only fetch tasks when selectedProjectId changes
    if (selectedProjectId !== null) {
      fetchTasks();
    }
  }, [selectedProjectId]);

  // Function to get task status
  const getItemStatus = (task) => {
    return task.status;
  };

  // Function to handle status change via drag-and-drop
  const handleStatusChange = async (taskId, newStatus) => {
    try {
      // Optimistically update local state
      setTasks(prevTasks => 
        prevTasks.map(task => 
          task.id === taskId ? { ...task, status: newStatus } : task
        )
      );

      // PATCH the task's status via API
      await apiClient.patch(`/tasks/${taskId}`, { status: newStatus });
    } catch (err) {
      // Revert local state on API failure
      setTasks(prevTasks => 
        prevTasks.map(task => 
          task.id === taskId ? { ...task, status: task.status } : task
        )
      );
      console.error('Failed to update task status:', err);
      // Optionally show user error message here
    }
  };

  // Function to handle adding a new task
  const handleAddTask = async (taskData) => {
    try {
      const response = await apiClient.post('/tasks', taskData);
      setTasks(prev => [...prev, response.data]);
    } catch (err) {
      throw err; // Let the modal handle the error
    }
  };

  // Function to handle updating a task
  const handleEditTask = async (taskId, taskData) => {
    try {
      const response = await apiClient.put(`/tasks/${taskId}`, taskData);
      setTasks(prev => 
        prev.map(task => 
          task.id === taskId ? response.data : task
        )
      );
    } catch (err) {
      throw err; // Let the modal handle the error
    }
  };

  // Function to render task card
  const renderCard = (task) => {
    const isPastDue = task.past_due;
    
    return (
      <div 
        key={task.id} 
        className={`kanban-card ${isPastDue ? 'past-due' : ''}`}
      >
        <h3>{task.name}</h3>
        <p>Assignee: {task.assignee || 'Unassigned'}</p>
        <p>Priority: {task.priority}</p>
        <p>Due Date: {task.due_date || 'No due date'}</p>
        {isPastDue && (
          <div className="past-due-flag">
            OVERDUE
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div>
        <h1>Tasks</h1>
        <p>Loading tasks...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <h1>Tasks</h1>
        <p>Error loading tasks: {error}</p>
      </div>
    );
  }

  return (
    <div>
      <h1>Tasks</h1>
      
      {/* Project Filter Dropdown */}
      <div className="project-filter">
        <label htmlFor="project-filter">Filter by Project: </label>
        <select 
          id="project-filter"
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
        items={tasks}
        columns={columns}
        getItemStatus={getItemStatus}
        onStatusChange={handleStatusChange}
        renderCard={renderCard}
        onAddTask={handleAddTask}
        onEditTask={handleEditTask}
        projects={projects}
      />
    </div>
  );
};

export default TasksPage;
