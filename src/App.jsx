import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import Login from './pages/Login'
import POS from './pages/POS'
import Admin from './pages/Admin'
import { getUser } from './lib/auth'

function RequireAuth({ children, role }) {
  const user = getUser()
  if (!user) return <Navigate to="/" replace />
  if (role === 'admin' && user.role !== 'admin') return <Navigate to="/pos" replace />
  return children
}

function AnimatedRoutes() {
  const location = useLocation()
  
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route 
          path="/" 
          element={
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <Login />
            </motion.div>
          } 
        />
        <Route 
          path="/pos" 
          element={
            <RequireAuth>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <POS />
              </motion.div>
            </RequireAuth>
          } 
        />
        <Route 
          path="/admin" 
          element={
            <RequireAuth role="admin">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <Admin />
              </motion.div>
            </RequireAuth>
          } 
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AnimatePresence>
  )
}

export default function App() {
  return (
    <div className="font-inter">
      <BrowserRouter>
        <AnimatedRoutes />
      </BrowserRouter>
    </div>
  )
}
