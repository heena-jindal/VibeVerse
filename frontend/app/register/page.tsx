"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Field, FieldLabel } from "@/components/ui/field"
import { Spinner } from "@/components/ui/spinner"
import { AuthProvider, useAuth } from "@/lib/auth-context"
import { Sparkles, AlertCircle, CheckCircle, ArrowRight } from "lucide-react"

function RegisterForm() {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const { register } = useAuth()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccess("")
    setIsLoading(true)

    if (!username.trim() || !password.trim() || !confirmPassword.trim()) {
      setError("Please fill in all fields")
      setIsLoading(false)
      return
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match")
      setIsLoading(false)
      return
    }

    if (password.length < 4) {
      setError("Password must be at least 4 characters")
      setIsLoading(false)
      return
    }

    const result = await register(username, password)
    
    if (result.success) {
      setSuccess("Account created! Redirecting to login...")
      setTimeout(() => router.push("/login"), 1500)
    } else {
      setError(result.message || "Registration failed")
    }
    setIsLoading(false)
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-8 relative overflow-hidden">
      {/* Decorative elements */}
      <div className="decorative-blur w-[400px] h-[400px] bg-accent/30 -top-32 -left-32 fixed" />
      <div className="decorative-blur w-[300px] h-[300px] bg-primary/30 bottom-20 -right-20 fixed" />
      
      <div className="w-full max-w-md relative z-10 animate-fade-up">
        <Link href="/" className="flex items-center justify-center gap-3 mb-10 group">
          <div className="h-12 w-12 rounded-2xl gradient-primary flex items-center justify-center shadow-soft group-hover:scale-105 transition-transform">
            <Sparkles className="h-6 w-6 text-white" />
          </div>
          <span className="font-serif font-semibold text-2xl text-foreground">VibeVerse</span>
        </Link>

        <Card className="border-0 rounded-3xl shadow-soft bg-card/80 backdrop-blur-sm overflow-hidden">
          <CardHeader className="text-center pb-2 pt-8">
            <CardTitle className="text-3xl font-serif text-card-foreground">Begin your journey</CardTitle>
            <CardDescription className="text-base mt-2">Create your safe space for growth</CardDescription>
          </CardHeader>
          <CardContent className="px-8 pt-6">
            <form onSubmit={handleSubmit} className="space-y-5">
              <Field>
                <FieldLabel htmlFor="username" className="text-sm font-medium">Username</FieldLabel>
                <Input
                  id="username"
                  type="text"
                  placeholder="Choose a username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="rounded-xl h-12 bg-secondary/50 border-border/50 focus-visible:ring-primary/30"
                  disabled={isLoading}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="password" className="text-sm font-medium">Password</FieldLabel>
                <Input
                  id="password"
                  type="password"
                  placeholder="Create a password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="rounded-xl h-12 bg-secondary/50 border-border/50 focus-visible:ring-primary/30"
                  disabled={isLoading}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="confirmPassword" className="text-sm font-medium">Confirm Password</FieldLabel>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Confirm your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="rounded-xl h-12 bg-secondary/50 border-border/50 focus-visible:ring-primary/30"
                  disabled={isLoading}
                />
              </Field>

              {error && (
                <div className="flex items-center gap-2 text-sm text-destructive-foreground bg-destructive/10 p-4 rounded-xl border border-destructive/20">
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {success && (
                <div className="flex items-center gap-2 text-sm text-accent-foreground bg-accent/20 p-4 rounded-xl border border-accent/30">
                  <CheckCircle className="h-4 w-4 flex-shrink-0" />
                  <span>{success}</span>
                </div>
              )}

              <Button type="submit" className="w-full rounded-xl py-6 gradient-primary border-0 text-white shadow-soft hover-lift text-base font-medium" disabled={isLoading}>
                {isLoading ? <Spinner className="h-5 w-5" /> : (
                  <>
                    Create Account
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="justify-center pb-8 pt-4">
            <p className="text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link href="/login" className="text-primary font-medium hover:underline">
                Sign in
              </Link>
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}

export default function RegisterPage() {
  return (
    <AuthProvider>
      <RegisterForm />
    </AuthProvider>
  )
}
