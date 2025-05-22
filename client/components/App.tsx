import React, { useState, useEffect, useRef, useCallback } from 'react'
import Header from './Header'
import Footer from './Footer'
import Inventory from './Inventory'
import Workspace from './Workspace'
import QuickAccessBar from './QuickAccessBar'
import MobileContextBar from './MobileContextBar'
import { IngredientsProvider } from '../context/IngredientsContext'
import { WorkspaceProvider } from '../context/WorkspaceContext'
import { KitchenItemsProvider } from '../context/KitchenItemsContext'
import { TouchDragProvider, TouchDragContext } from '../context/TouchDragContext'
import { useIngredients } from '../context/IngredientsContext'
import { useKitchenItems } from '../context/KitchenItemsContext'
import { useWorkspace } from '../context/WorkspaceContext'
import './workspace.css';

function App() {
  return (
    <IngredientsProvider>
      <KitchenItemsProvider>
        <WorkspaceProvider>
          <TouchDragProvider>
            <div className="flex flex-col h-screen bg-gray-100">
              <Header />
              
              <main className="flex-1 overflow-hidden flex flex-col">
                <AppContent />
              </main>
              
              <Footer />
            </div>
          </TouchDragProvider>
        </WorkspaceProvider>
      </KitchenItemsProvider>
    </IngredientsProvider>
  )
}

// Separate component for content that depends on context values
function AppContent() {
  const { loading: ingredientsLoading, error: ingredientsError } = useIngredients();
  const { loading: kitchenItemsLoading, error: kitchenItemsError } = useKitchenItems();
  const { workspace } = useWorkspace();
  const [isInventoryOpen, setIsInventoryOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const inventoryTrayRef = useRef(null);

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

  // Export the close function through context
  const closeInventoryTray = useCallback(() => {
    setIsInventoryOpen(false);
  }, []);

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
    {/* Header is external to this component, so we need padding at top */}
    <div className="h-12"></div> {/* Space for header */}
    
    <MobileContextBar />
    
    {/* Workspace with adjusted padding for both header and context bar */}
    <Workspace className="flex-1 overflow-y-auto bg-gray-50 pb-24 pt-24" /> {/* Add top padding for the context bar */}
    
    {/* Fixed bottom quick access bar */}
    <div className="fixed left-0 right-0 bottom-0 z-30"> {/* Increased z-index */}
      <QuickAccessBar 
        onOpenInventory={() => {
          console.log("Opening inventory from QuickAccessBar");
          setIsInventoryOpen(true);
        }}
      />
    </div>
    
    {/* Mobile slide-up panel */}
    <div 
      ref={inventoryTrayRef}
      className={`fixed inset-x-0 bottom-0 z-40 bg-white rounded-t-xl shadow-lg transition-transform duration-300 transform inventory-tray ${
        isInventoryOpen ? 'translate-y-0' : 'translate-y-full'
      }`}
      style={{ 
        height: '80vh',
        overflowY: 'auto'
      }}
    >
      <div 
        className="flex justify-center p-2 border-b inventory-drawer-handle"
        onClick={() => setIsInventoryOpen(false)}
      >
        <div className="w-12 h-1.5 bg-gray-300 rounded-full"></div>
      </div>
      <Inventory className="h-full" hideQuickAccess={true} />
    </div>
    
    {/* Overlay - ensure it's below other interactive elements */}
    {isInventoryOpen && (
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-20" // Lower z-index
        onClick={() => setIsInventoryOpen(false)}
      ></div>
    )}
  </div>
) : (
        /* Desktop layout - unchanged */
        <div className="flex-1 overflow-hidden flex flex-col lg:flex-row">
          <Inventory className="h-1/3 lg:h-auto lg:w-1/3 xl:w-1/4 overflow-y-auto bg-white" />
          <Workspace className="flex-1 h-2/3 lg:h-auto overflow-y-auto bg-gray-50" />
        </div>
      )}
    </>
  );
}

export default App