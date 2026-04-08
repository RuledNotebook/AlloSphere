import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Mail, User, ArrowRight, CheckCircle, AlertCircle } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'

interface AuthModalProps {
  onClose: () => void
}

export default function AuthModal({ onClose }: AuthModalProps) {
  const { signIn } = useAuth()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [role, setRole] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error: dbError } = await supabase.from('waitlist').insert({ name, email, role })
    if (dbError && dbError.code !== '23505') {
      console.error('Supabase error:', dbError)
      setError(`Error: ${dbError.message}`)
      setLoading(false)
      return
    }
    signIn({ name: name || email.split('@')[0], email })
    setSubmitted(true)
    setLoading(false)
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

        <AnimatePresence mode="wait">
          {submitted ? (
            <motion.div
              key="success"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              style={{ textAlign: 'center', padding: '12px 0' }}
            >
              <CheckCircle size={40} color="var(--coral)" strokeWidth={1.5} style={{ marginBottom: 16 }} />
              <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-dark)', letterSpacing: '-0.3px', marginBottom: 8 }}>
                You're on the list
              </div>
              <div style={{ fontSize: 13.5, color: 'var(--text-muted)', lineHeight: 1.65 }}>
                We'll reach out as AlloSphere approaches early access. We'll share updates on the platform's development as it progresses.
              </div>
              <button
                onClick={onClose}
                className="btn-primary"
                style={{ marginTop: 24, padding: '10px 28px', fontSize: 13 }}
              >
                Close
              </button>
            </motion.div>
          ) : (
            <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <div style={{ marginBottom: 28 }}>
                <div style={{ fontSize: 11, letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--coral)', fontWeight: 600, marginBottom: 6 }}>
                  Early Access
                </div>
                <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-dark)', letterSpacing: '-0.4px', marginBottom: 6 }}>
                  Stay in the loop
                </div>
                <div style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6 }}>
                  AlloSphere is in active development. Leave your details and we'll notify you when early access opens.
                </div>
              </div>

              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <Field icon={<User size={14} />} placeholder="Full name" value={name} onChange={setName} />
                <Field icon={<Mail size={14} />} type="email" placeholder="Work email" value={email} onChange={setEmail} required />

                <div style={{
                  border: '1.5px solid var(--light-pink)', borderRadius: 10,
                  overflow: 'hidden', background: 'var(--surface)',
                  transition: 'border-color 0.18s',
                }}
                  onFocusCapture={e => (e.currentTarget.style.borderColor = 'var(--coral)')}
                  onBlurCapture={e => (e.currentTarget.style.borderColor = 'var(--light-pink)')}
                >
                  <select
                    value={role}
                    onChange={e => setRole(e.target.value)}
                    style={{
                      width: '100%', padding: '10px 14px',
                      border: 'none', outline: 'none', background: 'transparent',
                      fontSize: 13.5, color: role ? 'var(--text-dark)' : 'var(--text-muted)',
                      fontFamily: 'Inter, sans-serif', cursor: 'pointer',
                    }}
                  >
                    <option value="" disabled>Role (optional)</option>
                    <option>Medicinal chemist</option>
                    <option>Computational biologist</option>
                    <option>Structural biologist</option>
                    <option>Drug discovery researcher</option>
                    <option>Academic researcher</option>
                    <option>Biotech / pharma</option>
                    <option>Other</option>
                  </select>
                </div>

                {error && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '8px 12px', background: '#fff0f0', border: '1px solid var(--light-pink)', borderRadius: 8, fontSize: 13, color: 'var(--deep-coral)' }}>
                    <AlertCircle size={13} />
                    {error}
                  </div>
                )}
                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    marginTop: 4, padding: '12px',
                    background: 'linear-gradient(135deg, var(--coral), var(--deep-coral))',
                    color: '#fff', border: 'none', borderRadius: 12,
                    fontSize: 14, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    fontFamily: 'Inter, sans-serif', opacity: loading ? 0.7 : 1, transition: 'opacity 0.18s',
                  }}
                >
                  {loading ? 'Submitting...' : 'Request early access'}
                  {!loading && <ArrowRight size={14} />}
                </button>
              </form>

              <div style={{ marginTop: 16, fontSize: 12, color: 'var(--text-muted)', textAlign: 'center' }}>
                No spam. We'll only contact you about AlloSphere access.
              </div>
            </motion.div>
          )}
        </AnimatePresence>
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
