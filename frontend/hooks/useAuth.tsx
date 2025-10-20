import React, { createContext, useContext, useEffect, useState } from "react"
import * as SecureStore from "expo-secure-store"

type Role = "child" | "parent" | "indv"
type User = { id: string; email: string; role: Role; name?: string }

type AuthContextType = {
  user: User | null
  token: string | null
  login: (token: string, user: User) => Promise<void>
  logout: () => Promise<void>
  loading: boolean
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  login: async () => {},
  logout: async () => {},
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
        if (t && u) { setToken(t); setUser(JSON.parse(u)) }
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

  return (
    <AuthContext.Provider value={{ user, token, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
