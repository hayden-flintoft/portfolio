import React from 'react'
import { useKitchenItems } from '../context/KitchenItemsContext'
import { useWorkspace } from '../context/WorkspaceContext'

interface CookwareCarouselProps {
  className?: string
}

function CookwareCarousel({ className }: CookwareCarouselProps) {
  const { cookware } = useKitchenItems();
  const { workspace, setCookware } = useWorkspace();
  
  return (
    <div className={`p-2 overflow-x-auto ${className}`}>
      <h3 className="text-sm font-semibold text-gray-500 px-2 mb-1">Cookware</h3>
      <div className="flex space-x-4 px-2">
        {cookware.map(item => (
          <div 
            key={item.id}
            className="flex-shrink-0 w-20 cursor-pointer group"
            onClick={() => setCookware(workspace.cookware?.id === item.id ? null : item)}
          >
            <div className={`aspect-square rounded overflow-hidden mb-1 border-2 ${
              workspace.cookware?.id === item.id ? 'border-green-500' : 'border-transparent'
            }`}>
              <img 
                src={item.image} 
                alt={item.name}
                className="w-full h-full object-cover group-hover:opacity-90 transition-opacity"
                onError={(e) => {
                  console.error(`Failed to load image: ${item.image}`);
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = `https://placehold.co/200x200/gray/white?text=${encodeURIComponent(item.name)}`;
                }}
              />
            </div>
            <p className="text-center text-sm truncate">{item.name}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

export default CookwareCarousel