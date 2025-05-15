import React, { useState, useEffect } from 'react'
import Header from './Header'
import Footer from './Footer'
import Inventory from './Inventory'
import CookwareCarousel from './CookwareCarousel'
import UtensilCarousel from './UtensilCarousel'
import Workspace from './Workspace'
import { fetchIngredients } from '../api/ingredients'
import { fetchCookware } from '../api/cookware'
import { fetchUtensils } from '../api/utensils'

// Define our interfaces
interface Cookware {
  id: number
  name: string
  image: string
  description: string
  type: 'cookware'
  acceptsStates: string[]
  compatibleUtensils: string[]
  allowedActions: string[]
}

interface Utensil {
  id: number
  name: string
  image: string
  description: string
  type: 'utensil'
  actions: string[]
  compatibleWith: string[]
}

interface Ingredient {
  id: number
  name: string
  image: string
  tags: string[]
  sizes: Record<string, number>
  states: Array<{name: string, image: string}>
  defaultState: string
  allowedActions: Record<string, {from: string | string[], to: string}>
}

interface WorkspaceState {
  cookware: Cookware | null
  utensil: Utensil | null
  ingredients: IngredientInstance[]
}

interface IngredientInstance {
  id: number
  instanceId: number
  name: string
  image: string
  state: string
  x: number
  y: number
  [key: string]: any
}

function App() {
  const [ingredients, setIngredients] = useState<Ingredient[]>([])
  const [cookware, setCookware] = useState<Cookware[]>([])
  const [utensils, setUtensils] = useState<Utensil[]>([])
  const [workspace, setWorkspace] = useState<WorkspaceState>({
    cookware: null,
    utensil: null,
    ingredients: []
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      try {
        // Load data from separate endpoints
        const [ingredientsData, cookwareData, utensilsData] = await Promise.all([
          fetchIngredients(),
          fetchCookware(),
          fetchUtensils()
        ])
        
        console.log('Loaded ingredients:', ingredientsData);
        console.log('Loaded cookware:', cookwareData);
        console.log('Loaded utensils:', utensilsData);
        
        setIngredients(ingredientsData)
        setCookware(cookwareData)
        setUtensils(utensilsData)
        setLoading(false)
      } catch (error) {
        console.error('Failed to load data:', error)
        setLoading(false)
      }
    }
    
    loadData()
  }, [])

  const setCookwareInWorkspace = (selected: Cookware | null) => {
    // If there's already cookware in the workspace, replace it
    // This will also clear any ingredients in the workspace
    setWorkspace(prev => ({
      ...prev,
      cookware: selected,
      ingredients: [] // Clear ingredients when changing cookware
    }))
  }

  const setUtensilInWorkspace = (selected: Utensil | null) => {
    // Toggle - if the same utensil is clicked, clear it, otherwise set it
    setWorkspace(prev => ({
      ...prev,
      utensil: prev.utensil?.id === selected?.id ? null : selected
    }))
  }

  const addIngredientToWorkspace = (ingredient: Ingredient, x: number, y: number) => {
    // Only allow adding an ingredient if there's cookware in the workspace
    if (!workspace.cookware) return
    
    // Check if the ingredient is compatible with the cookware
    const defaultState = ingredient.defaultState || 'whole'
    
    // Find the size for this cookware
    const sizeRatio = ingredient.sizes[workspace.cookware.name.toLowerCase().replace(' ', '_')] || 0.5
    
    setWorkspace(prev => ({
      ...prev,
      ingredients: [
        ...prev.ingredients,
        {
          ...ingredient,
          instanceId: Date.now(),
          state: defaultState,
          x,
          y,
          sizeRatio
        }
      ]
    }))
  }

  const handleIngredientStateChange = (originalIngredient, newState, newImage) => {
    console.log(`State change: ${originalIngredient.name} (${originalIngredient.state}) -> ${newState}`);
    console.log('Original ingredient:', originalIngredient);
    
    // Check if this state already exists in the ingredients list
    const stateExists = ingredients.some(ingredient => 
      ingredient.name.toLowerCase() === `${newState} ${originalIngredient.name}`.toLowerCase() ||
      (ingredient.name.toLowerCase() === originalIngredient.name.toLowerCase() && 
       ingredient.defaultState === newState)
    );
    
    console.log(`Does state already exist? ${stateExists}`);

    // If this state doesn't already exist, add it to the ingredients list
    if (!stateExists) {
      // Create a new ingredient with the new state as default
      const newIngredient: Ingredient = {
        id: ingredients.length + 1 + Date.now(), // Ensure unique ID
        name: `${newState.charAt(0).toUpperCase() + newState.slice(1)} ${originalIngredient.name}`,
        image: newImage,
        tags: [
          ...originalIngredient.tags.filter(tag => tag !== 'whole' && tag !== 'sliced' && tag !== 'diced' && tag !== 'mashed'),
          newState
        ],
        sizes: originalIngredient.sizes || {},
        states: [{ name: newState, image: newImage }],
        defaultState: newState,
        allowedActions: {
          // Copy relevant allowed actions for this new state
          ...Object.entries(originalIngredient.allowedActions || {})
            .filter(([_, rule]) => {
              const fromStates = Array.isArray(rule.from) ? rule.from : [rule.from];
              return fromStates.includes(newState);
            })
            .reduce((acc, [action, rule]) => ({ ...acc, [action]: rule }), {})
        }
      };

      console.log('Adding new ingredient:', newIngredient);
      setIngredients(prev => [...prev, newIngredient]);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      <Header />
      
      <main className="flex-1 overflow-hidden flex flex-col">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-xl">Loading...</p>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
              <Inventory 
                ingredients={ingredients} 
                className="h-1/2 md:h-auto md:w-1/3 overflow-y-auto bg-white"
              />
              
              <Workspace 
                workspace={workspace}
                updateWorkspace={setWorkspace}
                onIngredientStateChange={handleIngredientStateChange}
                className="flex-1 h-1/2 md:h-auto overflow-y-auto bg-gray-50"
              />
            </div>
            
            <div className="bg-white border-t">
              <div className="flex flex-col sm:flex-row">
                <div className="flex-1 border-b sm:border-b-0 sm:border-r">
                  <h3 className="px-4 py-2 bg-gray-100 font-medium text-sm">Cookware</h3>
                  <CookwareCarousel 
                    cookware={cookware}
                    setActiveCookware={setCookwareInWorkspace}
                    activeCookware={workspace.cookware}
                    className="h-24"
                  />
                </div>
                <div className="flex-1">
                  <h3 className="px-4 py-2 bg-gray-100 font-medium text-sm">Utensils</h3>
                  <UtensilCarousel 
                    utensils={utensils}
                    setActiveUtensil={setUtensilInWorkspace}
                    activeUtensil={workspace.utensil}
                    className="h-24"
                  />
                </div>
              </div>
            </div>
          </>
        )}
      </main>
      
      <Footer />
    </div>
  )
}

export default App