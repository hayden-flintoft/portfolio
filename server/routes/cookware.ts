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
      path.resolve(__dirname, '../data/cookware.json'), 
      'utf8'
    )
    
    // Parse the data and make sure all image paths have the correct format
    const cookware = JSON.parse(data);
    
    // Make sure all image paths have the correct format
    cookware.forEach(item => {
      if (item.image && !item.image.startsWith('/images/')) {
        item.image = '/images/' + item.image;
      }
    });
    
    res.json(cookware);
  } catch (error) {
    console.error('Error reading cookware data:', error)
    res.status(500).json({ error: 'Failed to load cookware' })
  }
})

export default router