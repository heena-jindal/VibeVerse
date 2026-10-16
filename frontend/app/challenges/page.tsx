"use client"

import { useState, useEffect } from "react"
import { Navbar } from "@/components/navbar"
import { ProtectedRoute } from "@/components/protected-route"
import { AuthProvider } from "@/lib/auth-context"
import { Flame, CheckCircle, Target, Star, Sparkles, Zap } from "lucide-react"
import { cn } from "@/lib/utils"

interface Challenge {
  id: number
  title: string
  description: string
  difficulty: "easy" | "medium" | "hard"
  category: string
  completed: boolean
}

const difficultyConfig = {
  easy:   { label: "Easy",   color: "from-emerald-400 to-teal-500",   bg: "bg-emerald-100/80 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300" },
  medium: { label: "Medium", color: "from-amber-400 to-orange-500",   bg: "bg-amber-100/80 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300" },
  hard:   { label: "Hard",   color: "from-rose-400 to-pink-600",      bg: "bg-rose-100/80 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300" },
}

const vibes = [
  "Every small step counts! 🌱",
  "You're building confidence! 💪",
  "Growth lives outside comfort zones! 🚀",
  "Be proud of your progress! 🏆",
  "One day at a time! ✨",
  "You've got this! 🔥",
]

/* ── Confetti burst component ───────────────── */
function ConfettiBurst() {
  const particles = Array.from({ length: 18 }, (_, i) => i)
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-3xl">
      {particles.map((i) => (
        <div
          key={i}
          className="absolute w-2 h-2 rounded-full animate-ping"
          style={{
            left:            `${10 + (i * 5) % 80}%`,
            top:             `${15 + (i * 7) % 60}%`,
            backgroundColor: ["#8b7ec8","#a8d5ba","#e8a5a5","#f6c358","#7bc49a"][i % 5],
            animationDelay:  `${(i * 60) % 500}ms`,
            animationDuration:"0.8s",
          }}
        />
      ))}
    </div>
  )
}

