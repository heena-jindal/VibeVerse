"use client"
import { createContext, useContext, useState, useEffect, ReactNode } from "react"

interface AuthContextType {
  user: string | null
  isLoading: boolean
  login: (username: string, password: string) => Promise<{ success: boolean; message: string }>
  register: (username: string, password: string) => Promise<{ success: boolean; message: string }>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const stored = localStorage.getItem("vibeverse_user")
    if (stored) setUser(stored)
    setIsLoading(false)
  }, [])

  const login = async (username: string, password: string) => {
    const res  = await fetch(`/api/login`, {
      method:      "POST",
      headers:     { "Content-Type": "application/json" },
      credentials: "include",
      body:        JSON.stringify({ username, password }),
    })
    const data = await res.json()
    if (data.success) {
      setUser(username)
      localStorage.setItem("vibeverse_user", username)
    }
    return data
  }

  const register = async (username: string, password: string) => {
    const res = await fetch(`/api/register`, {
      method:      "POST",
      headers:     { "Content-Type": "application/json" },
      credentials: "include",
      body:        JSON.stringify({ username, password }),
    })
    return res.json()
  }

  const logout = async () => {
    await fetch(`/api/logout`, {
      method:      "POST",
      credentials: "include",
    })
    setUser(null)
    localStorage.removeItem("vibeverse_user")
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}