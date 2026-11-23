"use client"

import { useState, useEffect, useCallback } from "react"
import { Navbar } from "@/components/navbar"
import { ProtectedRoute } from "@/components/protected-route"
import { AuthProvider } from "@/lib/auth-context"
import { X, CheckCircle, AlertCircle, Pencil } from "lucide-react"
import { cn } from "@/lib/utils"

interface JournalEntry {
  id: number
  content: string
  mood_tag: string
  timestamp: string
}

const moodTags = [
  { label: "Reflective", emoji: "💭", gradient: "from-violet-500 to-purple-600" },
  { label: "Happy",      emoji: "😄", gradient: "from-yellow-400 to-orange-500" },
  { label: "Nervous",    emoji: "😬", gradient: "from-amber-400 to-amber-600" },
  { label: "Sad",        emoji: "😢", gradient: "from-blue-400 to-blue-600" },
  { label: "Proud",      emoji: "🏆", gradient: "from-emerald-400 to-teal-600" },
  { label: "Confused",   emoji: "🤔", gradient: "from-rose-400 to-pink-600" },
]

const moodTagBg: Record<string, string> = {
  Reflective: "bg-violet-100/80 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300",
  Happy:      "bg-yellow-100/80 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300",
  Nervous:    "bg-amber-100/80  text-amber-700  dark:bg-amber-900/40  dark:text-amber-300",
  Sad:        "bg-blue-100/80   text-blue-700   dark:bg-blue-900/40   dark:text-blue-300",
  Proud:      "bg-emerald-100/80 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
  Confused:   "bg-rose-100/80   text-rose-700   dark:bg-rose-900/40   dark:text-rose-300",
}

