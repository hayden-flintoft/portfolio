import { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { fetchIngredients } from '../api/ingredients';

export interface IngredientState {
  name: string;
  image: string;
}

export interface Ingredient {
  id: number;
  name: string;
  image: string;
  tags: string[];
  sizes: Record<string, number>;
  states: Array<IngredientState>;
  defaultState: string;
  allowedActions: Record<string, {from: string | string[], to: string}>;
}

interface IngredientsContextType {
  ingredients: Ingredient[];
  loading: boolean;
  error: string | null;
  addProcessedIngredient: (ingredient: Ingredient) => void;
}

const IngredientsContext = createContext<IngredientsContextType | undefined>(undefined);

export function IngredientsProvider({ children }: { children: ReactNode }) {
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadIngredients() {
      try {
        setLoading(true);
        const data = await fetchIngredients();
        setIngredients(data);
      } catch (err) {
        setError('Failed to load ingredients');
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    loadIngredients();
  }, []);

  const addProcessedIngredient = (ingredient: Ingredient) => {
    // Check if this processed ingredient already exists
    const exists = ingredients.some(
      i => i.name === ingredient.name && i.defaultState === ingredient.defaultState
    );

    if (!exists) {
      setIngredients(prev => [...prev, ingredient]);
    }
  };

  return (
    <IngredientsContext.Provider
      value={{
        ingredients,
        loading,
        error,
        addProcessedIngredient,
      }}
    >
      {children}
    </IngredientsContext.Provider>
  );
}

export function useIngredients() {
  const context = useContext(IngredientsContext);
  if (context === undefined) {
    throw new Error('useIngredients must be used within an IngredientsProvider');
  }
  return context;
}