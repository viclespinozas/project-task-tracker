import React from 'react';
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
  isOverlay = false
}) => {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor)
  );

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
            {items.map(item => renderCard(item))}
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
  renderCard
}) => {
  const [activeItem, setActiveItem] = React.useState(null);
  const [columnItems, setColumnItems] = React.useState({});

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
        />
      ))}
    </div>
  );
};

export default KanbanBoard;