import React, { useState, useEffect, useRef, createContext, useContext, ReactNode, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useWorkspace } from './WorkspaceContext';
import DebugPanel from '../components/DebugPanel';

interface TouchDragState {
  isDragging: boolean;
  item: any;
  itemType: string;
  initialX: number;
  initialY: number;
  currentX: number;
  currentY: number;
}

interface TouchDragContextType {
  startTouchDrag: (item: any, itemType: string, e: React.TouchEvent) => void;
  touchDragState: TouchDragState | null;
  closeInventoryTray?: () => void;
}

const TouchDragContext = createContext<TouchDragContextType | undefined>(undefined);

export function TouchDragProvider({ children }: { children: ReactNode }) {
  const { addIngredient, setCookware, setUtensil } = useWorkspace();
  const [touchDrag, setTouchDrag] = useState<TouchDragState | null>(null);
  const workspaceRef = useRef<HTMLElement | null>(null);
  
  // Track whether we're currently dragging (for visual indicators)
  const [isDragging, setIsDragging] = useState(false);

  // Find the workspace element once on mount
  useEffect(() => {
    workspaceRef.current = document.querySelector('.workspace-container');
  }, []);

  // Start a touch drag
  const startTouchDrag = (item: any, itemType: string, e: React.TouchEvent) => {
    // Handle utensils with a click action instead of drag
    if (itemType === 'utensil') {
      setUtensil(item);
      return;
    }
    
    // Handle cookware with a click action instead of drag
    if (itemType === 'cookware') {
      setCookware(item);
      return;
    }
    
    // For ingredients, start dragging
    const touch = e.touches[0];
    setTouchDrag({
      isDragging: true,
      item,
      itemType,
      initialX: touch.clientX,
      initialY: touch.clientY,
      currentX: touch.clientX,
      currentY: touch.clientY - 40 // Significant offset for visibility
    });
    
    // Close inventory if open
    setTimeout(() => {
      const handle = document.querySelector('.inventory-drawer-handle');
      if (handle && handle instanceof HTMLElement) {
        handle.click();
      }
    }, 50);
  };
  
  // Handle touch events
  useEffect(() => {
    if (!touchDrag) return;
    
    console.log('Touch drag active for:', touchDrag.item.name);
    
    const touchMoveHandler = (e: TouchEvent) => {
      if (!touchDrag) return;
      
      // Log the movement
      console.log('Touch moving:', e.touches[0].clientX, e.touches[0].clientY);
      
      if (e.cancelable) {
        e.preventDefault();
      }
      
      const touch = e.touches[0];
      setTouchDrag(prev => prev ? {
        ...prev,
        currentX: touch.clientX,
        currentY: touch.clientY - 50  // More offset for visibility
      } : null);
    };
    
    const touchEndHandler = (e: TouchEvent) => {
      setIsDragging(false);
      
      if (!touchDrag) return;
      
      // Only handle drops for ingredients
      if (touchDrag.itemType !== 'ingredient') {
        setTouchDrag(null);
        return;
      }
      
      const touch = e.changedTouches[0];
      const x = touch.clientX;
      const y = touch.clientY;
      
      if (workspaceRef.current) {
        const rect = workspaceRef.current.getBoundingClientRect();
        const isOverWorkspace = 
          x >= rect.left && x <= rect.right && 
          y >= rect.top && y <= rect.bottom;
        
        if (isOverWorkspace) {
          // Calculate position relative to workspace
          const relativeX = x - rect.left;
          const relativeY = y - rect.top;
          addIngredient(touchDrag.item, relativeX, relativeY);
        }
      }
      
      setTouchDrag(null);
    };
    
    // Use non-passive event listeners for touchmove to prevent scrolling
    document.addEventListener('touchmove', touchMoveHandler, { passive: false });
    document.addEventListener('touchend', touchEndHandler);
    
    return () => {
      document.removeEventListener('touchmove', touchMoveHandler);
      document.removeEventListener('touchend', touchEndHandler);
    };
  }, [touchDrag, addIngredient]);
  
  // Dummy close function (will be overridden by App component)
  const closeInventoryTray = useCallback(() => {}, []);

  return (
    <TouchDragContext.Provider value={{ 
      startTouchDrag, 
      touchDragState: touchDrag,
      closeInventoryTray 
    }}>
      {children}
      {touchDrag && (
        <TouchDragPreview 
          item={touchDrag.item}
          x={touchDrag.currentX}
          y={touchDrag.currentY}
        />
      )}
      {/* Add debug panel when dragging */}
      {touchDrag && (
        <DebugPanel data={{ 
          item: touchDrag.item.name,
          x: touchDrag.currentX,
          y: touchDrag.currentY,
          type: touchDrag.itemType
        }} />
      )}
    </TouchDragContext.Provider>
  );
}

// Hook for accessing the context
export function useTouchDrag() {
  const context = useContext(TouchDragContext);
  if (context === undefined) {
    throw new Error('useTouchDrag must be used within a TouchDragProvider');
  }
  return context;
}

// Helper function for components that don't have direct access to the context
export function TouchDragManager() {
  try {
    return useTouchDrag();
  } catch (error) {
    return {
      startTouchDrag: () => {},
      touchDragState: null
    };
  }
}

// This component renders the floating preview during a touch drag
function TouchDragPreview({ item, x, y }: { item: any; x: number; y: number }) {
  if (!item || !item.image) return null;

  return createPortal(
    <div 
      className="pointer-events-none fixed z-50"
      style={{
        left: x,
        top: y - 40, // Offset higher above finger for better visibility
        transform: 'translate(-50%, -50%)'
      }}
    >
      <img
        src={item.image}
        alt={item.name}
        className="w-24 h-24 object-contain" // Make it larger
        style={{ 
          filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.4))',
          opacity: 1 // Full opacity
        }}
      />
    </div>,
    document.body
  );
}

export { TouchDragPreview };