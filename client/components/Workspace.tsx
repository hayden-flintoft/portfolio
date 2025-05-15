import React, { useState, useRef } from 'react'
import { useWorkspace } from '../context/WorkspaceContext'
import { useIngredients } from '../context/IngredientsContext'

interface WorkspaceProps {
  className?: string
}

function Workspace({ className }: WorkspaceProps) {
  const { workspace, addIngredient, updateIngredientState, removeIngredient, setUtensil } = useWorkspace();
  const { addProcessedIngredient } = useIngredients();
  const [draggingId, setDraggingId] = useState<number | null>(null);
  const workspaceRef = useRef<HTMLDivElement>(null);
  const [cursorPosition, setCursorPosition] = useState({ x: 0, y: 0 });
  
  // Handle drag over for the workspace
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  };
  
  // Handle drop for new items
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    
    try {
      const data = e.dataTransfer.getData('application/json');
      
      if (!data) {
        console.error('No data received in drop event');
        return;
      }
      
      const droppedItem = JSON.parse(data);
      const rect = workspaceRef.current!.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      // If no type, assume it's an ingredient
      if (!droppedItem.type) {
        if (!workspace.cookware) {
          console.log('Please add a cookware first');
          return;
        }
        
        // Check if the cookware accepts this ingredient state
        const ingredientState = droppedItem.defaultState || 'whole';
        if (!workspace.cookware.acceptsStates.includes(ingredientState) && 
            !workspace.cookware.acceptsStates.includes('all')) {
          console.log(`This cookware doesn't accept ${ingredientState} ingredients`);
          return;
        }
        
        // Add the ingredient to the workspace
        addIngredient(droppedItem, x, y);
      }
    } catch (error) {
      console.error('Failed to parse dropped item:', error);
    }
  };
  
  // Handle ingredient drag end
  const handleDragEnd = (e: React.DragEvent, instanceId: number) => {
    if (workspaceRef.current) {
      const rect = workspaceRef.current.getBoundingClientRect();
      
      // Remove if dragged outside workspace
      if (
        e.clientX < rect.left || 
        e.clientX > rect.right || 
        e.clientY < rect.top || 
        e.clientY > rect.bottom
      ) {
        removeIngredient(instanceId);
      }
    }
    
    setDraggingId(null);
  };
  
  // Start ingredient drag
  const handleIngredientDragStart = (e: React.DragEvent, instanceId: number) => {
    if (workspace.utensil) return;
    
    setDraggingId(instanceId);
    e.dataTransfer.effectAllowed = 'move';
    
    // Create transparent drag image
    const img = new Image();
    img.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
    e.dataTransfer.setDragImage(img, 0, 0);
  };
  
  // Handle ingredient click with utensil
  const handleIngredientClick = (e: React.MouseEvent, ingredient: any) => {
    if (!workspace.utensil || !workspace.cookware) return;
    
    // Check compatibility
    const isCompatible = workspace.utensil.compatibleWith.includes(
      workspace.cookware.name.toLowerCase().replace(/\s+/g, '_')
    );
    
    if (!isCompatible) {
      console.log(`This utensil can't be used with ${workspace.cookware.name}`);
      return;
    }
    
    // Find applicable action
    const currentState = ingredient.state || 'whole';
    const availableActions = workspace.utensil.actions;
    
    for (const action of availableActions) {
      const actionRules = ingredient.allowedActions?.[action];
      
      if (!actionRules) continue;
      
      const canPerform = Array.isArray(actionRules.from) 
        ? actionRules.from.includes(currentState)
        : actionRules.from === currentState;
      
      if (canPerform) {
        const nextState = actionRules.to;
        const nextStateObj = ingredient.states.find((state: any) => 
          typeof state === 'object' && state.name === nextState
        );
        
        if (nextStateObj) {
          // Update state in workspace
          updateIngredientState(
            ingredient.instanceId, 
            nextState,
            nextStateObj.image
          );
          
          // Add processed ingredient to inventory
          const processedIngredient = {
            ...ingredient,
            id: Date.now(), // New ID for processed item
            defaultState: nextState,
            image: nextStateObj.image
          };
          
          addProcessedIngredient(processedIngredient);
          
          // Play sound effect
          const soundMap: Record<string, string> = {
            'slice': 'knife-cutting.mp3',
            'dice': 'knife-chopping.mp3',
            'chop': 'knife-chopping.mp3',
            'mash': 'mashing.mp3',
            'mix': 'mixing.mp3'
          };
          
          const audio = new Audio(`/sounds/${soundMap[action] || 'action.mp3'}`);
          audio.play().catch(err => console.log('Audio playback failed', err));
          break;
        }
      }
    }
  };

  // Track cursor position
  const handleMouseMove = (e: React.MouseEvent) => {
    if (workspaceRef.current) {
      const rect = workspaceRef.current.getBoundingClientRect();
      setCursorPosition({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      });
    }
  };

  // Handle workspace background click
  const handleWorkspaceClick = (e: React.MouseEvent) => {
    // Only process if a utensil is active
    if (!workspace.utensil) return;

    // Check if click is on an ingredient
    const isClickOnIngredient = workspace.ingredients.some(ingredient => {
      const ingredientEls = document.querySelectorAll(`[data-instance-id="${ingredient.instanceId}"]`);
      if (ingredientEls.length === 0) return false;
      
      const ingredientEl = ingredientEls[0];
      const rect = ingredientEl.getBoundingClientRect();
      
      return (
        e.clientX >= rect.left &&
        e.clientX <= rect.right &&
        e.clientY >= rect.top &&
        e.clientY <= rect.bottom
      );
    });

    // If click is not on an ingredient, deactivate utensil
    if (!isClickOnIngredient) {
      setUtensil(null);
    }
  };

  // Calculate ingredient size based on cookware
  const getIngredientSize = (ingredient: any) => {
    if (!workspace.cookware || !ingredient) return 200;
    
    const cookwareId = workspace.cookware.name.toLowerCase().replace(/\s+/g, '_');
    const BASE_SIZE = 300;
    
    let sizeMultiplier = 0.5;
    
    if (ingredient.sizes && typeof ingredient.sizes === 'object' && 
        ingredient.sizes[cookwareId] !== undefined) {
      sizeMultiplier = Number(ingredient.sizes[cookwareId]);
    }
    
    return BASE_SIZE * sizeMultiplier;
  };

  return (
    <div 
      ref={workspaceRef}
      className={`relative ${className}`}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onClick={handleWorkspaceClick}
      onMouseMove={handleMouseMove}
    >
      {!workspace.cookware ? (
        <div className="flex items-center justify-center h-full">
          <p className="text-gray-500 text-center">
            Select or drag a cookware item from below to get started
          </p>
        </div>
      ) : (
        <>
          {/* Cookware background */}
          <div className="w-full h-full flex items-center justify-center p-4">
            <img
              src={workspace.cookware.image}
              alt={workspace.cookware.name}
              className="object-contain max-w-full max-h-full"
            />
          </div>
          
          {/* Ingredients on the cookware */}
          {workspace.ingredients.map(item => (
            <div
              key={item.instanceId}
              data-instance-id={item.instanceId}
              className="absolute transform -translate-x-1/2 -translate-y-1/2"
              style={{
                left: `${item.x}px`,
                top: `${item.y}px`,
                zIndex: draggingId === item.instanceId ? 30 : 20,
                opacity: draggingId === item.instanceId ? 0.8 : 1,
                cursor: workspace.utensil ? 'pointer' : 'grab'
              }}
              draggable={!workspace.utensil}
              onDragStart={(e) => !workspace.utensil && handleIngredientDragStart(e, item.instanceId)}
              onDragEnd={(e) => !workspace.utensil && handleDragEnd(e, item.instanceId)}
              onClick={(e) => handleIngredientClick(e, item)}
            >
              <img
                src={item.image}
                alt={`${item.name} (${item.state})`}
                className="object-contain pointer-events-none"
                style={{ 
                  height: `${getIngredientSize(item)}px`,
                  filter: 'drop-shadow(0 3px 6px rgba(0,0,0,0.2))'
                }}
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = `https://placehold.co/400x400/gray/white?text=${encodeURIComponent(item.name)}`;
                }}
              />
            </div>
          ))}
          
          {/* Active utensil following cursor */}
          {workspace.utensil && (
            <div 
              className="absolute pointer-events-none z-40"
              style={{
                left: cursorPosition.x,
                top: cursorPosition.y,
                transform: 'translate(-50%, -50%)'
              }}
            >
              <img 
                src={workspace.utensil.image}
                alt={workspace.utensil.name}
                className="w-16 h-16 object-contain"
                style={{ 
                  filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))',
                  opacity: 0.9
                }}
              />
            </div>
          )}
          
          {/* Info display */}
          <div className="absolute bottom-4 left-0 w-full text-center">
            <h3 className="text-lg font-semibold bg-white bg-opacity-70 mx-auto py-1 px-3 rounded inline-block">
              {workspace.cookware.name}
              {workspace.utensil && (
                <span className="ml-2 text-red-500">
                  (Using {workspace.utensil.name} - Click on ingredients)
                </span>
              )}
            </h3>
          </div>
        </>
      )}
    </div>
  )
}

export default Workspace