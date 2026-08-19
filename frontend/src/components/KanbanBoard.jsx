import React, { useState } from 'react';
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  closestCorners,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import Modal from './Modal';
import ProjectForm from './ProjectForm';
import TaskForm from './TaskForm';

// Helper function to group items by status
const groupItemsByStatus = (items, getItemStatus) => {
  const groups = {};
  
  items.forEach(item => {
    const status = getItemStatus(item);
    if (!groups[status]) {
      groups[status] = [];
    }
    groups[status].push(item);
  });
  
  return groups;
};

// Kanban Column Component
const KanbanColumn = ({
  column,
  items,
  renderCard,
  onDragStart,
  onDragEnd,
  onDragOver,
  isOverlay = false,
  onAddItem,
  onEditItem,
  modalType,
  projects = []
}) => {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor)
  );

  const openAddModal = () => {
    onAddItem(modalType);
  };

  const openEditModal = (item) => {
    onEditItem(modalType, item);
  };

  return (
    <div className="kanban-column">
      <div className="kanban-column-header">
        <h3>{column.label}</h3>
        <span className="item-count">{items.length}</span>
      </div>
      
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
        onDragOver={onDragOver}
      >
        <SortableContext items={items.map(item => item.id)} strategy={verticalListSortingStrategy}>
          <div className="kanban-column-content">
            {/* Add card button */}
            <button 
              className="add-card-button"
              onClick={openAddModal}
            >
              + Add Card
            </button>
            
            {items.map(item => (
              <div 
                key={item.id} 
                className="kanban-card-container"
                onClick={(e) => {
                  e.stopPropagation();
                  openEditModal(item);
                }}
              >
                {renderCard(item)}
              </div>
            ))}
          </div>
        </SortableContext>
        
        <DragOverlay>
          {isOverlay ? renderCard(isOverlay) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
};

// Main KanbanBoard Component
const KanbanBoard = ({
  items,
  columns,
  getItemStatus,
  onStatusChange,
  renderCard,
  onAddProject,
  onAddTask,
  onEditProject,
  onEditTask,
  projects = []
}) => {
  const [activeItem, setActiveItem] = React.useState(null);
  const [columnItems, setColumnItems] = React.useState({});
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState(''); // 'project' or 'task'
  const [editingItem, setEditingItem] = useState(null);
  const [errors, setErrors] = useState({});
  
  // Initialize column items
  React.useEffect(() => {
    const groups = groupItemsByStatus(items, getItemStatus);
    setColumnItems(groups);
  }, [items, getItemStatus]);

  const handleDragStart = (event) => {
    setActiveItem(event.active.data.current);
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      // Find the new column status
      const newColumnStatus = columns.find(col => col.status === over.data.current?.columnId)?.status;
      
      if (newColumnStatus) {
        // Call the onStatusChange callback
        onStatusChange(active.id, newColumnStatus);
        
        // Update local state to reflect the change
        setColumnItems(prev => {
          const newItems = { ...prev };
          
          // Remove from old column
          let oldColumnStatus = null;
          Object.keys(newItems).forEach(status => {
            if (newItems[status].some(item => item.id === active.id)) {
              oldColumnStatus = status;
              return;
            }
          });
          
          if (oldColumnStatus && oldColumnStatus !== newColumnStatus) {
            newItems[oldColumnStatus] = newItems[oldColumnStatus].filter(item => item.id !== active.id);
            if (!newItems[newColumnStatus]) {
              newItems[newColumnStatus] = [];
            }
            newItems[newColumnStatus].push(items.find(item => item.id === active.id));
          }
          
          return newItems;
        });
      }
    }
    
    setActiveItem(null);
  };

  const handleDragOver = (event) => {
    // This is handled by the DndContext onDragOver
  };
  
  const openAddModal = (type) => {
    setModalType(type);
    setEditingItem(null);
    setErrors({});
    setIsModalOpen(true);
  };
  
  const openEditModal = (type, item) => {
    setModalType(type);
    setEditingItem(item);
    setErrors({});
    setIsModalOpen(true);
  };
  
  const closeModal = () => {
    setIsModalOpen(false);
    setEditingItem(null);
    setErrors({});
  };
  
  const handleSubmit = async (formData) => {
    try {
      if (modalType === 'project') {
        if (editingItem) {
          // Update existing project
          await onEditProject(editingItem.id, formData);
        } else {
          // Create new project
          await onAddProject(formData);
        }
      } else if (modalType === 'task') {
        if (editingItem) {
          // Update existing task
          await onEditTask(editingItem.id, formData);
        } else {
          // Create new task
          await onAddTask(formData);
        }
      }
      
      closeModal();
    } catch (error) {
      if (error.response && error.response.status === 422) {
        setErrors(error.response.data);
      } else {
        console.error('Error saving:', error);
        // Handle other errors as needed
      }
    }
  };

  return (
    <div className="kanban-board">
      {columns.map(column => (
        <KanbanColumn
          key={column.status}
          column={column}
          items={columnItems[column.status] || []}
          renderCard={renderCard}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDragOver={handleDragOver}
          onAddItem={openAddModal}
          onEditItem={openEditModal}
          modalType={modalType}
          projects={projects}
        />
      ))}
      
      {/* Modal for adding/editing projects/tasks */}
      <Modal 
        isOpen={isModalOpen}
        onClose={closeModal}
        title={editingItem ? `Edit ${modalType === 'project' ? 'Project' : 'Task'}` : `Add ${modalType === 'project' ? 'Project' : 'Task'}`}
        onSubmit={handleSubmit}
        submitButtonText={editingItem ? "Update" : "Create"}
      >
        {modalType === 'project' && (
          <ProjectForm 
            project={editingItem} 
            onSubmit={handleSubmit} 
            errors={errors}
          />
        )}
        {modalType === 'task' && (
          <TaskForm 
            task={editingItem} 
            onSubmit={handleSubmit} 
            errors={errors}
            projects={projects}
          />
        )}
      </Modal>
    </div>
  );
};

export default KanbanBoard;