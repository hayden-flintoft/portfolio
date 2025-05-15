import React from 'react'

function Footer() {
  return (
    <footer className="bg-gray-800 text-white py-2 text-center text-sm">
      <p>© {new Date().getFullYear()} Cook Simulator App</p>
    </footer>
  )
}

export default Footer