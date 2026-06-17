"use client"

import { useState, useRef, useEffect } from "react"
 import { Navbar } from "@/components/navbar"
import { ProtectedRoute } from "@/components/protected-route"
import { AuthProvider } from "@/lib/auth-context"
import { Send, Bot, User, Sparkles, Zap } from "lucide-react"
import { cn } from "@/lib/utils"

interface Message {
  id: number
  type: "user" | "bot"
  content: string
  mood?: string
}

const situations = [
  { label: "In Class",       value: "in_class",       icon: "📚" },
  { label: "Canteen",        value: "canteen",         icon: "🍽️" },
  { label: "First Day",      value: "first_day",       icon: "🌟" },
  { label: "Group Project",  value: "group_project",   icon: "👥" },
  { label: "Presentation",   value: "presentation",    icon: "🎤" },
]

const moodConfig: Record<string, { emoji: string; color: string }> = {
  "very anxious": { emoji: "😰", color: "text-rose-400" },
  anxious:        { emoji: "😟", color: "text-rose-400" },
  nervous:        { emoji: "😬", color: "text-amber-400" },
  confused:       { emoji: "🤔", color: "text-blue-400" },
  okay:           { emoji: "🙂", color: "text-violet-400" },
  confident:      { emoji: "😎", color: "text-emerald-400" },
}

function MoodBadge({ mood }: { mood: string }) {
  const cfg = moodConfig[mood.toLowerCase()] ?? { emoji: "✨", color: "text-primary" }
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-semibold bg-secondary/60 backdrop-blur-sm px-3 py-1 rounded-full border border-border/40">
      <span>{cfg.emoji}</span>
      <span className={cfg.color}>{mood}</span>
    </span>
  )
}

