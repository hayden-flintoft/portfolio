import React, { useState, useEffect } from 'react'
import { useIngredients } from '../context/IngredientsContext'
import { useKitchenItems } from '../context/KitchenItemsContext'
import { Tab } from './ui/Tab'
import { useWorkspace } from '../context/WorkspaceContext'
import { TouchDragManager, TouchDragPreview } from './TouchDragManager' // FIX: Use local component path

interface InventoryProps {
  className?: string;
  hideQuickAccess?: boolean; // New prop to control visibility
}

type InventoryTab = 'cookware' | 'ingredients' | 'utensils';

function Inventory({ className, hideQuickAccess = false }: InventoryProps) {
  const { ingredients } = useIngredients();
  const { cookware, utensils } = useKitchenItems();
  const { setCookware, setUtensil, workspace } = useWorkspace();
  const { startTouchDrag, touchDragState } = TouchDragManager(); // Use the touch drag functionality
  // Changed default tab to cookware
  const [activeTab, setActiveTab] = useState<InventoryTab>('cookware');
  const [searchTerm, setSearchTerm] = useState('')
  const [activeFilters, setActiveFilters] = useState<string[]>([])
  const [filteredItems, setFilteredItems] = useState<any[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  // Track recently used items
  const [recentlyUsed, setRecentlyUsed] = useState<any[]>([]);
  
  // Reset filters when changing tabs
  useEffect(() => {
    setSearchTerm('');
    setActiveFilters([]);
    setSelectedCategory('all');
    
    // Set initial filtered items based on active tab
    setFilteredItems(getCurrentItems());
  }, [activeTab]);

  // Get categories based on active tab
  const getCategories = () => {
    switch (activeTab) {
      case 'ingredients':
        return {
          all: 'All',
          fruit: 'Fruits',
          vegetable: 'Vegetables',
          condiment: 'Condiments',
          seasoning: 'Seasonings',
        };
      case 'cookware':
        return {
          all: 'All',
          prep: 'Prep',
          cooking: 'Cooking',
          baking: 'Baking',
        };
      case 'utensils':
        return {
          all: 'All',
          cutting: 'Cutting',
          mixing: 'Mixing',
          serving: 'Serving',
        };
      default:
        return { all: 'All' };
    }
  };
  
  const categories = getCategories();
  
  // Get current items based on active tab
  const getCurrentItems = () => {
    switch (activeTab) {
      case 'ingredients':
        return ingredients;
      case 'cookware':
        return cookware;
      case 'utensils':
        return utensils;
      default:
        return [];
    }
  };
  
  const currentItems = getCurrentItems();
  
  // All possible filter tags combined from all current items
  const allTags = [...new Set(currentItems.flatMap(item => item.tags ? item.tags : []))];
  
  // Filter items based on selected filters
  useEffect(() => {
    let filtered = currentItems;
    
    // Filter by category first
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(item => 
        item.tags?.includes(selectedCategory)
      );
    }
    
    // Apply search term filter
    if (searchTerm) {
      filtered = filtered.filter(item => 
        item.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Apply additional tag filters
    if (activeFilters.length > 0) {
      filtered = filtered.filter(item => 
        activeFilters.some(filter => item.tags?.includes(filter))
      );
    }
    
    // Sort the filtered items
    filtered = sortIngredients(filtered);
    
    setFilteredItems(filtered);
  }, [currentItems, searchTerm, activeFilters, selectedCategory, activeTab]);

  // Add this sorting function near the top of the component
  const sortIngredients = (items: any[]) => {
    return items.sort((a, b) => {
      // First sort by name
      if (a.name !== b.name) {
        return a.name.localeCompare(b.name);
      }
      
      // Then sort by state order if both items have the same name
      if (a.name === b.name && a.stateOrder && b.stateOrder) {
        const stateA = a.defaultState || 'whole';
        const stateB = b.defaultState || 'whole';
        const indexA = a.stateOrder.indexOf(stateA);
        const indexB = b.stateOrder.indexOf(stateB);
        return indexA - indexB;
      }
      
      return 0;
    });
  };

  const toggleFilter = (filter: string) => {
    setActiveFilters(prev => 
      prev.includes(filter) 
        ? prev.filter(f => f !== filter) 
        : [...prev, filter]
    );
  };
  
  // Handle drag start for any item type
  const handleDragStart = (e: React.DragEvent, item: any, itemType?: string) => {
    try {
      // Track usage when dragged
      trackUsage(item);
      
      // Determine item type if not explicitly provided
      const type = itemType || activeTab.slice(0, -1);
      
      // Create a proper drag object with the correct type property
      const dragData = {
        ...item,
        type: type,
        // Ensure state is included for processed ingredients
        state: item.defaultState || 'whole',
        allowedActions: item.allowedActions || {}
      };
      
      console.log('Setting drag data:', dragData);
      
      // Set the drag data
      e.dataTransfer.setData('application/json', JSON.stringify(dragData));
      e.dataTransfer.effectAllowed = 'copy';
    } catch (error) {
      console.error('Error in handleDragStart:', error);
    }
  };
  
  // Get tab title based on active tab
  const getTabTitle = () => {
    switch (activeTab) {
      case 'ingredients': return 'Ingredients';
      case 'cookware': return 'Cookware';
      case 'utensils': return 'Utensils';
      default: return '';
    }
  };

  // Add an item to recently used when clicked or dragged
  const trackUsage = (item: any) => {
    setRecentlyUsed(prev => {
      // Remove if already exists
      const filtered = prev.filter(i => i.id !== item.id);
      // Add to front (most recent)
      return [item, ...filtered].slice(0, 8); // Keep last 8 items
    });
  };
  
  // Updated item click handler
  const handleItemClick = (item: any, itemType?: string) => {
    // Track usage
    trackUsage(item);
    
    // Handle based on item type
    const type = itemType || activeTab;
    
    if (type === 'cookware' || item.type === 'cookware') {
      setCookware(workspace.cookware?.id === item.id ? null : item);
    } else if (type === 'utensils' || item.type === 'utensil') {
      setUtensil(workspace.utensil?.id === item.id ? null : item);
    }
  };

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Tabs - Reordered as requested */}
      <div className="flex bg-white border-b">
        <Tab 
          active={activeTab === 'cookware'} 
          onClick={() => setActiveTab('cookware')}
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
              <path d="M3 1a1 1 0 000 2h1.22l.305 1.222a.997.997 0 00.01.042l1.358 5.43-.893.892C3.74 11.846 4.632 14 6.414 14H15a1 1 0 000-2H6.414l1-1H14a1 1 0 00.894-.553l3-6A1 1 0 0017 3H6.28l-.31-1.243A1 1 0 005 1H3z" />
            </svg>
          }
          label="Cookware"
        />
        <Tab 
          active={activeTab === 'ingredients'} 
          onClick={() => setActiveTab('ingredients')}
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
              <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
              <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
            </svg>
          }
          label="Ingredients"
        />
        <Tab 
          active={activeTab === 'utensils'} 
          onClick={() => setActiveTab('utensils')}
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
              <path d="M3 1a1 1 0 000 2h1.22l.305 1.222a.997.997 0 00.01.042l1.358 5.43-.893.892C3.74 11.846 4.632 14 6.414 14H15a1 1 0 000-2H6.414l1-1H14a1 1 0 00.894-.553l3-6A1 1 0 0017 3H6.28l-.31-1.243A1 1 0 005 1H3z" />
            </svg>
          }
          label="Utensils"
        />
      </div>
      
      {/* Quick Access Bar - hide on mobile if specified */}
      {!hideQuickAccess && (
        <div className="bg-gray-50 p-2 border-b">
          <div className="flex items-center mb-1">
            <h3 className="text-sm font-medium text-gray-700">Quick Access</h3>
            <div className="ml-auto flex">
              <button className="text-xs text-gray-500 hover:text-gray-700 px-2 py-0.5 rounded">
                Essential Tools
              </button>
              <button className="text-xs text-gray-500 hover:text-gray-700 px-2 py-0.5 rounded ml-2">
                Recently Used
              </button>
            </div>
          </div>
          
          {/* Horizontal scrolling container */}
          <div className="flex overflow-x-auto pb-1 space-x-2">
            {/* Essential tools (always visible regardless of tab) */}
            <div 
              className="flex-shrink-0 cursor-pointer"
              onClick={() => handleItemClick(cookware.find(c => c.name === "Chopping Board"), 'cookware')}
              draggable="true"
              onDragStart={(e) => {
                const board = cookware.find(c => c.name === "Chopping Board");
                if (board) handleDragStart(e, board, 'cookware');
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
              <p className="text-xs text-center mt-1 truncate w-14">Board</p>
            </div>
            
            <div 
              className="flex-shrink-0 cursor-pointer"
              onClick={() => handleItemClick(cookware.find(c => c.name === "Bowl"), 'cookware')}
              draggable="true"
              onDragStart={(e) => {
                const bowl = cookware.find(c => c.name === "Bowl");
                if (bowl) handleDragStart(e, bowl, 'cookware');
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
              <p className="text-xs text-center mt-1 truncate w-14">Bowl</p>
            </div>
            
            <div 
              className="flex-shrink-0 cursor-pointer"
              onClick={() => handleItemClick(utensils.find(u => u.name === "Knife"), 'utensils')}
              draggable="true"
              onDragStart={(e) => {
                const knife = utensils.find(u => u.name === "Knife");
                if (knife) handleDragStart(e, knife, 'utensil');
              }}
            >
              <div className={`h-12 w-12 rounded overflow-hidden border ${
                workspace.utensil?.name === "Knife" ? 'border-green-500' : 'border-gray-200'
              }`}>
                <img 
                  src="/images/knife.png" 
                  alt="Knife" 
                  className="h-full w-full object-cover"
                />
              </div>
              <p className="text-xs text-center mt-1 truncate w-14">Knife</p>
            </div>
            
            <div 
              className="flex-shrink-0 cursor-pointer"
              onClick={() => handleItemClick(utensils.find(u => u.name === "Fork"), 'utensils')}
              draggable="true"
              onDragStart={(e) => {
                const fork = utensils.find(u => u.name === "Fork");
                if (fork) handleDragStart(e, fork, 'utensil');
              }}
            >
              <div className={`h-12 w-12 rounded overflow-hidden border ${
                workspace.utensil?.name === "Fork" ? 'border-green-500' : 'border-gray-200'
              }`}>
                <img 
                  src="/images/fork.png" 
                  alt="Fork" 
                  className="h-full w-full object-cover"
                />
              </div>
              <p className="text-xs text-center mt-1 truncate w-14">Fork</p>
            </div>
            
            {/* Recently used items */}
            {recentlyUsed.map((item) => (
              <div
                key={`recent-${item.id}-${item.defaultState || 'default'}-${Date.now()}`}
                className="flex-shrink-0"
              >
                <div className={`h-12 w-12 rounded overflow-hidden border ${
                  (item.type === 'cookware' && workspace.cookware?.id === item.id) ||
                  (item.type === 'utensil' && workspace.utensil?.id === item.id)
                    ? 'border-green-500' : 'border-gray-200'
                }`}>
                  <img 
                    src={item.image} 
                    alt={item.name} 
                    className="h-full w-full object-cover"
                  />
                </div>
                <p className="text-xs text-center mt-1 truncate w-14">{item.name}</p>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Context-aware suggestions based on workspace state */}
      {!hideQuickAccess && workspace.cookware && (
        <div className="bg-gray-50 p-2 border-b">
          <h3 className="text-sm font-medium text-gray-700 mb-1">
            Suggested for {workspace.cookware.name}
          </h3>
          <div className="flex overflow-x-auto pb-1 space-x-2">
            {/* Show utensils compatible with current cookware */}
            {utensils
              .filter(u => u.compatibleWith?.includes(workspace.cookware?.name.toLowerCase().replace(/\s+/g, '_')))
              .map(utensil => (
                <div 
                  key={`suggest-${utensil.id}`}
                  className="flex-shrink-0 cursor-pointer"
                  onClick={() => handleItemClick(utensil, 'utensils')}
                  draggable="true"
                  onDragStart={(e) => handleDragStart(e, utensil, 'utensil')}
                >
                  <div className={`h-12 w-12 rounded overflow-hidden border ${
                    workspace.utensil?.id === utensil.id ? 'border-green-500' : 'border-gray-200'
                  }`}>
                    <img 
                      src={utensil.image} 
                      alt={utensil.name} 
                      className="h-full w-full object-cover"
                      draggable={false}
                    />
                  </div>
                  <p className="text-xs text-center mt-1 truncate w-14">{utensil.name}</p>
                </div>
              ))
            }
            
            {/* Show compatible ingredients */}
            {ingredients
              .filter(i => {
                const state = i.defaultState || 'whole';
                return workspace.cookware?.acceptsStates.includes(state) || 
                       workspace.cookware?.acceptsStates.includes('all');
              })
              .slice(0, 4) // Just show a few
              .map(ingredient => (
                <div 
                  key={`suggest-${ingredient.id}-${ingredient.defaultState || 'default'}`}
                  className="flex-shrink-0 cursor-pointer"
                  onClick={() => handleItemClick(ingredient, 'ingredients')}
                  draggable="true"
                  onDragStart={(e) => handleDragStart(e, ingredient, 'ingredient')}
                >
                  <div className="h-12 w-12 rounded overflow-hidden border border-gray-200">
                    <img 
                      src={ingredient.image} 
                      alt={ingredient.name} 
                      className="h-full w-full object-cover"
                      draggable={false}
                    />
                  </div>
                  <p className="text-xs text-center mt-1 truncate w-14">
                    {ingredient.name}
                    {ingredient.states?.find(s => s.name === ingredient.defaultState)?.label && (
                      <span className="text-gray-500 ml-1">
                        ({ingredient.states.find(s => s.name === ingredient.defaultState)?.label})
                      </span>
                    )}
                  </p>
                </div>
              ))
            }
          </div>
        </div>
      )}
      
      <div className="p-4 border-b">
        <h2 className="text-xl font-bold mb-4">{getTabTitle()}</h2>
        
        {/* Search bar */}
        <div className="mb-4">
          <input
            type="text"
            placeholder={`Search ${activeTab}...`}
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
        
        {/* Filter tags - only show for ingredients */}
        {activeTab === 'ingredients' && allTags.length > 0 && (
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
        )}
      </div>
      
      {/* Items grid */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {filteredItems.map((item) => {
            // Find the state object for the current item
            const currentState = item.states?.find(
              (s: any) => s.name === (item.defaultState || 'whole')
            );
            
            return (
              <div
                key={`${item.id}-${item.defaultState || 'default'}`}
                className="border rounded bg-white shadow-sm p-2 cursor-pointer hover:shadow-md transition-shadow relative"
                draggable="true"
                onDragStart={(e) => handleDragStart(e, item)}
                onClick={() => handleItemClick(item)}
              >
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-full h-24 object-contain mb-2"
                  draggable={false}
                />
                <p className="text-sm font-medium text-center truncate">
                  {item.name}
                  {currentState && (
                    <span className="text-gray-500 ml-1">
                      ({currentState.label || currentState.name})
                    </span>
                  )}
                </p>
              </div>
            );
          })}
          
          {filteredItems.length === 0 && (
            <div className="col-span-full text-center py-8 text-gray-500">
              No {activeTab} match your search/filters
            </div>
          )}
        </div>
      </div>
      
      {/* Drag and drop instructions */}
      <div className="p-3 bg-gray-50 border-t text-center text-sm text-gray-500">
        Drag items to the workspace
      </div>
    </div>
  )
}

export default Inventory