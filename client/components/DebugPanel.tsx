// New file for debugging

import React from 'react';

interface DebugPanelProps {
  data: any;
}

function DebugPanel({ data }: DebugPanelProps) {
  return (
    <div className="fixed bottom-0 right-0 z-[1000] bg-black bg-opacity-80 text-white p-3 text-sm rounded-tl-lg shadow-lg"
         style={{ maxWidth: '300px', maxHeight: '200px', overflow: 'auto' }}>
      <h3 className="font-bold text-green-400 mb-1">Debug Info:</h3>
      <pre className="text-xs">{JSON.stringify(data, null, 2)}</pre>
    </div>
  );
}

export default DebugPanel;