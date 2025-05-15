import React, { useState, useEffect } from 'react'
import { useIngredients } from '../context/IngredientsContext'

interface InventoryProps {
  className?: string
}

function Inventory({ className }: InventoryProps) {
  const { ingredients } = useIngredients();
  const [searchTerm, setSearchTerm] = useState('')
  const [activeFilters, setActiveFilters] = useState<string[]>([])
  const [filteredIngredients, setFilteredIngredients] = useState(ingredients)
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  
  // Group ingredients by category for easier navigation
  const categories = {
    all: 'All',
    fruit: 'Fruits',
    vegetable: 'Vegetables',
    condiment: 'Condiments',
    seasoning: 'Seasonings',
  }
  
  // All possible filter tags combined from all ingredients
  const allTags = [...new Set(ingredients.flatMap(item => item.tags || []))]
  
  useEffect(() => {
    let filtered = ingredients
    
    // Filter by category first
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(item => 
        item.tags?.includes(selectedCategory)
      )
    }
    
    // Apply search term filter
    if (searchTerm) {
      filtered = filtered.filter(item => 
        item.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }
    
    // Apply additional tag filters
    if (activeFilters.length > 0) {
      filtered = filtered.filter(item => 
        activeFilters.some(filter => item.tags?.includes(filter))
      )
    }
    
    setFilteredIngredients(filtered)
  }, [ingredients, searchTerm, activeFilters, selectedCategory])

  const toggleFilter = (filter: string) => {
    setActiveFilters(prev => 
      prev.includes(filter) 
        ? prev.filter(f => f !== filter) 
        : [...prev, filter]
    )
  }
  
  const handleDragStart = (e: React.DragEvent, ingredient: any) => {
    // Make sure we send ALL data including the sizes property
    e.dataTransfer.setData('application/json', JSON.stringify(ingredient));
    e.dataTransfer.effectAllowed = 'copy';
    
    // Create a properly sized drag preview image
    if (ingredient.image) {
      const img = new Image();
      img.src = ingredient.image;
      
      // Create an offscreen canvas to resize the image
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      // Set a fixed size for drag preview (80x80px)
      canvas.width = 80;
      canvas.height = 80;
      
      // When the image loads, draw it to the canvas
      img.onload = () => {
        if (ctx) {
          ctx.drawImage(img, 0, 0, img.width, img.height, 0, 0, 80, 80);
          
          // Create a new image from the canvas
          const resizedImg = new Image();
          resizedImg.src = canvas.toDataURL();
          
          // Set the drag image when it's ready
          resizedImg.onload = () => {
            e.dataTransfer.setDragImage(resizedImg, 40, 40);
          };
        }
      };
      
      // In case the image fails to load, fallback to default behavior
      img.onerror = () => {
        const defaultImg = new Image();
        defaultImg.src = `https://placehold.co/80x80/gray/white?text=${encodeURIComponent(ingredient.name.substring(0, 2))}`;
        e.dataTransfer.setDragImage(defaultImg, 40, 40);
      };
    }
  }

  return (
    <div className={`flex flex-col h-full ${className}`}>
      <div className="p-4 border-b">
        <h2 className="text-xl font-bold mb-4">Ingredients</h2>
        
        {/* Search bar */}
        <div className="mb-4">
          <input
            type="text"
            placeholder="Search ingredients..."
            className="w-full p-2 border rounded"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        {/* Category tabs */}
        <div className="flex overflow-x-auto space-x-2 mb-4 pb-1">
          {Object.entries(categories).map(([key, label]) => (
            <button
              key={key}
              className={`px-3 py-1 text-sm whitespace-nowrap rounded-md ${
                selectedCategory === key
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 hover:bg-gray-200'
              }`}
              onClick={() => setSelectedCategory(key)}
            >
              {label}
            </button>
          ))}
        </div>
        
        {/* Filter tags */}
        <div className="mb-4 flex flex-wrap gap-2">
          {allTags
            .filter(tag => !Object.keys(categories).includes(tag))
            .map(tag => (
              <button
                key={String(tag)}
                className={`px-2 py-1 text-sm rounded-full ${
                  activeFilters.includes(tag)
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-200 text-gray-800'
                }`}
                onClick={() => toggleFilter(tag)}
              >
                {String(tag)}
              </button>
            ))}
        </div>
      </div>
      
      {/* Ingredients grid */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {filteredIngredients.map(ingredient => (
            <div
              key={ingredient.id}
              className="border rounded bg-white shadow-sm p-2 cursor-grab hover:shadow-md transition-shadow"
              draggable="true"
              onDragStart={(e) => handleDragStart(e, ingredient)}
            >
              <div className="aspect-square mb-2 overflow-hidden rounded bg-gray-100">
                <img
                  src={ingredient.image}
                  alt={ingredient.name}
                  className="w-full h-full object-cover"
                  loading="lazy"
                  onError={(e) => {
                    console.error(`Failed to load image: ${ingredient.image}`);
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = `https://placehold.co/200x200/gray/white?text=${encodeURIComponent(ingredient.name)}`;
                  }}
                />
              </div>
              <div className="text-center">
                <p className="font-medium">{ingredient.name}</p>
                {ingredient.states && (
                  <p className="text-xs text-gray-500 mt-1">
                    {Array.isArray(ingredient.states) 
                      ? (typeof ingredient.states[0] === 'string' 
                          ? ingredient.states.join(', ')
                          : ingredient.states.map(s => s.name).join(', '))
                      : ''}
                  </p>
                )}
              </div>
            </div>
          ))}
          
          {filteredIngredients.length === 0 && (
            <div className="col-span-full text-center py-8 text-gray-500">
              No ingredients match your search/filters
            </div>
          )}
        </div>
      </div>
      
      {/* Drag and drop instructions */}
      <div className="p-3 bg-gray-50 border-t text-center text-sm text-gray-500">
        Drag ingredients to the workspace
      </div>
    </div>
  )
}

export default Inventory