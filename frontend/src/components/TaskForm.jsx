import React, { useState } from 'react';

const TaskForm = ({ task, onSubmit, errors = {}, projects = [] }) => {
  const [formData, setFormData] = useState({
    name: task?.name || '',
    status: task?.status || 'Inbox',
    assignee: task?.assignee || '',
    due_date: task?.due_date || '',
    priority: task?.priority || '',
    description: task?.description || '',
    project_id: task?.project_id?.toString() || ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Convert project_id to number if it exists
    const submitData = {
      ...formData,
      project_id: formData.project_id ? parseInt(formData.project_id) : null
    };

    onSubmit(submitData);
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="form-group">
        <label htmlFor="name">Name *</label>
        <input
          type="text"
          id="name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          required
        />
        {errors.name && <span className="error-message">{errors.name}</span>}
      </div>

      <div className="form-group">
        <label htmlFor="status">Status</label>
        <select
          id="status"
          name="status"
          value={formData.status}
          onChange={handleChange}
        >
          <option value="Inbox">Inbox</option>
          <option value="Waiting">Waiting</option>
          <option value="Next">Next</option>
          <option value="Doing">Doing</option>
          <option value="Done">Done</option>
        </select>
        {errors.status && <span className="error-message">{errors.status}</span>}
      </div>

      <div className="form-group">
        <label htmlFor="assignee">Assignee</label>
        <input
          type="text"
          id="assignee"
          name="assignee"
          value={formData.assignee}
          onChange={handleChange}
        />
        {errors.assignee && <span className="error-message">{errors.assignee}</span>}
      </div>

      <div className="form-group">
        <label htmlFor="due_date">Due Date</label>
        <input
          type="date"
          id="due_date"
          name="due_date"
          value={formData.due_date}
          onChange={handleChange}
        />
        {errors.due_date && <span className="error-message">{errors.due_date}</span>}
      </div>

      <div className="form-group">
        <label htmlFor="priority">Priority</label>
        <select
          id="priority"
          name="priority"
          value={formData.priority}
          onChange={handleChange}
        >
          <option value="">Select priority</option>
          <option value="High">High</option>
          <option value="Medium">Medium</option>
          <option value="Low">Low</option>
        </select>
        {errors.priority && <span className="error-message">{errors.priority}</span>}
      </div>

      <div className="form-group">
        <label htmlFor="description">Description</label>
        <textarea
          id="description"
          name="description"
          value={formData.description}
          onChange={handleChange}
          rows="3"
        />
        {errors.description && <span className="error-message">{errors.description}</span>}
      </div>

      <div className="form-group">
        <label htmlFor="project_id">Project</label>
        <select
          id="project_id"
          name="project_id"
          value={formData.project_id}
          onChange={handleChange}
        >
          <option value="">Select a project</option>
          {projects.map(project => (
            <option key={project.id} value={project.id}>
              {project.name}
            </option>
          ))}
        </select>
        {errors.project_id && <span className="error-message">{errors.project_id}</span>}
      </div>
    </form>
  );
};

export default TaskForm;