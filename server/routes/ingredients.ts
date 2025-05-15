import express from 'express'
import path from 'path'
import { fileURLToPath } from 'url'
import { readFile } from 'fs/promises'

const router = express.Router()

// ES modules replacement for __dirname
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

router.get('/', async (req, res) => {
  try {
    const data = await readFile(
      path.resolve(__dirname, '../data/ingredients.json'), 
      'utf8'
    )
    
    // Parse the data and make sure all image paths have the correct format
    const ingredients = JSON.parse(data);
    
    // Make sure all image paths have the correct format
    ingredients.forEach(ingredient => {
      if (ingredient.image && !ingredient.image.startsWith('/images/')) {
        ingredient.image = '/images/' + ingredient.image;
      }
      
      // Also update state images if they exist
      if (ingredient.states && Array.isArray(ingredient.states)) {
        ingredient.states.forEach(state => {
          if (typeof state === 'object' && state.image && !state.image.startsWith('/images/')) {
            state.image = '/images/' + state.image;
          }
        });
      }
    });
    
    res.json(ingredients);
  } catch (error) {
    console.error('Error reading ingredients data:', error)
    res.status(500).json({ error: 'Failed to load ingredients' })
  }
})

export default router