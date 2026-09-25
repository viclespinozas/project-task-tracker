import React, { useState, useEffect } from 'react';

const ModalForm = ({
  isOpen,
  onClose,
  onSubmit,
  title,
  type, // 'project' or 'task'
  initialData = null,
  validationErrors = null,
  projects = [] // needed for the task form's project picker
}) => {
  const [formData, setFormData] = useState(initialData || (type === 'project' ? getDefaultProjectData() : getDefaultTaskData()));
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Resync when a new item is opened — ModalForm stays mounted even while
  // closed, so without this, formData only ever reflected whatever
  // initialData existed on this component's very first render, and every
  // later Edit (or Add) showed blank/default fields instead of the real item.
  useEffect(() => {
    if (isOpen) {
      setFormData(initialData || (type === 'project' ? getDefaultProjectData() : getDefaultTaskData()));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, initialData, type]);

  // Default project data
  function getDefaultProjectData() {
    return {
      name: '',
      assignee: '',
      priority: '',
      progress: null,
      start_date: '',
      end_date: '',
      start_value: null,
      end_value: null,
      status: 'Not Started'
    };
  }

  // Default task data
  function getDefaultTaskData() {
    return {
      name: '',
      status: 'Inbox',
      assignee: '',
      due_date: '',
      priority: 'Medium',
      description: '',
      project_id: null
    };
  }

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Blank <input type="date"> fields yield '', which the backend rejects as an
    // invalid date — send null instead so optional dates can be left empty.
    const payload = type === 'project'
      ? { ...formData, start_date: formData.start_date || null, end_date: formData.end_date || null }
      : { ...formData, due_date: formData.due_date || null };

    try {
      await onSubmit(payload);
      onClose();
    } catch (error) {
      // Validation errors are handled by the parent component
      console.error('Form submission error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setFormData(initialData || (type === 'project' ? getDefaultProjectData() : getDefaultTaskData()));
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{title}</h2>
          <button className="modal-close-button" onClick={handleClose}>&times;</button>
        </div>
        
        <form onSubmit={handleSubmit}>
          {type === 'project' ? (
            <div className="form-group">
              <div className="field">
                <label htmlFor="name">Name *</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
                {validationErrors?.name && <span className="error">{validationErrors.name}</span>}
              </div>

              <div className="field">
                <label htmlFor="assignee">Assignee</label>
                <input
                  type="text"
                  id="assignee"
                  name="assignee"
                  value={formData.assignee}
                  onChange={handleChange}
                />
              </div>

              <div className="field">
                <label htmlFor="priority">Priority</label>
                <select
                  id="priority"
                  name="priority"
                  value={formData.priority}
                  onChange={handleChange}
                >
                  <option value="">Select Priority</option>
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                </select>
              </div>

              <div className="field">
                <label htmlFor="progress">Progress (%)</label>
                <input
                  type="number"
                  id="progress"
                  name="progress"
                  min="0"
                  max="100"
                  value={formData.progress || ''}
                  onChange={handleChange}
                />
              </div>

              <div className="field">
                <label htmlFor="start_date">Start Date</label>
                <input
                  type="date"
                  id="start_date"
                  name="start_date"
                  value={formData.start_date}
                  onChange={handleChange}
                />
              </div>

              <div className="field">
                <label htmlFor="end_date">End Date</label>
                <input
                  type="date"
                  id="end_date"
                  name="end_date"
                  value={formData.end_date}
                  onChange={handleChange}
                />
              </div>

              <div className="field">
                <label htmlFor="start_value">Start Value</label>
                <input
                  type="number"
                  id="start_value"
                  name="start_value"
                  value={formData.start_value || ''}
                  onChange={handleChange}
                />
              </div>

              <div className="field">
                <label htmlFor="end_value">End Value</label>
                <input
                  type="number"
                  id="end_value"
                  name="end_value"
                  value={formData.end_value || ''}
                  onChange={handleChange}
                />
              </div>

              <div className="field">
                <label htmlFor="status">Status *</label>
                <select
                  id="status"
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  required
                >
                  <option value="Not Started">Not Started</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Done">Done</option>
                </select>
              </div>
            </div>
          ) : (
            <div className="form-group">
              <div className="field">
                <label htmlFor="name">Name *</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
                {validationErrors?.name && <span className="error">{validationErrors.name}</span>}
              </div>

              <div className="field">
                <label htmlFor="project_id">Project *</label>
                <select
                  id="project_id"
                  name="project_id"
                  value={formData.project_id || ''}
                  onChange={handleChange}
                  required
                >
                  <option value="" disabled>Select a project</option>
                  {projects.map(project => (
                    <option key={project.id} value={project.id}>
                      {project.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="field">
                <label htmlFor="status">Status *</label>
                <select
                  id="status"
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  required
                >
                  <option value="Inbox">Inbox</option>
                  <option value="Waiting">Waiting</option>
                  <option value="Next">Next</option>
                  <option value="Doing">Doing</option>
                  <option value="Done">Done</option>
                </select>
              </div>

              <div className="field">
                <label htmlFor="assignee">Assignee</label>
                <input
                  type="text"
                  id="assignee"
                  name="assignee"
                  value={formData.assignee}
                  onChange={handleChange}
                />
              </div>

              <div className="field">
                <label htmlFor="due_date">Due Date</label>
                <input
                  type="date"
                  id="due_date"
                  name="due_date"
                  value={formData.due_date}
                  onChange={handleChange}
                />
              </div>

              <div className="field">
                <label htmlFor="priority">Priority *</label>
                <select
                  id="priority"
                  name="priority"
                  value={formData.priority}
                  onChange={handleChange}
                  required
                >
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                </select>
              </div>

              <div className="field full-width">
                <label htmlFor="description">Description</label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows="4"
                />
              </div>
            </div>
          )}

          <div className="modal-footer">
            <button 
              type="button" 
              className="btn btn-secondary"
              onClick={handleClose}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="btn btn-primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ModalForm;