function ChallengesContent() {
  const [challenge, setChallenge]     = useState<Challenge | null>(null)
  const [streak, setStreak]           = useState(0)
  const [isLoading, setIsLoading]     = useState(true)
  const [isCompleting, setIsCompleting] = useState(false)
  const [showCelebration, setShowCelebration] = useState(false)

  const vibe = vibes[streak % vibes.length]

  useEffect(() => { fetchChallenge() }, [])

  const fetchChallenge = async () => {
    try {
      const res  = await fetch(`/api/challenge/today`, { credentials: "include" })
      const data = await res.json()
      setChallenge(data.challenge)
      setStreak(data.streak || 0)
    } catch {
      setChallenge({
        id: 1,
        title: "Say Hello to Someone New",
        description: "Today, try saying hello or giving a friendly nod to someone you don't usually talk to. It could be a classmate, someone in line, or a neighbor. A simple greeting can be the start of a connection!",
        difficulty: "easy",
        category: "Social Interaction",
        completed: false,
      })
      setStreak(3)
    }
    setIsLoading(false)
  }

  const completeChallenge = async () => {
    if (!challenge) return
    setIsCompleting(true)

    try {
      const res  = await fetch(`/api/challenge/complete`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body:    JSON.stringify({ daily_id: challenge.id }),
      })
      const data = await res.json()
      if (data.success) {
        triggerCelebration(data.streak)
      }
    } catch {
      triggerCelebration(streak + 1)
    }

    setIsCompleting(false)
  }

  const triggerCelebration = (newStreak: number) => {
    setShowCelebration(true)
    setTimeout(() => {
      setStreak(newStreak)
      setChallenge((c) => c ? { ...c, completed: true } : c)
      setShowCelebration(false)
    }, 900)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-2xl gradient-primary animate-pulse" />
          <p className="text-sm text-muted-foreground">Loading your challenge...</p>
        </div>
      </div>
    )
  }

  const diff = challenge ? difficultyConfig[challenge.difficulty] : null

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Ambient */}
      <div className="decorative-blur w-[450px] h-[450px] bg-primary/15 -top-36 -right-36 fixed" />
      <div className="decorative-blur w-[320px] h-[320px] bg-accent/15 bottom-24 -left-20 fixed" />

      <Navbar variant="protected" />

      <div className="relative z-10 container mx-auto max-w-2xl px-4 py-10 space-y-6">

        {/* ── Streak banner ── */}
        <div className="relative gradient-primary rounded-3xl p-7 text-white overflow-hidden shadow-soft animate-fade-up">
          {showCelebration && <ConfettiBurst />}
          {/* Decorative rings */}
          <div className="absolute -top-12 -right-12 w-40 h-40 rounded-full bg-white/10" />
          <div className="absolute -bottom-8 -left-8  w-28 h-28 rounded-full bg-white/10" />

          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-5">
              <div className={cn(
                "h-20 w-20 rounded-2xl bg-white/20 flex items-center justify-center transition-all duration-500",
                showCelebration && "scale-125 rotate-12"
              )}>
                <Flame className={cn("h-10 w-10 transition-all", showCelebration && "text-yellow-300")} />
              </div>
              <div>
                <div className={cn(
                  "text-6xl font-bold leading-none transition-all duration-500",
                  showCelebration && "scale-110 text-yellow-300"
                )}>
                  {streak}
                </div>
                <div className="text-sm opacity-80 font-medium mt-1">day streak 🔥</div>
              </div>
            </div>

            <div className="text-right max-w-[170px]">
              <div className="flex gap-1 mb-2 justify-end">
                {[...Array(Math.min(streak, 5))].map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-current text-yellow-300" />
                ))}
              </div>
              <p className="text-sm opacity-90 leading-snug">{vibe}</p>
            </div>
          </div>
        </div>

        {/* ── Challenge card ── */}
        {challenge && (
          <div className="glass rounded-3xl border border-border/40 shadow-soft overflow-hidden animate-fade-up" style={{ animationDelay: "0.1s" }}>
            {/* Card header accent */}
            <div className={cn("h-1.5 w-full bg-gradient-to-r", diff?.color)} />

            <div className="p-7 space-y-5">
              {/* Tags */}
              <div className="flex items-center gap-2 flex-wrap">
                <div className="h-8 w-8 rounded-xl gradient-accent flex items-center justify-center">
                  <Target className="h-4 w-4 text-white" />
                </div>
                <span className="text-xs font-bold uppercase tracking-widest text-primary">Today&apos;s Challenge</span>
              </div>

              <div className="flex flex-wrap gap-2">
                {diff && (
                  <span className={cn("text-xs px-4 py-1.5 rounded-full font-semibold", diff.bg)}>
                    {diff.label}
                  </span>
                )}
                <span className="text-xs px-4 py-1.5 rounded-full font-semibold bg-secondary/60 text-secondary-foreground">
                  {challenge.category}
                </span>
              </div>

              <h2 className="text-2xl font-bold text-foreground leading-snug">{challenge.title}</h2>
              <p className="text-muted-foreground leading-relaxed text-sm">{challenge.description}</p>

              {/* Action */}
              {challenge.completed ? (
                <div className="flex items-center gap-4 p-5 bg-accent/10 border border-accent/20 rounded-2xl animate-scale-in">
                  <div className="h-12 w-12 rounded-xl bg-accent/20 flex items-center justify-center flex-shrink-0">
                    <CheckCircle className="h-6 w-6 text-accent" />
                  </div>
                  <div>
                    <p className="font-bold text-accent">Challenge Completed! 🎉</p>
                    <p className="text-sm text-muted-foreground mt-0.5">Amazing work! Come back tomorrow for a new one.</p>
                  </div>
                </div>
              ) : (
                <button
                  id="complete-challenge-btn"
                  onClick={completeChallenge}
                  disabled={isCompleting || showCelebration}
                  className="w-full gradient-primary text-white font-bold py-4 rounded-2xl shadow-soft hover-lift transition-all disabled:opacity-60 flex items-center justify-center gap-2 text-base"
                >
                  {isCompleting || showCelebration ? (
                    <><Zap className="h-5 w-5 animate-bounce" /> Completing...</>
                  ) : (
                    <><Sparkles className="h-5 w-5" /> Mark as Complete</>
                  )}
                </button>
              )}
            </div>
          </div>
        )}

        {/* Footer tip */}
        <p className="text-center text-xs text-muted-foreground animate-fade-up" style={{ animationDelay: "0.2s" }}>
          Progress over perfection. Every attempt counts! 💜
        </p>
      </div>
    </div>
  )
}

export default function ChallengesPage() {
  return (
    <AuthProvider>
      <ProtectedRoute>
        <ChallengesContent />
      </ProtectedRoute>
    </AuthProvider>
  )
}
