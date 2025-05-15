import express from 'express'
import * as Path from 'node:path'
import { fileURLToPath } from 'url'
import fs from 'fs'

import ingredientsRoutes from './routes/ingredients.ts'
import cookwareRoutes from './routes/cookware.ts'
import utensilsRoutes from './routes/utensils.ts'

// Get the directory name using ESM approach
const __filename = fileURLToPath(import.meta.url)
const __dirname = Path.dirname(__filename)

const server = express()

server.use(express.json())

// Debug the image path to confirm it exists
const imagesPath = Path.join(__dirname, 'data/images')
console.log('Images directory path:', imagesPath)
console.log('Files in directory:', fs.existsSync(imagesPath) ? fs.readdirSync(imagesPath) : 'Directory not found')

// Serve static images properly 
server.use('/images', express.static(Path.join(__dirname, 'data/images')))

// Add a logging middleware to debug image requests
server.use('/images', (req, res, next) => {
  console.log(`Image request received: ${req.url}`)
  next()
})

// Serve static sound files
server.use('/sounds', express.static(Path.join(__dirname, 'data/sounds')));

// API routes
server.use('/api/ingredients', ingredientsRoutes)
server.use('/api/cookware', cookwareRoutes)
server.use('/api/utensils', utensilsRoutes)

if (process.env.NODE_ENV === 'production') {
  server.use(express.static(Path.resolve('public')))
  server.use('/assets', express.static(Path.resolve('./dist/assets')))
  server.get('*', (req, res) => {
    res.sendFile(Path.resolve('./dist/index.html'))
  })
}

// Add test endpoint
server.get('/test-image', (req, res) => {
  res.send(`
    <html>
      <body>
        <h1>Image Test</h1>
        <img src="/images/avocado.png" alt="Avocado Test" />
        <p>If you see an image above, the image serving is working.</p>
      </body>
    </html>
  `)
})

export default server
