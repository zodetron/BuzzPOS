export const CREDENTIALS = {
  admin: { id: 'mehfil_admin', password: 'MehfilAdmin2025', role: 'admin' },
  staff: { id: 'mehfil_staff', password: 'MehfilStaff2025', role: 'staff' },
}

export function login(id, password) {
  const match = Object.values(CREDENTIALS).find(c => c.id === id && c.password === password)
  if (!match) return null
  localStorage.setItem('bar_user', JSON.stringify({ id, password, role: match.role }))
  return match.role
}

export function logout() {
  localStorage.removeItem('bar_user')
}

export function getUser() {
  try {
    return JSON.parse(localStorage.getItem('bar_user') || 'null')
  } catch {
    return null
  }
}
