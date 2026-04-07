import { createContext, useContext, useState, type ReactNode } from 'react'

interface User {
  name: string
  email: string
  avatar?: string
}

interface AuthContextType {
  user: User | null
  signIn: (user: User) => void
  signOut: () => void
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)

  return (
    <AuthContext.Provider value={{ user, signIn: setUser, signOut: () => setUser(null) }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
