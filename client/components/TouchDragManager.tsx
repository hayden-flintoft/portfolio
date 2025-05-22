import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useWorkspace } from '../context/WorkspaceContext';

interface TouchDragState {
  isDragging: boolean;
  item: any;
  itemType: string;
  initialX: number;
  initialY: number;
  currentX: number;
  currentY: number;
}

function TouchDragManager() {
  const { addIngredient, setCookware, setUtensil, workspace } = useWorkspace();
  const [touchDrag, setTouchDrag] = useState<TouchDragState | null>(null);
  const workspaceRef = useRef<HTMLElement | null>(null);

  // Find the workspace element once on mount
  useEffect(() => {
    workspaceRef.current = document.querySelector('.workspace-container');
  }, []);

  // Handle touch end (equivalent to drop)
  const handleTouchEnd = (e: TouchEvent) => {
    if (!touchDrag) return;
    
    e.preventDefault();
    
    // Get the touch coordinates
    const touch = e.changedTouches[0];
    const x = touch.clientX;
    const y = touch.clientY;
    
    // Check if we're over the workspace
    if (workspaceRef.current) {
      const rect = workspaceRef.current.getBoundingClientRect();
      const isOverWorkspace = 
        x >= rect.left && 
        x <= rect.right && 
        y >= rect.top && 
        y <= rect.bottom;
      
      if (isOverWorkspace) {
        // Handle the "drop" based on item type
        const { item, itemType } = touchDrag;
        
        if (itemType === 'cookware') {
          setCookware(item);
        } else if (itemType === 'utensil') {
          setUtensil(item);
        } else if (itemType === 'ingredient') {
          // Calculate position relative to workspace
          const relativeX = x - rect.left;
          const relativeY = y - rect.top;
          addIngredient(item, relativeX, relativeY);
        }
      }
    }
    
    // Reset drag state
    setTouchDrag(null);
  };
  
  // Handle touch move
  const handleTouchMove = (e: TouchEvent) => {
    if (!touchDrag) return;
    
    e.preventDefault();
    
    // Update position
    const touch = e.changedTouches[0];
    setTouchDrag({
      ...touchDrag,
      currentX: touch.clientX,
      currentY: touch.clientY
    });
  };
  
  // Register global touch handlers when we're dragging
  useEffect(() => {
    if (touchDrag) {
      // Use non-passive event listeners for touch events
      const touchMoveHandler = (e: TouchEvent) => {
        if (!touchDrag) return;
        e.preventDefault();
        
        // Update position
        const touch = e.changedTouches[0];
        setTouchDrag(prev => prev ? ({
          ...prev,
          currentX: touch.clientX,
          currentY: touch.clientY
        }) : null);
      };
      
      const touchEndHandler = (e: TouchEvent) => {
        if (!touchDrag) return;
        
        // Get the touch coordinates
        const touch = e.changedTouches[0];
        const x = touch.clientX;
        const y = touch.clientY;
        
        // Check if we're over the workspace
        if (workspaceRef.current) {
          const rect = workspaceRef.current.getBoundingClientRect();
          const isOverWorkspace = 
            x >= rect.left && 
            x <= rect.right && 
            y >= rect.top && 
            y <= rect.bottom;
          
          if (isOverWorkspace) {
            // Handle the "drop" based on item type
            const { item, itemType } = touchDrag;
            
            if (itemType === 'cookware') {
              setCookware(item);
            } else if (itemType === 'utensil') {
              setUtensil(item);
            } else if (itemType === 'ingredient') {
              // Calculate position relative to workspace
              const relativeX = x - rect.left;
              const relativeY = y - rect.top;
              addIngredient(item, relativeX, relativeY);
            }
          }
        }
        
        // Reset drag state
        setTouchDrag(null);
      };

      // Add listeners with correct options
      document.addEventListener('touchmove', touchMoveHandler, { passive: false });
      document.addEventListener('touchend', touchEndHandler);
      
      return () => {
        document.removeEventListener('touchmove', touchMoveHandler);
        document.removeEventListener('touchend', touchEndHandler);
      };
    }
  }, [touchDrag]);

  // Start a touch drag
  const startTouchDrag = (item: any, itemType: string, e: React.TouchEvent) => {
    // For ingredients, auto-close the inventory panel immediately
    if (itemType === 'ingredient') {
      const handle = document.querySelector('.inventory-drawer-handle');
      if (handle && handle instanceof HTMLElement) {
        handle.click();
      }
    }
    
    // Capture the touch point
    const touch = e.touches[0];
    
    // Set the drag state
    setTouchDrag({
      isDragging: true,
      item,
      itemType,
      initialX: touch.clientX,
      initialY: touch.clientY,
      currentX: touch.clientX,
      currentY: touch.clientY - 30 // Offset for better visibility
    });
  };

  return {
    startTouchDrag,
    touchDragState: touchDrag
  };
}

// This component renders the floating preview during a touch drag
function TouchDragPreview({ item, x, y }: { item: any; x: number; y: number }) {
  if (!item || !item.image) return null;

  return createPortal(
    <div 
      className="pointer-events-none fixed z-50"
      style={{
        left: x,
        top: y - 50, // Move it higher above the finger
        transform: 'translate(-50%, -50%)'
      }}
    >
      {/* Add debug info */}
      <div className="absolute -top-8 left-0 right-0 text-center text-xs bg-black text-white px-2 py-1 rounded">
        {item.name} ({x}, {y})
      </div>
      
      {/* Make the image larger and more visible */}
      <div className="relative">
        <div className="absolute inset-0 bg-white rounded-full opacity-30" 
             style={{ transform: 'scale(1.2)' }}></div>
        <img
          src={item.image}
          alt={item.name}
          className="w-32 h-32 object-contain" // Much larger
          style={{ 
            filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.4))',
            opacity: 1
          }}
          onError={(e) => {
            console.error(`Failed to load image: ${item.image}`);
            e.currentTarget.onerror = null;
            e.currentTarget.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' fill='%23ddd'/%3E%3Ctext x='50' y='50' font-family='Arial' font-size='14' text-anchor='middle' alignment-baseline='middle'%3E${item.name}%3C/text%3E%3C/svg%3E";
          }}
        />
      </div>
    </div>,
    document.body
  );
}

export { TouchDragManager, TouchDragPreview };