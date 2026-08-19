import React, { useState, useEffect } from 'react';
import KanbanBoard from '../components/KanbanBoard';
import { apiClient } from '../api/client';

const ProjectsPage = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Define the columns for project status
  const columns = [
    { status: 'Not Started', label: 'Not Started' },
    { status: 'In Progress', label: 'In Progress' },
    { status: 'Done', label: 'Done' }
  ];

  // Fetch projects on component mount
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setLoading(true);
        const data = await apiClient.get('/projects');
        setProjects(data);
        setError(null);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, []);

  // Function to get project status
  const getItemStatus = (project) => {
    return project.status;
  };

  // Function to handle status change via drag-and-drop
  const handleStatusChange = async (projectId, newStatus) => {
    try {
      // Optimistically update local state
      setProjects(prevProjects => 
        prevProjects.map(project => 
          project.id === projectId ? { ...project, status: newStatus } : project
        )
      );

      // PATCH the project's status via API
      await apiClient.patch(`/projects/${projectId}`, { status: newStatus });
    } catch (err) {
      // Revert local state on API failure
      setProjects(prevProjects => 
        prevProjects.map(project => 
          project.id === projectId ? { ...project, status: project.status } : project
        )
      );
      console.error('Failed to update project status:', err);
      // Optionally show user error message here
    }
  };

  // Function to handle adding a new project
  const handleAddProject = async (projectData) => {
    try {
      const response = await apiClient.post('/projects', projectData);
      setProjects(prev => [...prev, response.data]);
    } catch (err) {
      throw err; // Let the modal handle the error
    }
  };

  // Function to handle updating a project
  const handleEditProject = async (projectId, projectData) => {
    try {
      const response = await apiClient.put(`/projects/${projectId}`, projectData);
      setProjects(prev => 
        prev.map(project => 
          project.id === projectId ? response.data : project
        )
      );
    } catch (err) {
      throw err; // Let the modal handle the error
    }
  };

  // Function to render project card
  const renderCard = (project) => {
    return (
      <div key={project.id} className="kanban-card">
        <h3>{project.name}</h3>
        <p>Assignee: {project.assignee || 'Unassigned'}</p>
        <p>Priority: {project.priority}</p>
        <p>Progress: {project.progress}%</p>
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
        <p>Error loading projects: {error}</p>
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
        onStatusChange={handleStatusChange}
        renderCard={renderCard}
        onAddProject={handleAddProject}
        onEditProject={handleEditProject}
        projects={projects}
      />
    </div>
  );
};

export default ProjectsPage;
