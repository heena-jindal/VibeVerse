"use client"

import { useState, useEffect } from "react"
import { AuthProvider } from "@/lib/auth-context"
import { ProtectedRoute } from "@/components/protected-route"
import { Navbar } from "@/components/navbar"
import { Wind, Sparkles, Grid3x3, RotateCcw, PartyPopper } from "lucide-react"
import { cn } from "@/lib/utils"

// ─────────────────────────────────────────────────────────
// GAME 1: BREATHING
// ─────────────────────────────────────────────────────────
const PHASES = [
  { label: "Breathe In", duration: 4000, scale: "scale-125", grad: "from-violet-200 to-purple-300" },
  { label: "Hold", duration: 4000, scale: "scale-125", grad: "from-amber-100 to-orange-200" },
  { label: "Breathe Out", duration: 4000, scale: "scale-100", grad: "from-emerald-100 to-teal-200" },
  { label: "Hold", duration: 4000, scale: "scale-100", grad: "from-amber-100 to-orange-200" },
]

function BreathingGame() {
  const [active, setActive] = useState(false)
  const [phase, setPhase] = useState(0)

  useEffect(() => {
    if (!active) return
    const timer = setTimeout(() => {
      setPhase((p) => (p + 1) % PHASES.length)
    }, PHASES[phase].duration)
    return () => clearTimeout(timer)
  }, [active, phase])

  const toggle = () => {
    setActive((a) => !a)
    setPhase(0)
  }

  const current = PHASES[phase]

  return (
    <div className="text-center py-4">
      <p className="text-muted-foreground text-sm mb-8 max-w-xs mx-auto">
        Follow the circle. Breathe in as it grows, hold, breathe out as it shrinks.
      </p>

      <div className="flex justify-center mb-6">
        <div
          className={cn(
            "h-40 w-40 rounded-full flex items-center justify-center transition-all duration-[4000ms] ease-in-out bg-gradient-to-br shadow-soft border-4 border-white/60",
            active ? current.scale : "scale-100",
            active ? current.grad : "from-violet-100 to-purple-200"
          )}
        >
          <span className="font-serif font-semibold text-foreground/80 text-base">
            {active ? current.label : "Ready"}
          </span>
        </div>
      </div>

      <div className="flex justify-center gap-2 mb-6">
        {PHASES.map((p, i) => (
          <div
            key={i}
            className={cn(
              "h-2 w-2 rounded-full transition-all",
              active && phase === i ? "bg-primary w-6" : "bg-secondary"
            )}
          />
        ))}
      </div>

      <p className="text-muted-foreground text-sm mb-6 h-5">
        {active ? `${current.label} — 4 seconds` : "Press Start to begin"}
      </p>

      <button
        onClick={toggle}
        className="gradient-primary text-white px-10 py-3 rounded-full font-semibold shadow-soft hover-lift transition-all"
      >
        {active ? "Stop" : "Start Breathing"}
      </button>
    </div>
  )
}

// ─────────────────────────────────────────────────────────
// GAME 2: BUBBLE POP
// ─────────────────────────────────────────────────────────
const WORRIES = [
  "fear of judgment", "what if I fail", "they don't like me",
  "I said something wrong", "social anxiety", "overthinking",
  "fear of rejection", "not fitting in", "being laughed at",
  "saying the wrong thing", "awkward silence", "blushing",
]

const BUBBLE_GRADIENTS = [
  "from-pink-200 to-purple-200",
  "from-blue-200 to-cyan-200",
  "from-green-200 to-emerald-200",
  "from-yellow-100 to-orange-200",
  "from-purple-200 to-pink-200",
  "from-cyan-200 to-blue-200",
  "from-orange-100 to-red-200",
  "from-emerald-100 to-teal-200",
]

