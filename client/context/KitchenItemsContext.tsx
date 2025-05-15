import { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { fetchCookware } from '../api/cookware';
import { fetchUtensils } from '../api/utensils';
import { Cookware, Utensil } from './WorkspaceContext';

interface KitchenItemsContextType {
  cookware: Cookware[];
  utensils: Utensil[];
  loading: boolean;
  error: string | null;
}

const KitchenItemsContext = createContext<KitchenItemsContextType | undefined>(undefined);

export function KitchenItemsProvider({ children }: { children: ReactNode }) {
  const [cookware, setCookware] = useState<Cookware[]>([]);
  const [utensils, setUtensils] = useState<Utensil[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadKitchenItems() {
      try {
        setLoading(true);
        const [cookwareData, utensilsData] = await Promise.all([
          fetchCookware(),
          fetchUtensils(),
        ]);
        setCookware(cookwareData);
        setUtensils(utensilsData);
      } catch (err) {
        setError('Failed to load kitchen items');
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    loadKitchenItems();
  }, []);

  return (
    <KitchenItemsContext.Provider
      value={{
        cookware,
        utensils,
        loading,
        error,
      }}
    >
      {children}
    </KitchenItemsContext.Provider>
  );
}

export function useKitchenItems() {
  const context = useContext(KitchenItemsContext);
  if (context === undefined) {
    throw new Error('useKitchenItems must be used within a KitchenItemsProvider');
  }
  return context;
}