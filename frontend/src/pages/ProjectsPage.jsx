import React, { useState, useEffect } from 'react';
import { apiClient } from '../api/client';
import KanbanBoard from '../components/KanbanBoard';
import ModalForm from '../components/ModalForm';

const ProjectsPage = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState('project'); // 'project' or 'task'
  const [modalTitle, setModalTitle] = useState('');
  const [initialModalData, setInitialModalData] = useState(null);
  const [validationErrors, setValidationErrors] = useState(null);

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
        <div className="card-meta">
          {project.assignee && <span className="chip chip-assignee">{project.assignee}</span>}
          {project.priority && (
            <span className={`chip chip-priority chip-priority-${project.priority.toLowerCase()}`}>
              {project.priority}
            </span>
          )}
        </div>
        {project.progress !== null && project.progress !== undefined && (
          <div className="progress-wrap">
            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{ width: `${project.progress}%` }}
              ></div>
            </div>
            <span className="progress-label">{project.progress}%</span>
          </div>
        )}
      </div>
    );
  };

  // Handle adding a new project
  const handleAddProject = (status) => {
    setModalTitle('Create Project');
    setInitialModalData({ status });
    setIsModalOpen(true);
    setValidationErrors(null);
  };

  // Handle editing an existing project
  const handleEditProject = (project) => {
    setModalTitle('Edit Project');
    setInitialModalData(project);
    setIsModalOpen(true);
    setValidationErrors(null);
  };

  // Submit form data to backend
  const handleSubmitForm = async (formData) => {
    try {
      if (initialModalData && initialModalData.id) {
        // Update existing project
        await apiClient.patch(`/projects/${initialModalData.id}`, formData);
        // Refresh projects list
        const response = await apiClient.get('/projects');
        setProjects(response);
      } else {
        // Create new project
        await apiClient.post('/projects', formData);
        // Refresh projects list
        const response = await apiClient.get('/projects');
        setProjects(response);
      }
      setIsModalOpen(false);
    } catch (error) {
      if (error.response && error.response.status === 422) {
        // Handle validation errors
        setValidationErrors(error.response.data.detail || {});
      } else {
        setError('Failed to save project');
        console.error('Failed to save project:', error);
      }
    }
  };

  if (loading) {
    return (
      <div className="page">
        <h1>Projects</h1>
        <p className="state-message">Loading projects…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page">
        <h1>Projects</h1>
        <p className="state-message error">{error}</p>
      </div>
    );
  }

  return (
    <div className="page">
      <h1>Projects</h1>
      <KanbanBoard
        items={projects}
        columns={columns}
        getItemStatus={getItemStatus}
        onStatusChange={onStatusChange}
        renderCard={renderCard}
        onAddItem={handleAddProject}
        onEditItem={handleEditProject}
      />
      
      <ModalForm
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSubmitForm}
        title={modalTitle}
        type="project"
        initialData={initialModalData}
        validationErrors={validationErrors}
      />
    </div>
  );
}

export default ProjectsPage
