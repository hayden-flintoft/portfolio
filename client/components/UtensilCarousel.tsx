import React from 'react'

interface Utensil {
  id: number
  name: string
  image: string
  description: string
}

interface UtensilCarouselProps {
  utensils: Utensil[]
  setActiveUtensil: (utensil: Utensil | null) => void
  activeUtensil: Utensil | null
  className?: string
}

function UtensilCarousel({ utensils, setActiveUtensil, activeUtensil, className }: UtensilCarouselProps) {
  return (
    <div className={`p-2 overflow-x-auto ${className}`}>
      <h3 className="text-sm font-semibold text-gray-500 px-2 mb-1">Utensils</h3>
      <div className="flex space-x-4 px-2">
        {utensils.map(item => (
          <div 
            key={item.id}
            className="flex-shrink-0 w-20 cursor-pointer group"
            onClick={() => setActiveUtensil(activeUtensil?.id === item.id ? null : item)}
            draggable="true"
            onDragStart={(e) => {
              e.dataTransfer.setData('application/json', JSON.stringify({
                type: 'utensil',
                ...item
              }));
              e.dataTransfer.effectAllowed = 'copy';
            }}
          >
            <div className={`aspect-square rounded overflow-hidden mb-1 border-2 ${
              activeUtensil?.id === item.id ? 'border-green-500' : 'border-transparent'
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

export default UtensilCarousel