import React, { useState } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// KanbanBoard component - a generic, reusable component for drag-and-drop task management
const KanbanBoard = ({ 
  items, 
  columns, 
  getItemStatus, 
  onStatusChange, 
  renderCard 
}) => {
  // Initialize state for each column's items
  const [columnItems, setColumnItems] = useState(() => {
    const initialItems = {};
    columns.forEach(column => {
      initialItems[column.value] = [];
    });
    
    // Group items by their status
    items.forEach(item => {
      const status = getItemStatus(item);
      if (initialItems[status]) {
        initialItems[status].push(item);
      }
    });
    
    return initialItems;
  });

  // Track currently dragged item
  const [activeItem, setActiveItem] = useState(null);

  // Set up sensors for drag and drop
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Handle drag start
  const handleDragStart = (event) => {
    setActiveItem(event.active.data.current?.item);
  };

  // Handle drag end
  const handleDragEnd = (event) => {
    const { active, over } = event;
    
    // Reset active item
    setActiveItem(null);

    // If no drop target or same position, do nothing
    if (!over || active.id === over.id) {
      return;
    }

    const activeColumn = active.data.current?.columnId;
    const overColumn = over.data.current?.columnId;

    // If we're moving within the same column
    if (activeColumn === overColumn) {
      // Reorder items in the same column
      setColumnItems(prev => {
        const newItems = { ...prev };
        const itemsInColumn = [...newItems[activeColumn]];
        const oldIndex = itemsInColumn.findIndex(item => item.id === active.id);
        const newIndex = itemsInColumn.findIndex(item => item.id === over.id);
        
        if (oldIndex !== -1 && newIndex !== -1) {
          newItems[activeColumn] = arrayMove(itemsInColumn, oldIndex, newIndex);
        }
        
        return newItems;
      });
    } else {
      // Moving between columns
      setColumnItems(prev => {
        const newItems = { ...prev };
        
        // Remove item from source column
        const activeItems = [...newItems[activeColumn]];
        const activeIndex = activeItems.findIndex(item => item.id === active.id);
        if (activeIndex !== -1) {
          const [removedItem] = activeItems.splice(activeIndex, 1);
          
          // Add item to target column
          newItems[activeColumn] = activeItems;
          newItems[overColumn] = [...newItems[overColumn], removedItem];
          
          // Call status change callback
          if (onStatusChange) {
            onStatusChange(removedItem.id, overColumn);
          }
        }
        
        return newItems;
      });
    }
  };

  // Handle drag cancel
  const handleDragCancel = () => {
    setActiveItem(null);
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <div className="kanban-board">
        {columns.map(column => (
          <div key={column.value} className="kanban-column">
            <div className="kanban-column-header">
              <h3>{column.label}</h3>
              <span className="kanban-column-count">{columnItems[column.value]?.length || 0}</span>
            </div>
            <SortableContext
              items={(columnItems[column.value] || []).map(item => item.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="kanban-column-items">
                {(columnItems[column.value] || []).map(item => (
                  <div key={item.id} className="kanban-card">
                    {renderCard(item)}
                  </div>
                ))}
              </div>
            </SortableContext>
          </div>
        ))}
      </div>
      <DragOverlay>
        {activeItem ? (
          <div className="kanban-card kanban-card-dragging">
            {renderCard(activeItem)}
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
};

export default KanbanBoard;