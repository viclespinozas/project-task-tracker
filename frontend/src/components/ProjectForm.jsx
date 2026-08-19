import React, { useState } from 'react';

const ProjectForm = ({ project, onSubmit, errors = {} }) => {
  const [formData, setFormData] = useState({
    name: project?.name || '',
    assignee: project?.assignee || '',
    priority: project?.priority || '',
    progress: project?.progress?.toString() || '',
    start_date: project?.start_date || '',
    end_date: project?.end_date || '',
    start_value: project?.start_value?.toString() || '',
    end_value: project?.end_value?.toString() || '',
    status: project?.status || 'Not Started'
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleNumericChange = (e) => {
    const { name, value } = e.target;
    // Only allow numeric values
    if (value === '' || /^\d+$/.test(value)) {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Convert numeric fields to numbers
    const submitData = {
      ...formData,
      progress: formData.progress ? parseInt(formData.progress) : null,
      start_value: formData.start_value ? parseInt(formData.start_value) : null,
      end_value: formData.end_value ? parseInt(formData.end_value) : null
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
        <label htmlFor="progress">Progress (%)</label>
        <input
          type="text"
          id="progress"
          name="progress"
          value={formData.progress}
          onChange={handleNumericChange}
          placeholder="0-100"
        />
        {errors.progress && <span className="error-message">{errors.progress}</span>}
      </div>

      <div className="form-group">
        <label htmlFor="start_date">Start Date</label>
        <input
          type="date"
          id="start_date"
          name="start_date"
          value={formData.start_date}
          onChange={handleChange}
        />
        {errors.start_date && <span className="error-message">{errors.start_date}</span>}
      </div>

      <div className="form-group">
        <label htmlFor="end_date">End Date</label>
        <input
          type="date"
          id="end_date"
          name="end_date"
          value={formData.end_date}
          onChange={handleChange}
        />
        {errors.end_date && <span className="error-message">{errors.end_date}</span>}
      </div>

      <div className="form-group">
        <label htmlFor="start_value">Start Value</label>
        <input
          type="text"
          id="start_value"
          name="start_value"
          value={formData.start_value}
          onChange={handleNumericChange}
        />
        {errors.start_value && <span className="error-message">{errors.start_value}</span>}
      </div>

      <div className="form-group">
        <label htmlFor="end_value">End Value</label>
        <input
          type="text"
          id="end_value"
          name="end_value"
          value={formData.end_value}
          onChange={handleNumericChange}
        />
        {errors.end_value && <span className="error-message">{errors.end_value}</span>}
      </div>

      <div className="form-group">
        <label htmlFor="status">Status</label>
        <select
          id="status"
          name="status"
          value={formData.status}
          onChange={handleChange}
        >
          <option value="Not Started">Not Started</option>
          <option value="In Progress">In Progress</option>
          <option value="Done">Done</option>
        </select>
        {errors.status && <span className="error-message">{errors.status}</span>}
      </div>
    </form>
  );
};

export default ProjectForm;