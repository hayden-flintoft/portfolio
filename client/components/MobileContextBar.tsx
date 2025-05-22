// New file for mobile context bar
import React from 'react';
import { useWorkspace } from '../context/WorkspaceContext';

function MobileContextBar() {
  const { workspace } = useWorkspace();
  
  // Only render if we have active cookware
  if (!workspace.cookware) {
    return null;
  }
  
  return (
    <div className="fixed top-12 left-0 right-0 bg-white shadow-md p-2 z-20">
      <div className="flex items-center">
        <div className="h-10 w-10 mr-2 flex-shrink-0">
          <img
            src={workspace.cookware.image}
            alt={workspace.cookware.name}
            className="h-full w-full object-contain"
          />
        </div>
        <div className="flex-1 overflow-hidden">
          <p className="font-medium text-sm truncate">{workspace.cookware.name}</p>
          <p className="text-xs text-gray-500 truncate">
            {workspace.utensil 
              ? `Click on ingredients to use ${workspace.utensil.name}` 
              : workspace.ingredients.length > 0 
                ? `${workspace.ingredients.length} ingredient${workspace.ingredients.length > 1 ? 's' : ''}` 
                : 'No ingredients added'}
          </p>
        </div>
        {workspace.utensil && (
          <div className="flex items-center ml-auto flex-shrink-0">
            <div className="h-8 w-8 mr-1">
              <img
                src={workspace.utensil.image}
                alt={workspace.utensil.name}
                className="h-full w-full object-contain"
              />
            </div>
            <p className="text-xs">{workspace.utensil.name}</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default MobileContextBar;