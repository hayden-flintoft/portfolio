import React from 'react'
import Header from './Header'
import Footer from './Footer'
import Inventory from './Inventory'
import CookwareCarousel from './CookwareCarousel'
import UtensilCarousel from './UtensilCarousel'
import Workspace from './Workspace'
import { IngredientsProvider } from '../context/IngredientsContext'
import { WorkspaceProvider } from '../context/WorkspaceContext'
import { KitchenItemsProvider } from '../context/KitchenItemsContext'
import { useIngredients } from '../context/IngredientsContext'
import { useKitchenItems } from '../context/KitchenItemsContext'

function App() {
  return (
    <IngredientsProvider>
      <KitchenItemsProvider>
        <WorkspaceProvider>
          <div className="flex flex-col h-screen bg-gray-100">
            <Header />
            
            <main className="flex-1 overflow-hidden flex flex-col">
              <AppContent />
            </main>
            
            <Footer />
          </div>
        </WorkspaceProvider>
      </KitchenItemsProvider>
    </IngredientsProvider>
  )
}

// Separate component for content that depends on context values
function AppContent() {
  const { loading: ingredientsLoading, error: ingredientsError } = useIngredients();
  const { loading: kitchenItemsLoading, error: kitchenItemsError } = useKitchenItems();
  
  const isLoading = ingredientsLoading || kitchenItemsLoading;
  const hasError = ingredientsError || kitchenItemsError;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-xl">Loading...</p>
      </div>
    );
  }

  if (hasError) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-xl text-red-500">Error loading data. Please refresh the page.</p>
      </div>
    );
  }

  return (
    <>
      <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
        <Inventory 
          className="h-1/2 md:h-auto md:w-1/3 overflow-y-auto bg-white"
        />
        
        <Workspace 
          className="flex-1 h-1/2 md:h-auto overflow-y-auto bg-gray-50"
        />
      </div>
      
      <div className="bg-white border-t">
        <div className="flex flex-col sm:flex-row">
          <div className="flex-1 border-b sm:border-b-0 sm:border-r">
            <h3 className="px-4 py-2 bg-gray-100 font-medium text-sm">Cookware</h3>
            <CookwareCarousel className="h-24" />
          </div>
          <div className="flex-1">
            <h3 className="px-4 py-2 bg-gray-100 font-medium text-sm">Utensils</h3>
            <UtensilCarousel className="h-24" />
          </div>
        </div>
      </div>
    </>
  );
}

export default App