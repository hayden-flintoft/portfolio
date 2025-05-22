import React from 'react';
import { useIngredients } from '../context/IngredientsContext';
import { useKitchenItems } from '../context/KitchenItemsContext';
import { useWorkspace } from '../context/WorkspaceContext';
import { TouchDragManager, TouchDragPreview } from './TouchDragManager'; // Fix import path

interface QuickAccessBarProps {
  onOpenInventory?: () => void;
}

function QuickAccessBar({ onOpenInventory }: QuickAccessBarProps) {
  const { ingredients } = useIngredients();
  const { cookware, utensils } = useKitchenItems();
  const { setCookware, setUtensil, workspace } = useWorkspace();
  const { startTouchDrag, touchDragState } = TouchDragManager();
  
  // Handle item click - UPDATED
  const handleItemClick = (item: any, itemType: string) => {
    console.log('Item clicked:', item?.name, itemType);
    if (!item) return;
    
    // Always activate the item on click, no toggle behavior
    if (itemType === 'cookware') {
      setCookware(item);
    } else if (itemType === 'utensil') {
      setUtensil(item);
    }
  };

  return (
    <div className="relative">
      <div className="bg-white border-t shadow-md">
        {/* Quick Access Section */}
        <div className="bg-gray-50 p-2 border-b">
          <div className="flex overflow-x-auto space-x-2 pb-1">
            {/* Chopping Board - UPDATED */}
            <div 
              className="flex-shrink-0 cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                const board = cookware.find(c => c.name === "Chopping Board");
                if (board) handleItemClick(board, 'cookware');
              }}
              onTouchStart={(e) => {
                // For draggable items like ingredients, keep drag behavior
                // But for cookware and utensils, just use click behavior
                const board = cookware.find(c => c.name === "Chopping Board");
                if (board) {
                  e.stopPropagation();
                  handleItemClick(board, 'cookware');
                }
              }}
            >
              <div className={`h-12 w-12 rounded overflow-hidden border ${
                workspace.cookware?.name === "Chopping Board" ? 'border-green-500' : 'border-gray-200'
              }`}>
                <img 
                  src="/images/chopping_board.png" 
                  alt="Chopping Board" 
                  className="h-full w-full object-cover"
                />
              </div>
              <p className="text-xs text-center mt-0.5 truncate w-12">Board</p>
            </div>
            
            {/* Bowl */}
            <div 
              className="flex-shrink-0 cursor-pointer"
              onClick={() => handleItemClick(cookware.find(c => c.name === "Bowl"), 'cookware')}
              onTouchStart={(e) => {
                e.stopPropagation();
                const bowl = cookware.find(c => c.name === "Bowl");
                if (bowl) handleItemClick(bowl, 'cookware'); // Use click behavior, no drag
              }}
            >
              <div className={`h-12 w-12 rounded overflow-hidden border ${
                workspace.cookware?.name === "Bowl" ? 'border-green-500' : 'border-gray-200'
              }`}>
                <img 
                  src="/images/bowl.png" 
                  alt="Bowl" 
                  className="h-full w-full object-cover"
                />
              </div>
              <p className="text-xs text-center mt-0.5 truncate w-12">Bowl</p>
            </div>
            
            {/* Knife - Click activation ONLY */}
            <div 
              className="flex-shrink-0 cursor-pointer"
              onClick={() => handleItemClick(utensils.find(u => u.name === "Knife"), 'utensil')}
              // Remove draggable attribute completely
              draggable={false} // Add this to prevent dragging
              onDragStart={(e) => e.preventDefault()} // Add this to block drag attempts
              onTouchStart={(e) => {
                e.stopPropagation();
                const knife = utensils.find(u => u.name === "Knife");
                if (knife) handleItemClick(knife, 'utensil');
              }}
            >
              <div className={`h-12 w-12 rounded overflow-hidden border ${
                workspace.utensil?.name === "Knife" ? 'border-green-500' : 'border-gray-200'
              }`}>
                <img 
                  src="/images/knife.png" 
                  alt="Knife" 
                  className="h-full w-full object-cover"
                  draggable={false} // Prevent image dragging
                />
              </div>
              <p className="text-xs text-center mt-0.5 truncate w-12">Knife</p>
            </div>
            
            {/* Fork - Click activation ONLY */}
            <div 
              className="flex-shrink-0 cursor-pointer"
              onClick={() => handleItemClick(utensils.find(u => u.name === "Fork"), 'utensil')}
              // Remove draggable attribute completely
              draggable={false} // Add this to prevent dragging
              onDragStart={(e) => e.preventDefault()} // Add this to block drag attempts
              onTouchStart={(e) => {
                e.stopPropagation();
                const fork = utensils.find(u => u.name === "Fork");
                if (fork) handleItemClick(fork, 'utensil');
              }}
            >
              <div className={`h-12 w-12 rounded overflow-hidden border ${
                workspace.utensil?.name === "Fork" ? 'border-green-500' : 'border-gray-200'
              }`}>
                <img 
                  src="/images/fork.png" 
                  alt="Fork" 
                  className="h-full w-full object-cover"
                  draggable={false} // Prevent image dragging
                />
              </div>
              <p className="text-xs text-center mt-0.5 truncate w-12">Fork</p>
            </div>
          </div>
        </div>
        
        {/* Suggestions section - similar modifications for touch events */}
      </div>
      
      {/* Updated "Add" button with improved positioning and higher z-index */}
      {onOpenInventory && (
        <button
          className="fixed right-4 bottom-24 bg-green-500 text-white p-3 rounded-full shadow-lg z-50"
          style={{ touchAction: 'manipulation' }} /* Improve touch behavior */
          onClick={(e) => {
            e.stopPropagation();
            console.log("Inventory button clicked");
            onOpenInventory();
          }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
        </button>
      )}
      
      {/* Render the dragged item preview */}
      {touchDragState && (
        <TouchDragPreview 
          item={touchDragState.item}
          x={touchDragState.currentX}
          y={touchDragState.currentY}
        />
      )}
    </div>
  );
}

export default QuickAccessBar;