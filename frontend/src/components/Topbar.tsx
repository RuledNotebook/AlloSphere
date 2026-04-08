import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate, useLocation } from 'react-router-dom'
import { LogoMark, LogoWordmark } from './Logo'
import { useAuth } from '../context/AuthContext'
import AuthModal from './AuthModal'
import { LogOut } from 'lucide-react'

export default function Topbar() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [showModal, setShowModal] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)

  return (
    <>
      <header style={{
        height: 56,
        background: '#fff',
        borderBottom: '1px solid var(--light-pink)',
        display: 'flex',
        alignItems: 'center',
        padding: '0 28px',
        gap: 12,
        flexShrink: 0,
        zIndex: 20,
        position: 'relative',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }} onClick={() => navigate('/')}>
          <LogoMark size={28} color="rgba(204,98,98,0.75)" />
          <LogoWordmark dark />
        </div>

        <div style={{ flex: 1 }} />

        <button
          onClick={() => navigate('/science')}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            fontSize: 13, fontWeight: 500, fontFamily: 'Inter, sans-serif',
            color: location.pathname === '/science' ? 'var(--deep-coral)' : 'var(--text-mid)',
            padding: '4px 8px', borderRadius: 6,
            transition: 'color 0.15s',
          }}
          onMouseEnter={e => (e.currentTarget.style.color = 'var(--deep-coral)')}
          onMouseLeave={e => (e.currentTarget.style.color = location.pathname === '/science' ? 'var(--deep-coral)' : 'var(--text-mid)')}
        >
          Blog
        </button>

        {user ? (
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setShowUserMenu(v => !v)}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                background: 'var(--blush)', border: '1px solid var(--light-pink)',
                borderRadius: 10, padding: '6px 12px 6px 8px',
                cursor: 'pointer', fontFamily: 'Inter, sans-serif',
              }}
            >
              <div style={{
                width: 24, height: 24, borderRadius: '50%',
                background: 'linear-gradient(135deg, var(--coral), var(--deep-coral))',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 11, fontWeight: 700, color: '#fff',
              }}>
                {user.name[0].toUpperCase()}
              </div>
              <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-dark)' }}>
                {user.name}
              </span>
            </button>

            <AnimatePresence>
              {showUserMenu && (
                <motion.div
                  initial={{ opacity: 0, y: 6, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 4, scale: 0.97 }}
                  transition={{ duration: 0.18 }}
                  style={{
                    position: 'absolute', top: 'calc(100% + 8px)', right: 0,
                    background: '#fff', border: '1px solid var(--light-pink)',
                    borderRadius: 12, padding: 6, minWidth: 160,
                    boxShadow: '0 8px 24px rgba(180,70,70,0.12)',
                    zIndex: 100,
                  }}
                >
                  <div style={{ padding: '8px 12px', borderBottom: '1px solid var(--blush)', marginBottom: 4 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-dark)' }}>{user.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>{user.email}</div>
                  </div>
                  <button
                    onClick={() => { signOut(); setShowUserMenu(false) }}
                    style={{
                      width: '100%', padding: '8px 12px',
                      display: 'flex', alignItems: 'center', gap: 8,
                      background: 'none', border: 'none', borderRadius: 8,
                      cursor: 'pointer', fontSize: 13, color: 'var(--text-mid)',
                      fontFamily: 'Inter, sans-serif', textAlign: 'left',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--blush)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                  >
                    <LogOut size={13} />
                    Sign out
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ) : (
          <motion.button
            className="btn-primary"
            style={{ padding: '8px 20px', fontSize: 13 }}
            onClick={() => setShowModal(true)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
          >
            Request Access
          </motion.button>
        )}
      </header>

      <AnimatePresence>
        {showModal && <AuthModal onClose={() => setShowModal(false)} />}
      </AnimatePresence>
    </>
  )
}