function BubbleGame() {
  const [bubbles, setBubbles] = useState<{ id: number; text: string; left: number; top: number; size: number; grad: string }[]>([])
  const [popped, setPopped] = useState<string[]>([])

  const spawn = () => {
    const shuffled = [...WORRIES].sort(() => Math.random() - 0.5).slice(0, 8)
    setBubbles(
      shuffled.map((text, i) => ({
        id: Date.now() + i,
        text,
        left: 5 + Math.random() * 72,
        top: 5 + Math.random() * 70,
        size: 84 + Math.floor(Math.random() * 46),
        grad: BUBBLE_GRADIENTS[i % BUBBLE_GRADIENTS.length],
      }))
    )
    setPopped([])
  }

  useEffect(() => { spawn() }, [])

  const pop = (id: number, text: string) => {
    setBubbles((b) => b.filter((x) => x.id !== id))
    setPopped((p) => [...p, text])
  }

  return (
    <div>
      <p className="text-muted-foreground text-sm mb-4 max-w-sm">
        Each bubble carries a worry. Tap to pop it and let it go.
      </p>

      <div className="flex justify-between items-center mb-3">
        <span className="text-primary font-semibold text-sm">
          Popped: {popped.length} / 8
        </span>
        <button
          onClick={spawn}
          className="text-xs bg-secondary text-secondary-foreground border border-border px-3 py-1.5 rounded-full hover:bg-secondary/80 transition-colors flex items-center gap-1"
        >
          <RotateCcw className="h-3 w-3" /> New Bubbles
        </button>
      </div>

      <div className="relative h-72 rounded-3xl overflow-hidden mb-3 bg-gradient-to-br from-secondary/40 to-accent/10 border border-border/50">
        {bubbles.map((b) => (
          <button
            key={b.id}
            onClick={() => pop(b.id, b.text)}
            className={cn(
              "absolute rounded-full bg-gradient-to-br text-foreground/70 text-[10px] flex items-center justify-center text-center p-2 leading-tight font-medium shadow-soft border border-white/50 hover:scale-110 active:scale-90 transition-transform animate-float",
              b.grad
            )}
            style={{
              left: `${b.left}%`,
              top: `${b.top}%`,
              width: b.size,
              height: b.size,
              animationDelay: `${(b.id % 4) * 0.5}s`,
            }}
          >
            {b.text}
          </button>
        ))}
        {bubbles.length === 0 && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-center">
            <PartyPopper className="h-8 w-8 text-primary" />
            <p className="text-muted-foreground text-sm">
              All worries released! Tap "New Bubbles" to go again.
            </p>
          </div>
        )}
      </div>

      {popped.length > 0 && (
        <div className="bg-secondary/50 rounded-2xl p-3 border border-border/50">
          <p className="text-xs text-muted-foreground mb-2">Worries released:</p>
          <div className="flex flex-wrap gap-1.5">
            {popped.map((w, i) => (
              <span
                key={i}
                className="text-xs bg-card text-foreground/70 px-2.5 py-1 rounded-full border border-border/50"
              >
                ✓ {w}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────
// GAME 3: MEMORY MATCH
// ─────────────────────────────────────────────────────────
const EMOJIS = ["🌸", "🌟", "🦋", "🌈", "🍀", "☀️", "🌙", "🎵"]

function MemoryGame() {
  const [cards, setCards] = useState<{ id: number; emoji: string }[]>([])
  const [flipped, setFlipped] = useState<number[]>([])
  const [matched, setMatched] = useState<number[]>([])
  const [moves, setMoves] = useState(0)
  const [locked, setLocked] = useState(false)

  const shuffle = () => {
    const deck = [...EMOJIS, ...EMOJIS]
      .map((emoji) => ({ emoji, sort: Math.random() }))
      .sort((a, b) => a.sort - b.sort)
      .map((item, id) => ({ id, emoji: item.emoji }))

    setCards(deck)
    setFlipped([])
    setMatched([])
    setMoves(0)
    setLocked(false)
  }

  useEffect(() => { shuffle() }, [])

  const handleFlip = (id: number) => {
    if (locked) return
    if (flipped.includes(id) || matched.includes(id)) return
    if (flipped.length === 2) return

    const next = [...flipped, id]
    setFlipped(next)

    if (next.length === 2) {
      setMoves((m) => m + 1)
      const [a, b] = next
      if (cards[a].emoji === cards[b].emoji) {
        setMatched((m) => [...m, a, b])
        setFlipped([])
      } else {
        setLocked(true)
        setTimeout(() => {
          setFlipped([])
          setLocked(false)
        }, 800)
      }
    }
  }

  const won = cards.length > 0 && matched.length === cards.length

  return (
    <div>
      <p className="text-muted-foreground text-sm mb-4 max-w-sm">
        Find all matching pairs. Focus on the cards and let your mind settle.
      </p>

      <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
        <span className="text-primary font-semibold text-sm">Moves: {moves}</span>
        <span className="text-emerald-600 font-semibold text-sm">
          Matches: {matched.length / 2} / {EMOJIS.length}
        </span>
        <button
          onClick={shuffle}
          className="text-xs bg-secondary text-secondary-foreground border border-border px-3 py-1.5 rounded-full hover:bg-secondary/80 transition-colors flex items-center gap-1"
        >
          <RotateCcw className="h-3 w-3" /> Restart
        </button>
      </div>

      <div className="grid grid-cols-4 gap-2 sm:gap-3 mb-4">
        {cards.map((card) => {
          const isUp = flipped.includes(card.id) || matched.includes(card.id)
          const isMatched = matched.includes(card.id)
          return (
            <button
              key={card.id}
              onClick={() => handleFlip(card.id)}
              className="aspect-square"
              style={{ perspective: "600px" }}
            >
              <div
                className="relative w-full h-full transition-transform duration-300 rounded-2xl"
                style={{
                  transformStyle: "preserve-3d",
                  transform: isUp ? "rotateY(180deg)" : "rotateY(0deg)",
                }}
              >
                {/* Front (hidden) */}
                <div
                  className="absolute inset-0 rounded-2xl gradient-primary flex items-center justify-center text-white text-xl font-bold shadow-soft"
                  style={{ backfaceVisibility: "hidden" }}
                >
                  ?
                </div>
                {/* Back (emoji) */}
                <div
                  className={cn(
                    "absolute inset-0 rounded-2xl flex items-center justify-center text-2xl sm:text-3xl border-2 shadow-soft",
                    isMatched
                      ? "bg-emerald-100 border-emerald-300"
                      : "bg-card border-border"
                  )}
                  style={{
                    backfaceVisibility: "hidden",
                    transform: "rotateY(180deg)",
                  }}
                >
                  {card.emoji}
                </div>
              </div>
            </button>
          )
        })}
      </div>

      {won && (
        <div className="bg-emerald-50 text-emerald-700 rounded-2xl p-4 text-center font-medium border border-emerald-200 animate-fade-up flex items-center justify-center gap-2">
          <PartyPopper className="h-5 w-5" />
          You found all pairs! Your mind is sharp and calm.
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────────────────
const TABS = [
  { id: "breathing", label: "Breathing", icon: Wind },
  { id: "bubbles", label: "Bubble Pop", icon: Sparkles },
  { id: "memory", label: "Memory Match", icon: Grid3x3 },
]

function GamesContent() {
  const [tab, setTab] = useState("breathing")

  return (
    <div className="min-h-screen bg-background flex flex-col relative">
      <div className="decorative-blur w-[300px] h-[300px] bg-primary/20 -top-20 -right-20 fixed" />
      <div className="decorative-blur w-[250px] h-[250px] bg-accent/20 bottom-20 -left-20 fixed" />

      <Navbar variant="protected" />

      <div className="container mx-auto max-w-2xl px-4 py-8 relative z-10 flex-1">
        <div className="text-center mb-8 animate-fade-up">
          <h1 className="font-serif text-3xl font-semibold text-foreground mb-2">
            Mind Calming Games
          </h1>
          <p className="text-muted-foreground text-sm">
            Take a moment to breathe, play, and relax
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 flex-wrap justify-center">
          {TABS.map((t) => {
            const Icon = t.icon
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={cn(
                  "px-5 py-2.5 rounded-full text-sm font-medium transition-all flex items-center gap-2 shadow-soft",
                  tab === t.id
                    ? "gradient-primary text-white"
                    : "bg-card text-foreground/70 border border-border hover:bg-secondary"
                )}
              >
                <Icon className="h-4 w-4" />
                {t.label}
              </button>
            )
          })}
        </div>

        {/* Game panel */}
        <div className="bg-card rounded-3xl p-6 sm:p-8 border border-border/50 shadow-soft animate-fade-up">
          {tab === "breathing" && <BreathingGame />}
          {tab === "bubbles" && <BubbleGame />}
          {tab === "memory" && <MemoryGame />}
        </div>
      </div>
    </div>
  )
}

export default function GamesPage() {
  return (
    <AuthProvider>
      <ProtectedRoute>
        <GamesContent />
      </ProtectedRoute>
    </AuthProvider>
  )
}