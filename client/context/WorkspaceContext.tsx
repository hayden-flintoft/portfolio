import { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { useIngredients } from './IngredientsContext'; // Import the hook
import { useKitchenItems } from './KitchenItemsContext'; // Import the kitchen items context

export interface Cookware {
  id: number;
  name: string;
  image: string;
  description: string;
  type: 'cookware';
  acceptsStates: string[];
  compatibleUtensils: string[];
  allowedActions: string[];
  centersIngredients?: boolean;
  clearBeforeAdd: boolean;  // Add this property
}

export interface Utensil {
  id: number;
  name: string;
  image: string;
  description: string;
  type: 'utensil';
  actions: string[];
  compatibleWith: string[];
}

export interface IngredientInstance {
  id: number;
  instanceId: number;
  name: string;
  image: string;
  state: string;
  x: number;
  y: number;
  sizeRatio?: number;
  [key: string]: any;
}

export interface WorkspaceState {
  cookware: Cookware | null;
  utensil: Utensil | null;
  ingredients: IngredientInstance[];
}

interface WorkspaceContextType {
  workspace: WorkspaceState;
  setCookware: (cookware: Cookware | null) => void;
  setUtensil: (utensil: Utensil | null) => void;
  addIngredient: (ingredient: any, x: number, y: number) => void;
  updateIngredientState: (instanceId: number, newState: string, newImage: string) => void;
  updateIngredientPosition: (instanceId: string, x: number, y: number) => void;
  removeIngredient: (instanceId: string) => void;
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined);

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const { cookware: allCookware } = useKitchenItems();
  const { addProcessedIngredient } = useIngredients();
  const [workspace, setWorkspace] = useState<WorkspaceState>({
    cookware: null,
    utensil: null,
    ingredients: [],
  });

  // Add this effect to set default cookware
  useEffect(() => {
    if (allCookware.length > 0 && !workspace.cookware) {
      const choppingBoard = allCookware.find(item => 
        item.name.toLowerCase() === 'chopping board'
      );
      
      if (choppingBoard) {
        setWorkspace(prev => ({
          ...prev,
          cookware: choppingBoard
        }));
      }
    }
  }, [allCookware, workspace.cookware]);

  const setCookware = (cookware: Cookware | null) => {
    // When changing cookware, clear the workspace entirely
    setWorkspace({
      cookware,
      utensil: null,  // Reset to hands
      ingredients: [],
    });
  };

  const setUtensil = (utensil: Utensil | null) => {
    // Toggle if same utensil is selected
    setWorkspace(prev => ({
      ...prev,
      utensil: prev.utensil?.id === utensil?.id ? null : utensil,
    }));
  };

  const addIngredient = (ingredient: any, x: number, y: number) => {
    if (!workspace.cookware) return;

    const instanceId = `${ingredient.id}-${Date.now()}-${Math.random()}`;
    const initialState = ingredient.defaultState || 'whole';
    
    // Find the current state configuration
    const currentState = ingredient.states.find((s: any) => s.name === initialState);
    
    // Use workspaceImage if available, otherwise fall back to regular image
    const displayImage = currentState?.workspaceImage || currentState?.image || ingredient.image;

    console.log('Adding ingredient to workspace:', {
      ingredient,
      instanceId,
      initialState,
      displayImage
    });

    setWorkspace(prev => ({
      ...prev,
      ingredients: [
        ...prev.ingredients,
        {
          ...ingredient,
          instanceId,
          state: initialState,
          image: displayImage,
          x,
          y
        }
      ]
    }));
  };

  const updateIngredientState = (instanceId: number, newState: string, newImage: string) => {
    console.log('Updating ingredient state:', { instanceId, newState, newImage });

    setWorkspace((prev) => ({
      ...prev,
      ingredients: prev.ingredients.map((ing) =>
        ing.instanceId === instanceId
          ? { ...ing, state: newState, image: newImage }
          : ing
      ),
    }));

    // Add the processed ingredient to the global list
    const updatedIngredient = workspace.ingredients.find(
      (ing) => ing.instanceId === instanceId
    );

    if (updatedIngredient) {
      console.log('Adding processed ingredient:', updatedIngredient);

      addProcessedIngredient({
        ...updatedIngredient,
        defaultState: newState,
        image: newImage,
      });
    }
  };

  const updateIngredientPosition = (instanceId: string, x: number, y: number) => {
    setWorkspace(prev => ({
      ...prev,
      ingredients: prev.ingredients.map(ing => 
        ing.instanceId === instanceId
          ? { ...ing, x, y }
          : ing
      )
    }));
  };

  const removeIngredient = (instanceId: string) => {
    const ingredient = workspace.ingredients.find(i => i.instanceId === instanceId);
    if (ingredient) {
      // Add to processed ingredients before removing
      addProcessedIngredient(ingredient);
      
      // Remove from workspace
      setWorkspace(prev => ({
        ...prev,
        ingredients: prev.ingredients.filter(i => i.instanceId !== instanceId)
      }));
    }
  };

  // Add a useEffect to handle active utensil changes
  useEffect(() => {
    // When a utensil is activated, update the cursor style on the workspace
    if (workspace.utensil) {
      const workspaceEl = document.querySelector('.workspace-container');
      if (workspaceEl) {
        workspaceEl.classList.add('utensil-active');
      }
    } else {
      const workspaceEl = document.querySelector('.workspace-container');
      if (workspaceEl) {
        workspaceEl.classList.remove('utensil-active');
      }
    }
  }, [workspace.utensil]);

  return (
    <WorkspaceContext.Provider
      value={{
        workspace,
        setCookware,
        setUtensil,
        addIngredient,
        updateIngredientState,
        updateIngredientPosition,
        removeIngredient,
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace() {
  const context = useContext(WorkspaceContext);
  if (context === undefined) {
    throw new Error('useWorkspace must be used within a WorkspaceProvider');
  }
  return context;
}