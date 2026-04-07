import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Mail, Lock, User, ArrowRight } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

interface AuthModalProps {
  onClose: () => void
}

type Tab = 'signin' | 'signup'

export default function AuthModal({ onClose }: AuthModalProps) {
  const { signIn } = useAuth()
  const [tab, setTab] = useState<Tab>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')

  function handleGoogleSignIn() {
    signIn({ name: 'Researcher', email: 'researcher@gmail.com' })
    onClose()
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    signIn({ name: name || email.split('@')[0], email })
    onClose()
  }

  return (
    <motion.div
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(42,26,26,0.45)',
        backdropFilter: 'blur(6px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        style={{
          background: '#fff',
          borderRadius: 20,
          width: 420,
          padding: '36px 40px',
          position: 'relative',
          boxShadow: '0 24px 64px rgba(180,70,70,0.18)',
          border: '1px solid var(--light-pink)',
        }}
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 16, scale: 0.97 }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          style={{
            position: 'absolute', top: 16, right: 16,
            background: 'var(--blush)', border: 'none', borderRadius: 8,
            width: 30, height: 30, display: 'flex', alignItems: 'center',
            justifyContent: 'center', cursor: 'pointer', color: 'var(--text-muted)',
          }}
        >
          <X size={15} />
        </button>

        <div style={{ marginBottom: 28 }}>
          <div style={{ fontSize: 11, letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--coral)', fontWeight: 600, marginBottom: 6 }}>
            AlloSphere
          </div>
          <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-dark)', letterSpacing: '-0.4px' }}>
            {tab === 'signin' ? 'Welcome back' : 'Create your account'}
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
            {tab === 'signin' ? 'Sign in to access the full platform.' : 'Get started with AlloSphere today.'}
          </div>
        </div>

        <button
          onClick={handleGoogleSignIn}
          style={{
            width: '100%', padding: '11px 16px',
            border: '1.5px solid var(--light-pink)',
            borderRadius: 12, background: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
            cursor: 'pointer', fontSize: 14, fontWeight: 500,
            color: 'var(--text-dark)', marginBottom: 20,
            transition: 'all 0.18s ease', fontFamily: 'Inter, sans-serif',
          }}
          onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--salmon)')}
          onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--light-pink)')}
        >
          <GoogleIcon />
          Continue with Google
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <div style={{ flex: 1, height: 1, background: 'var(--blush)' }} />
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>or</span>
          <div style={{ flex: 1, height: 1, background: 'var(--blush)' }} />
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <AnimatePresence>
            {tab === 'signup' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                style={{ overflow: 'hidden' }}
              >
                <Field icon={<User size={14} />} placeholder="Full name" value={name} onChange={setName} />
              </motion.div>
            )}
          </AnimatePresence>

          <Field icon={<Mail size={14} />} type="email" placeholder="Email address" value={email} onChange={setEmail} required />
          <Field icon={<Lock size={14} />} type="password" placeholder="Password" value={password} onChange={setPassword} required />

          <button
            type="submit"
            style={{
              marginTop: 4, padding: '12px',
              background: 'linear-gradient(135deg, var(--coral), var(--deep-coral))',
              color: '#fff', border: 'none', borderRadius: 12,
              fontSize: 14, fontWeight: 600, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              fontFamily: 'Inter, sans-serif', transition: 'opacity 0.18s',
            }}
          >
            {tab === 'signin' ? 'Sign in' : 'Create account'}
            <ArrowRight size={14} />
          </button>
        </form>

        <div style={{ marginTop: 20, textAlign: 'center', fontSize: 13, color: 'var(--text-muted)' }}>
          {tab === 'signin' ? (
            <>No account?{' '}
              <button onClick={() => setTab('signup')} style={{ background: 'none', border: 'none', color: 'var(--deep-coral)', fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter, sans-serif', fontSize: 13 }}>
                Create one
              </button>
            </>
          ) : (
            <>Already have an account?{' '}
              <button onClick={() => setTab('signin')} style={{ background: 'none', border: 'none', color: 'var(--deep-coral)', fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter, sans-serif', fontSize: 13 }}>
                Sign in
              </button>
            </>
          )}
        </div>
      </motion.div>
    </motion.div>
  )
}

function Field({ icon, placeholder, value, onChange, type = 'text', required = false }: {
  icon: React.ReactNode
  placeholder: string
  value: string
  onChange: (v: string) => void
  type?: string
  required?: boolean
}) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      border: '1.5px solid var(--light-pink)', borderRadius: 10,
      padding: '10px 14px', background: 'var(--surface)',
      transition: 'border-color 0.18s',
    }}
      onFocusCapture={e => (e.currentTarget.style.borderColor = 'var(--coral)')}
      onBlurCapture={e => (e.currentTarget.style.borderColor = 'var(--light-pink)')}
    >
      <span style={{ color: 'var(--text-muted)', display: 'flex' }}>{icon}</span>
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={e => onChange(e.target.value)}
        required={required}
        style={{
          flex: 1, border: 'none', outline: 'none', background: 'transparent',
          fontSize: 13.5, color: 'var(--text-dark)', fontFamily: 'Inter, sans-serif',
        }}
      />
    </div>
  )
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18">
      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
      <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
    </svg>
  )
}