function ChatContent() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 0,
      type: "bot",
      content: "Hey! 👋 I&apos;m here for you. Pick where you are right now, then tell me what&apos;s on your mind — no judgment, just vibes.",
    },
  ])
  const [input, setInput]           = useState("")
  const [situation, setSituation]   = useState("in_class")
  const [isTyping, setIsTyping]     = useState(false)
  const messagesEndRef              = useRef<HTMLDivElement>(null)

  const scrollToBottom = () =>
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })

  useEffect(() => { scrollToBottom() }, [messages, isTyping])

  const sendMessage = async () => {
    if (!input.trim()) return
    const userMessage: Message = { id: Date.now(), type: "user", content: input.trim() }
    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setIsTyping(true)

    try {
      const res = await fetch(`/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ message: userMessage.content, situation }),
      })
      const data = await res.json()
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          type: "bot",
          content: data.reply || data.suggestion || "I hear you 💙",
          mood: data.mood,
        },
      ])
    } catch {
      const demos: Record<string, string> = {
        in_class:      "It&apos;s totally normal to feel off in class sometimes. Try focusing on taking notes — it gives your hands something to do and keeps your mind grounded. Most people are too busy worrying about themselves to notice you 💙",
        canteen:       "Cafeterias can be overwhelming fr. Try sitting near the edges where it&apos;s quieter, or bring earbuds. You don&apos;t need to be social every single day.",
        first_day:     "First days hit different 😅 But remember — literally everyone is nervous. A simple smile goes a long way. You don&apos;t have to be perfect, just real.",
        group_project: "Group projects are hard when you&apos;re introverted. Try contributing through research or writing first — you can ease into speaking up over time.",
        presentation:  "Presentations are scary but prep is everything. Breathe deep, find one friendly face in the crowd, and remember — people are rooting for you not against you 🙌",
      }
      setMessages((prev) => [
        ...prev,
        { id: Date.now() + 1, type: "bot", content: demos[situation] ?? "I hear you. Tell me more 💙", mood: "okay" },
      ])
    }
    setIsTyping(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage() }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col relative overflow-hidden">
      {/* Ambient blobs */}
      <div className="decorative-blur w-[350px] h-[350px] bg-primary/15 -top-24 -right-24 fixed" />
      <div className="decorative-blur w-[280px] h-[280px] bg-accent/15 bottom-24 -left-16 fixed" />

      <Navbar variant="protected" />

      {/* Situation bar */}
      <div className="glass border-b border-border/40 px-4 py-3 relative z-10">
        <div className="container mx-auto max-w-3xl">
          <p className="text-xs text-muted-foreground mb-2.5 font-semibold uppercase tracking-widest">Where are you rn?</p>
          <div className="flex flex-wrap gap-2">
            {situations.map((s) => (
              <button
                key={s.value}
                id={`situation-${s.value}`}
                onClick={() => setSituation(s.value)}
                className={cn(
                  "flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold transition-all duration-300",
                  situation === s.value
                    ? "gradient-primary text-white shadow-soft scale-105"
                    : "glass text-foreground/70 border border-border/50 hover:scale-105 hover:text-foreground"
                )}
              >
                <span>{s.icon}</span>
                <span>{s.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-8 relative z-10">
        <div className="container mx-auto max-w-3xl space-y-5">
          {messages.map((msg, i) => (
            <div
              key={msg.id}
              className={cn("flex gap-3 animate-fade-up", msg.type === "user" ? "justify-end" : "justify-start")}
              style={{ animationDelay: `${i * 40}ms` }}
            >
              {msg.type === "bot" && (
                <div className="h-9 w-9 rounded-2xl gradient-primary flex items-center justify-center flex-shrink-0 shadow-soft mt-1">
                  <Bot className="h-4 w-4 text-white" />
                </div>
              )}

              <div className={cn("max-w-[76%] flex flex-col gap-1.5", msg.type === "user" ? "items-end" : "items-start")}>
                {msg.mood && msg.type === "bot" && <MoodBadge mood={msg.mood} />}
                <div
                  className={cn(
                    "px-5 py-3.5 text-sm leading-relaxed",
                    msg.type === "user"
                      ? "gradient-primary text-white rounded-3xl rounded-br-sm shadow-soft"
                      : "glass border border-border/40 text-foreground rounded-3xl rounded-bl-sm shadow-soft"
                  )}
                >
                  {msg.content}
                </div>
              </div>

              {msg.type === "user" && (
                <div className="h-9 w-9 rounded-2xl bg-secondary flex items-center justify-center flex-shrink-0 shadow-soft mt-1">
                  <User className="h-4 w-4 text-secondary-foreground" />
                </div>
              )}
            </div>
          ))}

          {/* Typing indicator */}
          {isTyping && (
            <div className="flex gap-3 justify-start animate-fade-up">
              <div className="h-9 w-9 rounded-2xl gradient-primary flex items-center justify-center flex-shrink-0 shadow-soft mt-1">
                <Bot className="h-4 w-4 text-white" />
              </div>
              <div className="glass border border-border/40 px-5 py-3.5 rounded-3xl rounded-bl-sm shadow-soft">
                <div className="flex gap-1.5 items-center h-5">
                  <span className="w-2 h-2 bg-primary/70 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="w-2 h-2 bg-primary/70 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="w-2 h-2 bg-primary/70 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input bar */}
      <div className="glass border-t border-border/40 p-4 relative z-10">
        <div className="container mx-auto max-w-3xl">
          <div className="flex gap-3 items-center">
            <div className="flex-1 relative">
              <input
                id="chat-input"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Share what&apos;s on your mind..."
                disabled={isTyping}
                className="w-full rounded-full px-5 py-3.5 bg-card border border-border/50 text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
              />
            </div>
            <button
              id="chat-send"
              onClick={sendMessage}
              disabled={!input.trim() || isTyping}
              className="h-12 w-12 rounded-full gradient-primary flex items-center justify-center shadow-soft hover-lift disabled:opacity-40 disabled:cursor-not-allowed transition-all flex-shrink-0"
            >
              <Send className="h-4 w-4 text-white" />
            </button>
          </div>
          <p className="text-center text-[11px] text-muted-foreground/50 mt-2">Press Enter to send · This is a safe space 💜</p>
        </div>
      </div>
    </div>
  )
}

export default function ChatPage() {
  return (
    <AuthProvider>
      <ProtectedRoute>
        <ChatContent />
      </ProtectedRoute>
    </AuthProvider>
  )
}
