import React from 'react'
import { useKitchenItems } from '../context/KitchenItemsContext'
import { useWorkspace } from '../context/WorkspaceContext'

interface UtensilCarouselProps {
  className?: string
}

function UtensilCarousel({ className }: UtensilCarouselProps) {
  const { utensils } = useKitchenItems();
  const { workspace, setUtensil } = useWorkspace();
  
  return (
    <div className={`p-2 overflow-x-auto ${className}`}>
      <h3 className="text-sm font-semibold text-gray-500 px-2 mb-1">Utensils</h3>
      <div className="flex space-x-4 px-2">
        {utensils.map(item => (
          <div 
            key={item.id}
            className="flex-shrink-0 w-20 cursor-pointer group"
            onClick={() => setUtensil(item)}
            draggable={false} // Change to false - no dragging
            onDragStart={(e) => e.preventDefault()} // Prevent drag
            onTouchStart={(e) => {
              e.stopPropagation();
              setUtensil(item); // Just set the utensil directly
            }}
          >
            <div className={`aspect-square rounded overflow-hidden mb-1 border-2 ${
              workspace.utensil?.id === item.id ? 'border-green-500' : 'border-transparent'
            }`}>
              <img 
                src={item.image} 
                alt={item.name}
                className="w-full h-full object-cover group-hover:opacity-90 transition-opacity"
                draggable={false}
              />
            </div>
            <p className="text-center text-sm truncate">{item.name}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

export default UtensilCarousel