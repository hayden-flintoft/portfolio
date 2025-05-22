// Add this to the TouchDragProvider component

// Track whether we're currently dragging
const [isDragging, setIsDragging] = useState(false);

// Update startTouchDrag
const startTouchDrag = (item: any, itemType: string, e: React.TouchEvent) => {
  setIsDragging(true);
  // Existing code...
};

// Update touchEndHandler
const touchEndHandler = (e: TouchEvent) => {
  setIsDragging(false);
  // Existing code...
};

// Add the drop indicator to the return JSX
return (
  <TouchDragContext.Provider value={{ startTouchDrag, touchDragState: touchDrag, closeInventoryTray }}>
    {children}
    {touchDrag && (
      <TouchDragPreview 
        item={touchDrag.item}
        x={touchDrag.currentX}
        y={touchDrag.currentY}
      />
    )}
    {isDragging && (
      <div className="fixed inset-0 z-30 pointer-events-none">
        <div className="absolute inset-x-0 top-14 bottom-24 flex items-center justify-center">
          <div className="rounded-xl border-4 border-dashed border-green-500 bg-green-100 bg-opacity-30 w-5/6 h-5/6 flex items-center justify-center">
            <p className="bg-white px-4 py-2 rounded-full shadow-lg font-medium text-green-600">
              Drop here
            </p>
          </div>
        </div>
      </div>
    )}
  </TouchDragContext.Provider>
);