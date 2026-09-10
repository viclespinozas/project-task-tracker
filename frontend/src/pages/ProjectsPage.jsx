import React, { useState, useEffect } from 'react';
import { apiClient } from '../api/client';
import KanbanBoard from '../components/KanbanBoard';

const ProjectsPage = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Define columns for the kanban board
  const columns = [
    { value: 'Not Started', label: 'Not Started' },
    { value: 'In Progress', label: 'In Progress' },
    { value: 'Done', label: 'Done' }
  ];

  // Fetch projects on component mount
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setLoading(true);
        const response = await apiClient.get('/projects');
        setProjects(response);
        setError(null);
      } catch (err) {
        console.error('Failed to fetch projects:', err);
        setError('Failed to load projects');
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, []);

  // Get project status for kanban board
  const getItemStatus = (project) => {
    return project.status || 'Not Started';
  };

  // Handle status change via drag and drop
  const onStatusChange = async (projectId, newStatus) => {
    // Optimistically update local state
    setProjects(prevProjects => 
      prevProjects.map(project => 
        project.id === projectId ? { ...project, status: newStatus } : project
      )
    );

    try {
      // PATCH the project status to backend
      await apiClient.patch(`/projects/${projectId}`, { 
        status: newStatus 
      });
    } catch (err) {
      console.error('Failed to update project status:', err);
      // Revert local state on API failure
      setProjects(prevProjects => 
        prevProjects.map(project => 
          project.id === projectId ? { ...project, status: project.status } : project
        )
      );
      setError('Failed to update project status');
    }
  };

  // Render card content for each project
  const renderCard = (project) => {
    return (
      <div className="kanban-card-content">
        <h4>{project.name}</h4>
        {project.assignee && <p>Assignee: {project.assignee}</p>}
        {project.priority && <p>Priority: {project.priority}</p>}
        {project.progress !== null && project.progress !== undefined && (
          <div>
            <p>Progress: {project.progress}%</p>
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ width: `${project.progress}%` }}
              ></div>
            </div>
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div>
        <h1>Projects</h1>
        <p>Loading projects...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <h1>Projects</h1>
        <p>Error: {error}</p>
      </div>
    );
  }

  return (
    <div>
      <h1>Projects</h1>
      <KanbanBoard
        items={projects}
        columns={columns}
        getItemStatus={getItemStatus}
        onStatusChange={onStatusChange}
        renderCard={renderCard}
      />
    </div>
  );
}

export default ProjectsPage
