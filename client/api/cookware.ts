export async function fetchCookware() {
  try {
    const response = await fetch('/api/cookware')
    if (!response.ok) {
      throw new Error('Failed to fetch cookware')
    }
    return await response.json()
  } catch (error) {
    console.error('Error fetching cookware:', error)
    return []
  }
}