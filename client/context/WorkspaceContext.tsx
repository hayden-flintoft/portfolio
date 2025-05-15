import { createContext, useState, useContext, ReactNode } from 'react';

export interface Cookware {
  id: number;
  name: string;
  image: string;
  description: string;
  type: 'cookware';
  acceptsStates: string[];
  compatibleUtensils: string[];
  allowedActions: string[];
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
  removeIngredient: (instanceId: number) => void;
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined);

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const [workspace, setWorkspace] = useState<WorkspaceState>({
    cookware: null,
    utensil: null,
    ingredients: [],
  });

  const setCookware = (cookware: Cookware | null) => {
    // When changing cookware, clear the workspace entirely
    setWorkspace({
      cookware,
      utensil: null,
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
    // Only allow adding ingredients if there's cookware in the workspace
    if (!workspace.cookware) return;

    // Find the size for this cookware
    const cookwareName = workspace.cookware.name.toLowerCase().replace(/\s+/g, '_');
    const sizeRatio = ingredient.sizes?.[cookwareName] || 0.5;
    const defaultState = ingredient.defaultState || 'whole';

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
          sizeRatio,
        },
      ],
    }));
  };

  const updateIngredientState = (instanceId: number, newState: string, newImage: string) => {
    setWorkspace(prev => ({
      ...prev,
      ingredients: prev.ingredients.map(ing =>
        ing.instanceId === instanceId
          ? { ...ing, state: newState, image: newImage }
          : ing
      ),
    }));
  };

  const removeIngredient = (instanceId: number) => {
    setWorkspace(prev => ({
      ...prev,
      ingredients: prev.ingredients.filter(ing => ing.instanceId !== instanceId),
    }));
  };

  return (
    <WorkspaceContext.Provider
      value={{
        workspace,
        setCookware,
        setUtensil,
        addIngredient,
        updateIngredientState,
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