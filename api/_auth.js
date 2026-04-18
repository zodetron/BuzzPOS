// api/_auth.js
// Shared auth helpers for serverless functions.
// Reads credentials from environment variables so they never touch the frontend.

const ADMIN_ID = process.env.ADMIN_ID || 'mehfil_admin'
const ADMIN_PW = process.env.ADMIN_PASSWORD || 'MehfilAdmin2025'
const STAFF_ID = process.env.STAFF_ID || 'mehfil_staff'
const STAFF_PW = process.env.STAFF_PASSWORD || 'MehfilStaff2025'

/**
 * Returns the role ('admin' | 'staff') if credentials are valid, or null.
 */
export function getRole(req) {
  const id = req.headers['x-user-id']
  const pw = req.headers['x-user-password']
  if (id === ADMIN_ID && pw === ADMIN_PW) return 'admin'
  if (id === STAFF_ID && pw === STAFF_PW) return 'staff'
  return null
}

/** Require at least staff-level access. Returns false and sends 401 if denied. */
export function requireStaff(req, res) {
  const role = getRole(req)
  if (!role) {
    res.status(401).json({ error: 'Unauthorized' })
    return false
  }
  return true
}

/** Require admin-level access. Returns false and sends 401 if denied. */
export function requireAdmin(req, res) {
  const role = getRole(req)
  if (role !== 'admin') {
    res.status(401).json({ error: 'Unauthorized' })
    return false
  }
  return true
}

export const ADMIN_ID_VALUE = ADMIN_ID
