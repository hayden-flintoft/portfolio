export async function fetchUtensils() {
  try {
    const response = await fetch('/api/utensils')
    if (!response.ok) {
      throw new Error('Failed to fetch utensils')
    }
    return await response.json()
  } catch (error) {
    console.error('Error fetching utensils:', error)
    return []
  }
}