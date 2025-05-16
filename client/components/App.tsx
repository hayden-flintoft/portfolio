import React, { useState, useEffect } from 'react'
import Header from './Header'
import Footer from './Footer'
import Inventory from './Inventory'
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
  const [isInventoryOpen, setIsInventoryOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  
  // Check if the device is mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
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
      {/* Mobile layout */}
      {isMobile ? (
        <div className="flex flex-col h-full relative">
          <Workspace className="flex-1 overflow-y-auto bg-gray-50" />
          
          {/* Mobile inventory toggle button */}
          <button
            className="absolute bottom-4 right-4 bg-green-500 text-white p-3 rounded-full shadow-lg z-50"
            onClick={() => setIsInventoryOpen(!isInventoryOpen)}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </button>
          
          {/* Mobile slide-up panel */}
          <div 
            className={`fixed inset-x-0 bottom-0 z-40 bg-white rounded-t-xl shadow-lg transition-transform duration-300 transform ${
              isInventoryOpen ? 'translate-y-0' : 'translate-y-full'
            }`}
            style={{ 
              height: '80vh',
              overflowY: 'auto'
            }}
          >
            <div className="flex justify-center p-2 border-b">
              <div className="w-12 h-1.5 bg-gray-300 rounded-full"></div>
            </div>
            <Inventory className="h-full" />
          </div>
          
          {/* Overlay */}
          {isInventoryOpen && (
            <div 
              className="fixed inset-0 bg-black bg-opacity-50 z-30"
              onClick={() => setIsInventoryOpen(false)}
            ></div>
          )}
        </div>
      ) : (
        /* Desktop/tablet layout */
        <div className="flex-1 overflow-hidden flex flex-col lg:flex-row">
          <Inventory className="h-1/3 lg:h-auto lg:w-1/3 xl:w-1/4 overflow-y-auto bg-white" />
          <Workspace className="flex-1 h-2/3 lg:h-auto overflow-y-auto bg-gray-50" />
        </div>
      )}
    </>
  );
}

export default App