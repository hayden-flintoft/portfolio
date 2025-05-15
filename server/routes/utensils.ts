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
      path.resolve(__dirname, '../data/utensils.json'), 
      'utf8'
    )
    
    // Parse the data and make sure all image paths have the correct format
    const utensils = JSON.parse(data);
    
    // Make sure all image paths have the correct format
    utensils.forEach(item => {
      if (item.image && !item.image.startsWith('/images/')) {
        item.image = '/images/' + item.image;
      }
    });
    
    res.json(utensils);
  } catch (error) {
    console.error('Error reading utensils data:', error)
    res.status(500).json({ error: 'Failed to load utensils' })
  }
})

export default router