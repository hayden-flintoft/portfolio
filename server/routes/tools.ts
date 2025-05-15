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
      path.resolve(__dirname, '../data/tools.json'), 
      'utf8'
    )
    
    // Parse the data and make sure all image paths have the correct format
    const tools = JSON.parse(data);
    
    // Make sure all image paths have the correct format
    tools.forEach(tool => {
      if (tool.image && !tool.image.startsWith('/images/')) {
        tool.image = '/images/' + tool.image;
      }
    });
    
    res.json(tools);
  } catch (error) {
    console.error('Error reading tools data:', error)
    res.status(500).json({ error: 'Failed to load tools' })
  }
})

export default router