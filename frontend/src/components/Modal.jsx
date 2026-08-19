import React, { useState, useEffect } from 'react';

const Modal = ({ 
  isOpen, 
  onClose, 
  title, 
  onSubmit, 
  children,
  submitButtonText = "Save",
  submitting = false
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  useEffect(() => {
    // Prevent scrolling when modal is open
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      await onSubmit(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{title}</h2>
          <button className="modal-close-button" onClick={onClose}>&times;</button>
        </div>
        
        <form onSubmit={handleSubmit}>
          {children}
          
          <div className="modal-footer">
            <button 
              type="button" 
              className="modal-cancel-button"
              onClick={onClose}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="modal-submit-button"
              disabled={isSubmitting || submitting}
            >
              {isSubmitting || submitting ? 'Saving...' : submitButtonText}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Modal;