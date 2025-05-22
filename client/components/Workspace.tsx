import React, { useState, useRef, useEffect } from 'react'
import { useWorkspace } from '../context/WorkspaceContext'
import { useIngredients } from '../context/IngredientsContext'

interface WorkspaceProps {
  className?: string
}

function Workspace({ className }: WorkspaceProps) {
  const { workspace, addIngredient, updateIngredientState, removeIngredient, setUtensil, setCookware } = useWorkspace();
  const { addProcessedIngredient } = useIngredients();
  const [draggingId, setDraggingId] = useState<number | null>(null);
  const workspaceRef = useRef<HTMLDivElement>(null);
  const [cursorPosition, setCursorPosition] = useState({ x: 0, y: 0 });
  const [workspaceSize, setWorkspaceSize] = useState({ width: 0, height: 0 });
  
  // Track workspace size
  useEffect(() => {
    if (workspaceRef.current) {
      const updateSize = () => {
        setWorkspaceSize({
          width: workspaceRef.current!.clientWidth,
          height: workspaceRef.current!.clientHeight
        });
      };
      
      updateSize();
      window.addEventListener('resize', updateSize);
      return () => window.removeEventListener('resize', updateSize);
    }
  }, []);
  
  // Handle drag over for the workspace
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  };
  
  // Get positioning based on cookware settings and workspace size
  const getIngredientPosition = (x: number, y: number) => {
    if (!workspace.cookware) {
      return { x, y };
    }
    
    // If cookware centers ingredients, use the center of workspace
    if (workspace.cookware.centersIngredients) {
      return {
        x: workspaceSize.width / 2,
        y: workspaceSize.height / 2
      };
    }
        
    // Default: return the original coordinates
    return { x, y };
  };
  
  // Handle drop for new items - FIXED to handle all item types
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    
    try {
      const data = e.dataTransfer.getData('application/json');
      
      if (!data) {
        console.warn('No data received in drop event');
        return;
      }
      
      const droppedItem = JSON.parse(data);
      console.log('Drop event received with data:', droppedItem);

      // For cookware, be more explicit:
      if (droppedItem.type === 'cookware') {
        console.log('Setting cookware:', droppedItem);
        setCookware(droppedItem);
        return;
      }
      
      const rect = workspaceRef.current!.getBoundingClientRect();
      
      // Get raw drop coordinates
      const rawX = e.clientX - rect.left;
      const rawY = e.clientY - rect.top;
      
      console.log('Dropped item:', droppedItem);
      
      // Handle utensil items
      if (droppedItem.type === 'utensil') {
        setUtensil(droppedItem);
        return;
      }
      
      // Otherwise assume it's an ingredient
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
      
      // If cookware requires clearing before adding new ingredients
      if (workspace.cookware.clearBeforeAdd) {
        // Save existing ingredients to processed list
        workspace.ingredients.forEach(ingredient => {
          addProcessedIngredient(ingredient);
        });
        
        // Clear the workspace ingredients
        workspace.ingredients = [];
      }
      
      // Get the position based on cookware settings
      const { x, y } = getIngredientPosition(rawX, rawY);
      
      // Add the ingredient to the workspace
      addIngredient(droppedItem, x, y);
    } catch (error) {
      console.error('Failed to parse dropped item:', error);
      console.error('Raw data:', e.dataTransfer.getData('application/json'));
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
    img.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'; // TODO: remove encoded image
    e.dataTransfer.setDragImage(img, 0, 0);
  };
  
  // Update the handleIngredientClick function
  const handleIngredientClick = (e: React.MouseEvent, ingredient: any) => {
    if (!workspace.cookware) return;

    console.log('Ingredient clicked:', ingredient);
    console.log('Current utensil:', workspace.utensil);
    console.log('Current cookware:', workspace.cookware);

    // Special case for juicing lime in bowl using hands (no utensil)
    if (
      ingredient.name === 'Lime' && 
      ingredient.state === 'sliced' && 
      workspace.cookware.name === 'Bowl' &&
      !workspace.utensil // Only when using hands (no utensil)
    ) {
      console.log('Juicing lime in bowl with hands');
      updateIngredientState(
        ingredient.instanceId,
        'juiced',
        '/images/lime_juiced.png'
      );
      return;
    }

    // If no utensil selected, use hands
    if (!workspace.utensil) return;

    // Rest of existing click handler...
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

    console.log('Current state:', currentState);
    console.log('Available actions:', availableActions);

    for (const action of availableActions) {
      const actionRules = ingredient.allowedActions?.[action];

      if (!actionRules) continue;

      const canPerform = Array.isArray(actionRules.from)
        ? actionRules.from.includes(currentState)
        : actionRules.from === currentState;

      console.log(`Checking action: ${action}`, { canPerform, actionRules });

      if (canPerform) {
        const nextState = actionRules.to;

        console.log(`Performing action: ${action}, transitioning to state: ${nextState}`);

        // Update state in workspace
        updateIngredientState(
          ingredient.instanceId,
          nextState,
          `/images/${ingredient.name.toLowerCase()}_${nextState}.png`
        );
        break;
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

  // Add this to your Workspace component
  const handleTouchStart = (e: React.TouchEvent, ingredient: any) => {
    // Skip if utensil is active - we want to use click instead
    if (workspace.utensil) return;
    
    // Otherwise handle touch like a click for non-drag operations
    handleIngredientClick(e as unknown as React.MouseEvent, ingredient);
  };

  return (
    <div 
      ref={workspaceRef}
      className={`relative workspace-container ${className}`} // Add this class
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
          {workspace.ingredients.map((item) => (
            <div
              key={item.instanceId}
              data-instance-id={item.instanceId}
              className="absolute transform -translate-x-1/2 -translate-y-1/2"
              style={{
                left: `${item.x}px`,
                top: `${item.y}px`,
                zIndex: 20,
                cursor: workspace.utensil ? 'pointer' : 'grab', // Show pointer cursor when utensil is active
                touchAction: workspace.utensil ? 'auto' : 'none' // Only use drag behavior when no utensil
              }}
              draggable={!workspace.utensil} // Only draggable when no utensil is active
              onDragStart={(e) => !workspace.utensil && handleIngredientDragStart(e, item.instanceId)}
              onClick={(e) => handleIngredientClick(e, item)} // Always handle clicks for utensil actions
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
              <span className="ml-2 text-gray-500">
                (Using {workspace.utensil ? workspace.utensil.name : 'Hands'})
              </span>
            </h3>
          </div>
        </>
      )}
    </div>
  );
}

export default Workspace;