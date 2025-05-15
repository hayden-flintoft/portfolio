import React from 'react'

interface Tool {
  id: number
  name: string
  image: string
  description: string
}

interface ToolCarouselProps {
  tools: Tool[]
  setActiveWorkspace: React.Dispatch<React.SetStateAction<Tool | null>>
  activeWorkspace: Tool | null
  className?: string
}

function ToolCarousel({ tools, setActiveWorkspace, activeWorkspace, className }: ToolCarouselProps) {
  return (
    <div className={`p-2 overflow-x-auto ${className}`}>
      <div className="flex space-x-4 px-2">
        {tools.map(tool => (
          <div 
            key={tool.id}
            className="flex-shrink-0 w-20 cursor-pointer group"
            onClick={() => setActiveWorkspace(tool)}
          >
            <div className={`aspect-square rounded overflow-hidden mb-1 border-2 ${
              tool.id === activeWorkspace?.id ? 'border-green-500' : 'border-transparent'
            }`}>
              <img 
                src={tool.image} 
                alt={tool.name}
                className={`w-full h-full object-cover group-hover:opacity-90 transition-opacity ${
                  tool.id === activeWorkspace?.id ? 'opacity-100' : 'opacity-100'
                }`}
                onError={(e) => {
                  console.error(`Failed to load image: ${tool.image}`);
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = `https://placehold.co/200x200/gray/white?text=${encodeURIComponent(tool.name)}`;
                }}
              />
            </div>
            <p className="text-center text-sm truncate">{tool.name}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

export default ToolCarousel