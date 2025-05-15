export async function fetchTools() {
  try {
    const response = await fetch('/api/tools')
    if (!response.ok) {
      throw new Error('Failed to fetch tools')
    }
    return await response.json()
  } catch (error) {
    console.error('Error fetching tools:', error)
    return []
  }
}