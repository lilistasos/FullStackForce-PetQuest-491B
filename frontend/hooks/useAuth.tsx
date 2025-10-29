import React, { createContext, useContext, useEffect, useState } from "react"
import * as SecureStore from "expo-secure-store"

type Role = "child" | "parent" | "indv"
type User = { id: string; email: string; role: Role; name?: string; firstName?: string; profileImageUri?: string }

type AuthContextType = {
  user: User | null
  token: string | null
  login: (token: string, user: User) => Promise<void>
  logout: () => Promise<void>
  updateUser: (updates: Partial<User>) => Promise<void>
  loading: boolean
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  login: async () => {},
  logout: async () => {},
  updateUser: async () => {},
  loading: true,
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    ;(async () => {
      try {
        const t = await SecureStore.getItemAsync("token")
        const u = await SecureStore.getItemAsync("user")
        if (t && u) { 
          setToken(t); 
          setUser(JSON.parse(u)) 
        } else {
          // For demo purposes: create a demo user if none exists
          const demoUser: User = {
            id: 'demo-user',
            email: 'demo@example.com',
            role: 'child',
            name: 'Demo User'
          }
          setUser(demoUser)
          await SecureStore.setItemAsync("user", JSON.stringify(demoUser))
        }
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  const login = async (t: string, u: User) => {
    setToken(t); setUser(u)
    await SecureStore.setItemAsync("token", t)
    await SecureStore.setItemAsync("user", JSON.stringify(u))
  }

  const logout = async () => {
    setToken(null); setUser(null)
    await SecureStore.deleteItemAsync("token")
    await SecureStore.deleteItemAsync("user")
  }

  const updateUser = async (updates: Partial<User>) => {
    // For demo purposes: if no user exists, create a demo user
    let currentUser = user
    if (!currentUser) {
      currentUser = {
        id: 'demo-user',
        email: 'demo@example.com',
        role: 'child' as Role,
        name: 'Demo User'
      }
      setUser(currentUser)
    }
    const updatedUser = { ...currentUser, ...updates }
    setUser(updatedUser)
    await SecureStore.setItemAsync("user", JSON.stringify(updatedUser))
  }

  return (
    <AuthContext.Provider value={{ user, token, login, logout, updateUser, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
