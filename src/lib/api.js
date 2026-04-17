import axios from 'axios'

function getHeaders() {
  try {
    const user = JSON.parse(localStorage.getItem('bar_user') || '{}')
    return {
      'x-user-id': user.id || '',
      'x-user-password': user.password || '',
    }
  } catch {
    return {}
  }
}

const client = axios.create()

// Return empty data instead of throwing when API is unavailable (no backend in npm run dev)
client.interceptors.response.use(
  res => res,
  err => {
    if (!err.response || err.response.status === 404 || err.response.status === 500) {
      // Return empty fallback so UI doesn't crash
      return Promise.resolve({ data: err.config?._fallback ?? null })
    }
    return Promise.reject(err)
  }
)

export const api = {
  getItems: () => client.get('/api/items', { headers: getHeaders(), _fallback: [] }),
  createItem: (data) => client.post('/api/items', data, { headers: getHeaders() }),
  updateItem: (data) => client.put('/api/items', data, { headers: getHeaders() }),
  deleteItem: (id) => client.delete('/api/items', { data: { id }, headers: getHeaders() }),
  placeOrder: (items) => client.post('/api/order', { items }, { headers: getHeaders() }),
  getDashboard: (range = '7d') => client.get(`/api/dashboard?range=${range}`, { headers: getHeaders(), _fallback: null }),
}
