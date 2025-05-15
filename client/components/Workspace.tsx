import React, { useState, useRef, useEffect } from 'react'

interface WorkspaceProps {
  workspace: {
    cookware: any
    utensil: any
    ingredients: any[]
  }
  updateWorkspace: (newWorkspace: any) => void
  onIngredientStateChange?: (originalIngredient: any, newState: string, newImage: string) => void
  className?: string
}

function Workspace({ workspace, updateWorkspace, onIngredientStateChange, className }: WorkspaceProps) {
  const [draggingId, setDraggingId] = useState<number | null>(null)
  const workspaceRef = useRef<HTMLDivElement>(null)
  const [cursorPosition, setCursorPosition] = useState({ x: 0, y: 0 })
  
  // Handle drag over for the workspace
  const handleDragOver = (e) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'copy'
  }
  
  // Handle drop for new items
  const handleDrop = (e) => {
    e.preventDefault();
    
    try {
      // Check what's being dropped
      const data = e.dataTransfer.getData('application/json');
      
      if (!data) {
        console.error('No data received in drop event');
        return;
      }
      
      const droppedItem = JSON.parse(data);
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      // If it's cookware, set it as the workspace cookware
      if (droppedItem.type === 'cookware') {
        updateWorkspace({
          ...workspace,
          cookware: droppedItem,
          ingredients: [] // Reset ingredients when changing cookware
        });
        return;
      }
      
      // If it's a utensil, set it as the active utensil
      if (droppedItem.type === 'utensil') {
        updateWorkspace({
          ...workspace,
          utensil: droppedItem
        });
        return;
      }
      
      // If it's an ingredient, add it to the workspace
      if (!workspace.cookware) {
        // Can't add an ingredient without cookware
        console.log('Please add a cookware first before adding ingredients');
        return;
      }
      
      // Check if the ingredient can be placed on this cookware
      const ingredientState = droppedItem.defaultState || 'whole';
      if (!workspace.cookware.acceptsStates.includes(ingredientState) && 
          !workspace.cookware.acceptsStates.includes('all')) {
        console.log(`This cookware doesn't accept ${ingredientState} ingredients`);
        return;
      }
      
      // Add the ingredient to the workspace
      updateWorkspace({
        ...workspace,
        ingredients: [
          ...workspace.ingredients,
          {
            ...droppedItem,
            instanceId: Date.now(),
            x,
            y,
            state: droppedItem.defaultState || 'whole'
          }
        ]
      });
    } catch (error) {
      console.error('Failed to parse dropped item:', error);
    }
  };
  
  // Check if an ingredient has been dragged outside the workspace
  const handleDragEnd = (e, instanceId) => {
    // If dragged outside the workspace boundaries, remove the ingredient
    if (workspaceRef.current) {
      const rect = workspaceRef.current.getBoundingClientRect();
      
      // Check if the cursor position is outside the workspace
      if (
        e.clientX < rect.left || 
        e.clientX > rect.right || 
        e.clientY < rect.top || 
        e.clientY > rect.bottom
      ) {
        // Remove the ingredient
        updateWorkspace({
          ...workspace,
          ingredients: workspace.ingredients.filter(item => item.instanceId !== instanceId)
        });
      } else {
        // Update the position
        updateWorkspace({
          ...workspace,
          ingredients: workspace.ingredients.map(item => 
            item.instanceId === instanceId 
              ? { 
                  ...item, 
                  x: e.clientX - rect.left, 
                  y: e.clientY - rect.top 
                } 
              : item
          )
        });
      }
    }
    
    setDraggingId(null);
  }
  
  // Start dragging an existing ingredient
  const handleIngredientDragStart = (e, instanceId) => {
    // Only allow dragging if no utensil is active
    if (workspace.utensil) return;
    
    setDraggingId(instanceId);
    e.dataTransfer.effectAllowed = 'move';
    
    // Create transparent drag image
    const img = new Image();
    img.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
    e.dataTransfer.setDragImage(img, 0, 0);
  }
  
  // Handle clicking on ingredients with a utensil
  const handleIngredientClick = (e, ingredient) => {
    // Only process if a utensil is active and we have cookware
    if (!workspace.utensil || !workspace.cookware) return;
    
    console.log(`Attempting action with ${workspace.utensil.name} on ${ingredient.name} (${ingredient.state}) in ${workspace.cookware.name}`);
    
    // Check if this utensil is compatible with the current cookware
    const isCompatible = workspace.utensil.compatibleWith.includes(
      workspace.cookware.name.toLowerCase().replace(/\s+/g, '_')
    );
    
    if (!isCompatible) {
      console.log(`This utensil can't be used with ${workspace.cookware.name}`);
      return;
    }
    
    // Get the current state of the ingredient
    const currentState = ingredient.state || 'whole';
    
    // Check what actions this utensil can perform
    const availableActions = workspace.utensil.actions;
    console.log(`Available actions: ${availableActions.join(', ')}`);
    console.log(`Current ingredient state: ${currentState}`);
    
    if (ingredient.allowedActions) {
      console.log('Allowed actions for this ingredient:', ingredient.allowedActions);
    }
    
    // Find an action that can be performed on this ingredient in its current state
    for (const action of availableActions) {
      // Check if the ingredient allows this action
      const actionRules = ingredient.allowedActions?.[action];
      
      if (!actionRules) {
        console.log(`No rules found for action: ${action}`);
        continue;
      }
      
      const canPerform = Array.isArray(actionRules.from) 
        ? actionRules.from.includes(currentState)
        : actionRules.from === currentState;
      
      console.log(`Can perform ${action}? ${canPerform}`);
      
      if (canPerform) {
        // Find the target state object
        const nextState = actionRules.to;
        const nextStateObj = ingredient.states.find(state => 
          typeof state === 'object' && state.name === nextState
        );
        
        console.log(`Next state: ${nextState}, Found state object: ${nextStateObj ? 'yes' : 'no'}`);
        
        if (nextStateObj) {
          console.log(`Changing state from ${currentState} to ${nextState}`);
          
          // Update the ingredient state
          updateWorkspace({
            ...workspace,
            ingredients: workspace.ingredients.map(item => 
              item.instanceId === ingredient.instanceId 
                ? { 
                    ...item, 
                    state: nextState,
                    image: nextStateObj.image
                  } 
                : item
            )
          });
          
          // Notify parent about the state change so it can add to ingredients list
          if (onIngredientStateChange) {
            onIngredientStateChange(ingredient, nextState, nextStateObj.image);
          }
          
          // Play a sound effect based on the action
          const soundMap = {
            'slice': 'knife-cutting.mp3',
            'dice': 'knife-chopping.mp3',
            'chop': 'knife-chopping.mp3',
            'mash': 'mashing.mp3',
            'mix': 'mixing.mp3'
          };
          
          const audio = new Audio(`/sounds/${soundMap[action] || 'action.mp3'}`);
          audio.play().catch(err => console.log('Audio playback failed', err));
          
          // Action performed, stop checking other actions
          break;
        }
      }
    }
  };

  // Handle workspace click to detect clicks on empty space
  const handleWorkspaceClick = (e) => {
    // Ignore clicks if no utensil is active
    if (!workspace.utensil) return;

    // Check if the click is on an ingredient
    const isClickOnIngredient = workspace.ingredients.some(ingredient => {
      // Get the DOM element for this ingredient if it exists
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

    // If click is not on an ingredient, remove the utensil
    if (!isClickOnIngredient) {
      updateWorkspace({
        ...workspace,
        utensil: null
      });
    }
  };

  // Track mouse movement to update cursor position
  const handleMouseMove = (e) => {
    if (!workspaceRef.current) return;
    
    const rect = workspaceRef.current.getBoundingClientRect();
    setCursorPosition({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
  };

  // Add this helper function to the Workspace component
  const getSizeForIngredient = (ingredient) => {
    if (!workspace.cookware) return 300; // Default size if no cookware
    
    const cookwareId = workspace.cookware.name.toLowerCase().replace(/\s+/g, '_');
    console.log('Looking for size with cookware ID:', cookwareId);
    
    // Check if the ingredient has a sizes object and if it has a size for this cookware
    if (ingredient.sizes && typeof ingredient.sizes === 'object') {
      console.log('Ingredient sizes:', ingredient.sizes);
      
      // For debugging, log all available sizes
      Object.entries(ingredient.sizes).forEach(([key, value]) => {
        console.log(`Available size ${key}: ${value}`);
      });
      
      if (ingredient.sizes[cookwareId] !== undefined) {
        // If we have a size for this cookware, use it
        // The size is a multiplier of the base size (300px)
        const sizeMultiplier = parseFloat(ingredient.sizes[cookwareId]);
        console.log(`Using size multiplier: ${sizeMultiplier} for ${cookwareId}`);
        return sizeMultiplier * 300; // Base size of 300px multiplied by the ratio
      }
    }
    
    // If no specific size is found, use the default size ratio
    console.log('Using default size ratio');
    return (ingredient.sizeRatio || 0.5) * 300;
  }

  // Add this helper function in your Workspace component
  const calculateIngredientSize = (ingredient) => {
    if (!workspace.cookware || !ingredient) return 200; // Default fallback size
    
    // Get the cookware ID by converting the name to lowercase and replacing spaces with underscores
    const cookwareId = workspace.cookware.name.toLowerCase().replace(/\s+/g, '_');
    
    // Get the workspace dimensions
    const workspaceWidth = workspaceRef.current?.clientWidth || 600;
    const workspaceHeight = workspaceRef.current?.clientHeight || 600;
    const minDimension = Math.min(workspaceWidth, workspaceHeight);
    
    // Base size - this is the maximum possible size (when size multiplier is 1)
    // Set this to a percentage of the workspace dimension
    const BASE_SIZE = minDimension * 0.65; // 65% of the smaller workspace dimension
    
    // Check if the ingredient has a size specified for this cookware
    const sizeMultiplier = ingredient.sizes && typeof ingredient.sizes === 'object' 
      ? (ingredient.sizes[cookwareId] || 0.5)  // Use the specific size or default to 0.5
      : (ingredient.sizeRatio || 0.5);        // Fall back to sizeRatio if sizes object doesn't exist
    
    console.log(`Calculated size for ${ingredient.name}: ${BASE_SIZE * sizeMultiplier}px`);
    console.log(`Using multiplier: ${sizeMultiplier} for ${cookwareId}`);
    
    return BASE_SIZE * sizeMultiplier;
  };

  // Completely refactored ingredient sizing to be consistent
  const getIngredientSize = (ingredient) => {
    if (!workspace.cookware || !ingredient) return 200; // Default fallback size
    
    // Get the cookware ID by converting the name to lowercase and replacing spaces with underscores
    const cookwareId = workspace.cookware.name.toLowerCase().replace(/\s+/g, '_');
    
    // Base size for all ingredients
    const BASE_SIZE = 300; // Fixed baseline size in pixels
    
    // Get the size multiplier for this cookware from the ingredient's sizes
    let sizeMultiplier = 0.5; // Default multiplier if none is specified
    
    if (ingredient.sizes && typeof ingredient.sizes === 'object' && 
        ingredient.sizes[cookwareId] !== undefined) {
      sizeMultiplier = Number(ingredient.sizes[cookwareId]);
    }
    
    // Calculate the final size
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
              style={{ opacity: 1 }}
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
              {/* Ingredient image sized based on the cookware */}
              <img
                src={item.image}
                alt={`${item.name} (${item.state})`}
                className="object-contain pointer-events-none"
                style={{ 
                  // Use consistent sizing based on the ingredient's config
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