export async function fetchIngredients() {
  try {
    const response = await fetch('/api/ingredients')
    if (!response.ok) {
      throw new Error('Failed to fetch ingredients')
    }
    return await response.json()
  } catch (error) {
    console.error('Error fetching ingredients:', error)
    return []
  }
}