function JournalContent() {
  const [entries, setEntries]         = useState<JournalEntry[]>([])
  const [content, setContent]         = useState("")
  const [selectedMood, setSelectedMood] = useState<string>("")
  const [isLoading, setIsLoading]     = useState(true)
  const [isSaving, setIsSaving]       = useState(false)
  const [message, setMessage]         = useState<{ type: "success" | "error"; text: string } | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null)

  const MAX_CHARS = 2000
  const charPct   = (content.length / MAX_CHARS) * 100
  const charColor = content.length > 1800 ? "text-rose-500" : content.length > 1400 ? "text-amber-500" : "text-muted-foreground"

  const fetchEntries = useCallback(async () => {
    try {
      const res  = await fetch(`/api/journal`, { credentials: "include" })
      const data = await res.json()
      setEntries(data.entries || [])
    } catch {
      setEntries([
        { id: 1, content: "Today I managed to speak up in class for the first time. It was terrifying, but I did it!", mood_tag: "Proud",      timestamp: new Date(Date.now() - 86400000).toISOString() },
        { id: 2, content: "Had lunch alone but it wasn't so bad — brought a book and actually enjoyed the quiet time.",  mood_tag: "Reflective", timestamp: new Date(Date.now() - 172800000).toISOString() },
      ])
    }
    setIsLoading(false)
  }, [])

  useEffect(() => { fetchEntries() }, [fetchEntries])

  const saveEntry = async () => {
    if (!content.trim() || !selectedMood) {
      setMessage({ type: "error", text: "Pick a mood tag and write something first ✍️" })
      setTimeout(() => setMessage(null), 3000)
      return
    }
    setIsSaving(true); setMessage(null)
    try {
      const res  = await fetch(`/api/journal`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ content, mood_tag: selectedMood }),
      })
      const data = await res.json()
      if (data.success) {
        setMessage({ type: "success", text: "Entry saved ✨" })
        setContent(""); setSelectedMood("")
        fetchEntries()
      } else {
        setMessage({ type: "error", text: data.message || "Failed to save" })
      }
    } catch {
      const newEntry: JournalEntry = { id: Date.now(), content, mood_tag: selectedMood, timestamp: new Date().toISOString() }
      setEntries((prev) => [newEntry, ...prev])
      setMessage({ type: "success", text: "Saved! (demo mode)" })
      setContent(""); setSelectedMood("")
    }
    setIsSaving(false)
    setTimeout(() => setMessage(null), 3000)
  }

  const deleteEntry = async (id: number) => {
    try { await fetch(`/api/journal/${id}`, { method: "DELETE", credentials: "include" }) } catch {}
    setEntries((prev) => prev.filter((e) => e.id !== id))
    setDeleteConfirm(null)
  }

  const formatDate = (ts: string) =>
    new Date(ts).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-full gradient-primary animate-pulse" />
          <p className="text-sm text-muted-foreground">Loading your journal...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <div className="decorative-blur w-[400px] h-[400px] bg-primary/15 -top-32 -right-32 fixed" />
      <div className="decorative-blur w-[300px] h-[300px] bg-accent/15 bottom-20 -left-20 fixed" />

      <Navbar variant="protected" />

      <div className="relative z-10 container mx-auto max-w-2xl px-4 py-10">

        {/* Header */}
        <div className="flex items-center gap-4 mb-8 animate-fade-up">
          <div className="h-14 w-14 rounded-2xl gradient-primary flex items-center justify-center shadow-soft">
            <Pencil className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">My Journal</h1>
            <p className="text-sm text-muted-foreground">{entries.length} {entries.length === 1 ? "entry" : "entries"} · your safe space ✨</p>
          </div>
        </div>

        {/* Write card */}
        <div className="glass rounded-3xl p-6 border border-border/40 shadow-soft mb-8 animate-fade-up" style={{ animationDelay: "0.1s" }}>
          <h2 className="text-base font-semibold text-foreground mb-4">How are you feeling today?</h2>

          {/* Mood pills */}
          <div className="flex flex-wrap gap-2 mb-5">
            {moodTags.map((m) => {
              const isActive = selectedMood === m.label
              return (
                <button
                  key={m.label}
                  onClick={() => setSelectedMood(m.label)}
                  className={cn(
                    "flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold transition-all duration-300",
                    isActive
                      ? `bg-gradient-to-r ${m.gradient} text-white shadow-soft scale-105`
                      : "glass border border-border/50 text-foreground/70 hover:scale-105 hover:text-foreground"
                  )}
                >
                  <span>{m.emoji}</span>
                  <span>{m.label}</span>
                </button>
              )
            })}
          </div>

          {/* Textarea */}
          <textarea
            id="journal-textarea"
            value={content}
            onChange={(e) => setContent(e.target.value.slice(0, MAX_CHARS))}
            onKeyDown={(e) => { if (e.key === "Enter" && e.ctrlKey) { e.preventDefault(); saveEntry() } }}
            placeholder="Write about your day, your feelings, or anything on your mind..."
            className="w-full min-h-[140px] p-4 rounded-2xl bg-background/60 border border-border/50 text-foreground placeholder:text-muted-foreground/50 text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none transition-all"
          />

          {/* Progress bar + footer */}
          <div className="mt-3 space-y-3">
            <div className="w-full h-1 bg-secondary rounded-full overflow-hidden">
              <div
                className={cn("h-full rounded-full transition-all duration-300", charPct > 90 ? "bg-rose-500" : charPct > 70 ? "bg-amber-500" : "gradient-primary")}
                style={{ width: `${charPct}%` }}
              />
            </div>
            <div className="flex items-center justify-between">
              <span className={cn("text-xs", charColor)}>{content.length}/{MAX_CHARS}</span>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground/60 hidden sm:inline">Ctrl+Enter to save</span>
                <button
                  id="save-journal-btn"
                  onClick={saveEntry}
                  disabled={isSaving}
                  className="gradient-primary text-white text-sm font-semibold px-5 py-2.5 rounded-full shadow-soft hover-lift disabled:opacity-50 transition-all"
                >
                  {isSaving ? "Saving..." : "Save Entry ✨"}
                </button>
              </div>
            </div>
          </div>

          {/* Toast */}
          {message && (
            <div className={cn(
              "flex items-center gap-2 p-3 rounded-2xl text-sm mt-3 animate-scale-in",
              message.type === "success" ? "bg-accent/10 text-accent border border-accent/20" : "bg-destructive/10 text-destructive border border-destructive/20"
            )}>
              {message.type === "success" ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
              {message.text}
            </div>
          )}
        </div>

        {/* Past entries */}
        <div>
          <h2 className="text-lg font-bold text-foreground mb-4">Past Entries</h2>
          {entries.length === 0 ? (
            <div className="glass rounded-3xl p-10 text-center border border-border/40">
              <p className="text-4xl mb-3">📖</p>
              <p className="text-muted-foreground text-sm">No entries yet. Start writing above!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {entries.map((entry, i) => (
                <div
                  key={entry.id}
                  className={cn(
                    "glass rounded-2xl p-5 border border-border/40 shadow-soft animate-fade-up transition-all",
                    deleteConfirm === entry.id && "opacity-50 scale-95"
                  )}
                  style={{ animationDelay: `${i * 60}ms` }}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={cn("text-xs font-semibold px-3 py-1 rounded-full", moodTagBg[entry.mood_tag] ?? "bg-secondary text-secondary-foreground")}>
                        {moodTags.find(m => m.label === entry.mood_tag)?.emoji} {entry.mood_tag}
                      </span>
                      <span className="text-xs text-muted-foreground">{formatDate(entry.timestamp)}</span>
                    </div>
                    {deleteConfirm === entry.id ? (
                      <div className="flex gap-2">
                        <button onClick={() => deleteEntry(entry.id)} className="text-xs text-destructive font-semibold border border-destructive/40 px-3 py-1 rounded-full hover:bg-destructive/10 transition-colors">Delete</button>
                        <button onClick={() => setDeleteConfirm(null)} className="text-xs text-muted-foreground border border-border px-3 py-1 rounded-full hover:bg-secondary transition-colors">Cancel</button>
                      </div>
                    ) : (
                      <button onClick={() => setDeleteConfirm(entry.id)} className="p-1.5 rounded-xl hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors">
                        <X className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                  <p className="text-sm text-foreground/90 leading-relaxed whitespace-pre-wrap">{entry.content}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function JournalPage() {
  return (
    <AuthProvider>
      <ProtectedRoute>
        <JournalContent />
      </ProtectedRoute>
    </AuthProvider>
  )
}
