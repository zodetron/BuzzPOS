// src/lib/api.js
// Thin API client — all requests go to Vercel serverless functions at /api/*.
// Uses axios with auth headers injected from localStorage.
// Never touches MongoDB directly — all DB work is in /api/*.

import axios from 'axios'

// When running plain `vite dev` (no Vercel CLI), set VITE_API_BASE=http://localhost:4000
// in a .env.local file to proxy to a local Express server.
// In production and `vercel dev`, this is empty and /api/* resolves on the same origin.
const BASE = import.meta.env.VITE_API_BASE || ''

function getHeaders() {
  try {
    const user = JSON.parse(localStorage.getItem('bar_user') || '{}')
    return {
      'x-user-id':       user.id       || '',
      'x-user-password': user.password || '',
    }
  } catch {
    return {}
  }
}

const client = axios.create({ baseURL: BASE })

// Return empty fallback instead of throwing when the API is unreachable
client.interceptors.response.use(
  res => res,
  err => {
    if (!err.response || err.response.status === 404 || err.response.status === 500) {
      return Promise.resolve({ data: err.config?._fallback ?? null })
    }
    return Promise.reject(err)
  }
)

export const api = {
  // Items
  getItems:   ()     => client.get('/api/items',     { headers: getHeaders(), _fallback: [] }),
  createItem: (data) => client.post('/api/items',    data, { headers: getHeaders() }),
  updateItem: (data) => client.put('/api/items',     data, { headers: getHeaders() }),
  deleteItem: (id)   => client.delete('/api/items',  { data: { id }, headers: getHeaders() }),

  // Orders
  placeOrder: (items) => client.post('/api/order', { items }, { headers: getHeaders() }),

  // Dashboard
  getDashboard: (range = '7d') =>
    client.get(`/api/dashboard?range=${range}`, { headers: getHeaders(), _fallback: null }),
}
