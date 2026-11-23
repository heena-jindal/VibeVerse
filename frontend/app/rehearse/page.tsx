"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { Navbar } from "@/components/navbar"
import { ProtectedRoute } from "@/components/protected-route"
import { AuthProvider } from "@/lib/auth-context"
import {
  Mic, MicOff, Volume2, VolumeX, Send, Sparkles, CheckCircle2,
  Lightbulb, Quote, ArrowRight, RotateCcw, AlertCircle, ShieldAlert,
  Flame, Sliders, Play, Award, ChevronRight
} from "lucide-react"
import { cn } from "@/lib/utils"

interface ScenarioConfig {
  id: string
  title: string
  icon: string
  persona: string
  context: string
  starterLine: string
}

const SCENARIOS: ScenarioConfig[] = [
  {
    id: "canteen_order",
    title: "Ordering at the Canteen",
    icon: "🍔",
    persona: "Canteen Cashier",
    context: "Standing at the busy counter during lunch rush.",
    starterLine: "Hey! What can I get for you today?",
  },
  {
    id: "ask_professor",
    title: "Asking Professor a Question",
    icon: "🎓",
    persona: "Professor after Lecture",
    context: "Approaching the professor at their desk with a doubt.",
    starterLine: "Yes? Did you have a question about today's lecture?",
  },
  {
    id: "group_project",
    title: "Speaking Up in Group Project",
    icon: "👥",
    persona: "Project Teammate",
    context: "Team meeting deciding project topic & slide division.",
    starterLine: "Okay, we need to finalize our project topic today. Anyone have an idea?",
  },
  {
    id: "introduce_self",
    title: "Introducing Yourself to Classmate",
    icon: "👋",
    persona: "Peer Sitting Nearby",
    context: "Sitting next to someone new before class begins.",
    starterLine: "Hey there.",
  },
  {
    id: "presentation_qa",
    title: "Presentation Q&A",
    icon: "🎤",
    persona: "Audience Member",
    context: "Answering an unexpected question after your presentation.",
    starterLine: "Good talk! I had a quick question about your slide on page 3.",
  },
]

const DIFFICULTIES = [
  {
    id: "gentle",
    label: "Gentle",
    badge: "Patient & Warm",
    color: "from-emerald-500 to-teal-500",
    bg: "bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400",
  },
  {
    id: "realistic",
    label: "Realistic",
    badge: "Everyday College Life",
    color: "from-blue-500 to-indigo-500",
    bg: "bg-blue-500/10 border-blue-500/30 text-blue-600 dark:text-blue-400",
  },
  {
    id: "tough",
    label: "Tough",
    badge: "Fast-Paced & Direct",
    color: "from-amber-500 to-rose-500",
    bg: "bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400",
  },
]

interface ChatTurn {
  id: string
  role: "user" | "assistant"
  content: string
  tone?: string
}

interface FeedbackResult {
  what_went_well: string
  one_tip: string
  better_opening_line: string
}

function getAnxietyDescriptor(val: number) {
  if (val <= 2) return { text: "Barely nervous (Breeze)", color: "text-emerald-500" }
  if (val <= 4) return { text: "Mild butterflies (Manageable)", color: "text-teal-500" }
  if (val <= 6) return { text: "Noticeably anxious (Sweaty palms)", color: "text-amber-500" }
  if (val <= 8) return { text: "High anxiety (Heart pounding)", color: "text-orange-500" }
  return { text: "Extreme fear (Fight or flight)", color: "text-rose-500" }
}

function RehearseContent() {
  // Wizard Stages: "setup" | "rehearsal" | "reality_rating" | "feedback"
  const [stage, setStage] = useState<"setup" | "rehearsal" | "reality_rating" | "feedback">("setup")

  // Setup state
  const [selectedScenario, setSelectedScenario] = useState<string>("canteen_order")
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>("realistic")
  const [predictedScore, setPredictedScore] = useState<number>(7)
  const [realityScore, setRealityScore] = useState<number>(4)

  // Dialogue state
  const [messages, setMessages] = useState<ChatTurn[]>([])
  const [input, setInput] = useState("")
  const [isSending, setIsSending] = useState(false)
  const [crisisAlert, setCrisisAlert] = useState<string | null>(null)

  // Feedback state
  const [feedback, setFeedback] = useState<FeedbackResult | null>(null)
  const [isLoadingFeedback, setIsLoadingFeedback] = useState(false)

  // Voice states (STT and TTS)
  const [isListening, setIsListening] = useState(false)
  const [voiceEnabled, setVoiceEnabled] = useState(true)
  const [speechSupported, setSpeechSupported] = useState(true)
  const recognitionRef = useRef<any>(null)
  const chatEndRef = useRef<HTMLDivElement>(null)

  const activeScenario = SCENARIOS.find((s) => s.id === selectedScenario) || SCENARIOS[0]
  const activeDifficulty = DIFFICULTIES.find((d) => d.id === selectedDifficulty) || DIFFICULTIES[1]

  // Auto scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, isSending])

  // Initialize Speech Recognition if supported
  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
      if (SpeechRecognition) {
        const reco = new SpeechRecognition()
        reco.continuous = false
        reco.interimResults = false
        reco.lang = "en-US"

        reco.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript
          setInput((prev) => (prev ? `${prev} ${transcript}` : transcript))
          setIsListening(false)
        }

        reco.onerror = () => {
          setIsListening(false)
        }

        reco.onend = () => {
          setIsListening(false)
        }

        recognitionRef.current = reco
      } else {
        setSpeechSupported(false)
      }
    }
  }, [])

  // Text-to-Speech function for persona response
  const speakText = useCallback(
    (text: string) => {
      if (!voiceEnabled || typeof window === "undefined" || !("speechSynthesis" in window)) return
      window.speechSynthesis.cancel() // Stop any previous speech
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.rate = 1.0
      utterance.pitch = 1.0
      utterance.lang = "en-US"
      window.speechSynthesis.speak(utterance)
    },
    [voiceEnabled]
  )

  // Toggle voice recognition
  const toggleListening = () => {
    if (!recognitionRef.current) return
    if (isListening) {
      recognitionRef.current.stop()
      setIsListening(false)
    } else {
      try {
        recognitionRef.current.start()
        setIsListening(true)
      } catch {
        setIsListening(false)
      }
    }
  }

  // Start Rehearsal
  const startRehearsal = () => {
    const starterMessage: ChatTurn = {
      id: "turn-0",
      role: "assistant",
      content: activeScenario.starterLine,
      tone: activeDifficulty.label,
    }
    setMessages([starterMessage])
    setStage("rehearsal")
    setCrisisAlert(null)

    // Voice output for opening line if enabled
    setTimeout(() => {
      speakText(activeScenario.starterLine)
    }, 400)
  }

  // Send turn
  const sendTurn = async () => {
    if (!input.trim() || isSending) return
    const userText = input.trim()
    setInput("")

    const userTurn: ChatTurn = {
      id: `turn-${Date.now()}`,
      role: "user",
      content: userText,
    }
    const newHistory = [...messages, userTurn]
    setMessages(newHistory)
    setIsSending(true)

    try {
      const res = await fetch("/api/rehearse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          scenario: selectedScenario,
          difficulty: selectedDifficulty,
          message: userText,
          history: newHistory.map((m) => ({ role: m.role, content: m.content })),
          action: "turn",
        }),
      })

      if (!res.ok) throw new Error("Network response was not ok")
      const data = await res.json()

      if (data.crisis_flag) {
        setCrisisAlert(data.reply)
      }

      const botTurn: ChatTurn = {
        id: `turn-${Date.now() + 1}`,
        role: "assistant",
        content: data.reply,
        tone: data.tone,
      }
      setMessages([...newHistory, botTurn])
      speakText(data.reply)
    } catch {
      const fallbackTurn: ChatTurn = {
        id: `turn-${Date.now() + 1}`,
        role: "assistant",
        content: "I hear you clearly. Let's keep going — what would you say next?",
        tone: "neutral",
      }
      setMessages([...newHistory, fallbackTurn])
    } finally {
      setIsSending(false)
    }
  }

  // Request final feedback
  const finishAndRateReality = () => {
    setStage("reality_rating")
  }

  const submitFeedback = async () => {
    setStage("feedback")
    setIsLoadingFeedback(true)

    try {
      const res = await fetch("/api/rehearse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          scenario: selectedScenario,
          difficulty: selectedDifficulty,
          message: "",
          history: messages.map((m) => ({ role: m.role, content: m.content })),
          action: "feedback",
        }),
      })

      if (!res.ok) throw new Error("Failed to fetch feedback")
      const data = await res.json()
      if (data.feedback) {
        setFeedback(data.feedback)
      } else {
        throw new Error("No feedback")
      }
    } catch {
      setFeedback({
        what_went_well:
          "You initiated the conversation despite your hesitation, maintained a respectful tone, and clearly communicated your intent.",
        one_tip:
          "Take a slow breath before speaking so your vocal pitch remains grounded and you don't feel rushed to fill the silence.",
        better_opening_line:
          "Excuse me, do you have a quick moment? I was hoping to ask about...",
      })
    } finally {
      setIsLoadingFeedback(false)
    }
  }

  const restartAll = () => {
    setStage("setup")
    setMessages([])
    setInput("")
    setFeedback(null)
    setCrisisAlert(null)
  }

  return (
    <div className="min-h-screen bg-background flex flex-col relative overflow-hidden">
      {/* Ambient background glows */}
      <div className="decorative-blur w-[380px] h-[380px] bg-primary/15 -top-24 -right-24 fixed pointer-events-none" />
      <div className="decorative-blur w-[320px] h-[320px] bg-accent/15 bottom-20 -left-20 fixed pointer-events-none" />

      <Navbar variant="protected" />

      <main className="flex-1 container mx-auto max-w-4xl px-4 py-8 relative z-10 flex flex-col">
        {/* ========================================================= */}
        {/* STAGE 1: SETUP (Scenario + Difficulty + Predict Slider) */}
        {/* ========================================================= */}
        {stage === "setup" && (
          <div className="animate-fade-up space-y-8 max-w-2xl mx-auto w-full">
            {/* Header */}
            <div className="text-center space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Exposure Sandbox</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-serif font-bold text-foreground">
                Social Rehearsal
              </h1>
              <p className="text-muted-foreground text-sm max-w-md mx-auto">
                Practice high-anxiety college conversations in a private, judgment-free space before stepping into real life.
              </p>
            </div>

            {/* Step 1: Scenario Picker */}
            <div className="glass rounded-3xl p-6 border border-border/50 shadow-soft space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-primary text-white text-xs flex items-center justify-center font-bold">1</span>
                  Choose a Scenario
                </label>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {SCENARIOS.map((sc) => {
                  const isSelected = selectedScenario === sc.id
                  return (
                    <button
                      key={sc.id}
                      onClick={() => setSelectedScenario(sc.id)}
                      className={cn(
                        "text-left p-4 rounded-2xl border transition-all duration-200 flex items-start gap-3.5",
                        isSelected
                          ? "border-primary bg-primary/10 shadow-sm ring-1 ring-primary/40 scale-[1.01]"
                          : "border-border/50 hover:bg-secondary/40 hover:border-border"
                      )}
                    >
                      <span className="text-2xl flex-shrink-0">{sc.icon}</span>
                      <div className="space-y-0.5 min-w-0">
                        <p className="font-semibold text-sm text-foreground">{sc.title}</p>
                        <p className="text-xs text-muted-foreground truncate">{sc.context}</p>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Step 2: Difficulty Toggle */}
            <div className="glass rounded-3xl p-6 border border-border/50 shadow-soft space-y-4">
              <label className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-primary text-white text-xs flex items-center justify-center font-bold">2</span>
                Set Conversation Difficulty
              </label>

              <div className="grid grid-cols-3 gap-3">
                {DIFFICULTIES.map((d) => {
                  const isSelected = selectedDifficulty === d.id
                  return (
                    <button
                      key={d.id}
                      onClick={() => setSelectedDifficulty(d.id)}
                      className={cn(
                        "p-3 rounded-2xl border text-center transition-all duration-200",
                        isSelected
                          ? cn("ring-2 ring-primary/50 font-bold", d.bg)
                          : "border-border/50 hover:bg-secondary/40 text-muted-foreground"
                      )}
                    >
                      <p className="text-sm font-semibold">{d.label}</p>
                      <p className="text-[11px] opacity-80 mt-0.5">{d.badge}</p>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Step 3: PREDICT SLIDER (CBT Exposure Technique) */}
            <div className="glass rounded-3xl p-6 border border-border/50 shadow-soft space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-primary text-white text-xs flex items-center justify-center font-bold">3</span>
                  Predict Anxiety Level
                </label>
                <span className="text-lg font-bold text-foreground">
                  {predictedScore} <span className="text-xs text-muted-foreground font-normal">/ 10</span>
                </span>
              </div>

              <p className="text-xs text-muted-foreground">
                Before you begin, estimate how scary or uncomfortable this conversation feels right now:
              </p>

              <div className="space-y-2">
                <input
                  type="range"
                  min="1"
                  max="10"
                  step="1"
                  value={predictedScore}
                  onChange={(e) => setPredictedScore(Number(e.target.value))}
                  className="w-full accent-primary h-2 bg-secondary rounded-lg cursor-pointer"
                />
                <div className="flex justify-between items-center text-xs">
                  <span className="text-muted-foreground">1: Very Easy</span>
                  <span className={cn("font-semibold", getAnxietyDescriptor(predictedScore).color)}>
                    {getAnxietyDescriptor(predictedScore).text}
                  </span>
                  <span className="text-muted-foreground">10: Panic</span>
                </div>
              </div>
            </div>

            {/* Start Button */}
            <button
              onClick={startRehearsal}
              className="w-full py-4 rounded-2xl gradient-primary text-white font-bold text-base shadow-soft hover-lift flex items-center justify-center gap-2.5 transition-all duration-200"
            >
              <Play className="w-5 h-5 fill-current" />
              <span>Step into the Scenario</span>
            </button>
          </div>
        )}

        {/* ========================================================= */}
        {/* STAGE 2: REHEARSAL CHAT SCREEN */}
        {/* ========================================================= */}
        {stage === "rehearsal" && (
          <div className="flex flex-col flex-1 max-w-2xl mx-auto w-full space-y-4 animate-fade-up">
            {/* Persona Status Bar */}
            <div className="glass border border-border/50 rounded-2xl px-4 py-3 flex items-center justify-between shadow-soft">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center text-xl shadow-sm">
                  {activeScenario.icon}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-sm text-foreground">{activeScenario.persona}</p>
                    <span className={cn("text-[10px] px-2 py-0.5 rounded-full font-medium border", activeDifficulty.bg)}>
                      {activeDifficulty.label}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground truncate max-w-xs">{activeScenario.context}</p>
                </div>
              </div>

              {/* Voice toggle */}
              <button
                onClick={() => setVoiceEnabled(!voiceEnabled)}
                title={voiceEnabled ? "Mute Persona Voice" : "Enable Persona Voice"}
                className={cn(
                  "p-2 rounded-xl border transition-all text-xs flex items-center gap-1.5",
                  voiceEnabled
                    ? "bg-primary/10 border-primary/30 text-primary"
                    : "border-border/50 text-muted-foreground hover:bg-secondary"
                )}
              >
                {voiceEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                <span className="hidden sm:inline">{voiceEnabled ? "Voice On" : "Muted"}</span>
              </button>
            </div>

            {/* Crisis Alert Banner if triggered */}
            {crisisAlert && (
              <div className="bg-rose-500/15 border border-rose-500/30 rounded-2xl p-4 text-rose-700 dark:text-rose-300 text-xs flex items-start gap-3 animate-fade-up">
                <ShieldAlert className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-bold">Support & Safety Notice</p>
                  <p>{crisisAlert}</p>
                </div>
              </div>
            )}

            {/* Messages Scroll Area */}
            <div className="flex-1 min-h-[360px] max-h-[460px] overflow-y-auto glass border border-border/50 rounded-3xl p-5 space-y-4 shadow-inner">
              {messages.map((turn) => {
                const isUser = turn.role === "user"
                return (
                  <div
                    key={turn.id}
                    className={cn("flex flex-col", isUser ? "items-end" : "items-start")}
                  >
                    <div className="flex items-center gap-1.5 mb-1 px-1">
                      <span className="text-[11px] font-semibold text-muted-foreground">
                        {isUser ? "You" : activeScenario.persona}
                      </span>
                      {!isUser && (
                        <button
                          onClick={() => speakText(turn.content)}
                          title="Replay Audio"
                          className="text-muted-foreground hover:text-primary transition-colors p-0.5"
                        >
                          <Volume2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>

                    <div
                      className={cn(
                        "max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed",
                        isUser
                          ? "gradient-primary text-white rounded-br-none shadow-soft"
                          : "glass border border-border/60 text-foreground rounded-bl-none shadow-sm"
                      )}
                    >
                      {turn.content}
                    </div>
                  </div>
                )
              })}

              {isSending && (
                <div className="flex items-start gap-2">
                  <div className="glass border border-border/50 rounded-2xl px-4 py-2.5 text-xs text-muted-foreground flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-primary animate-ping" />
                    <span>{activeScenario.persona} is responding...</span>
                  </div>
                </div>
              )}

              <div ref={chatEndRef} />
            </div>

            {/* Speech-to-Text & Input bar */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                {speechSupported && (
                  <button
                    onClick={toggleListening}
                    title={isListening ? "Listening... click to stop" : "Speak your message"}
                    className={cn(
                      "h-12 w-12 rounded-2xl flex items-center justify-center border transition-all duration-200 flex-shrink-0 shadow-soft",
                      isListening
                        ? "bg-rose-500 text-white border-rose-600 animate-pulse scale-105"
                        : "glass border-border/60 text-muted-foreground hover:text-foreground hover:scale-105"
                    )}
                  >
                    {isListening ? <Mic className="w-5 h-5 animate-bounce" /> : <Mic className="w-5 h-5" />}
                  </button>
                )}

                <div className="flex-1 relative flex items-center">
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault()
                        sendTurn()
                      }
                    }}
                    placeholder={
                      isListening
                        ? "Listening... speak now 🎙️"
                        : "Type what you would say out loud..."
                    }
                    className="w-full h-12 pl-4 pr-12 rounded-2xl glass border border-border/60 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                  <button
                    onClick={sendTurn}
                    disabled={!input.trim() || isSending}
                    className="absolute right-2 p-2 rounded-xl text-primary hover:bg-primary/10 disabled:opacity-40 disabled:hover:bg-transparent transition-all"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Finish Rehearsal Button */}
              <div className="flex items-center justify-between pt-1">
                <span className="text-xs text-muted-foreground">
                  Practice 2-4 exchanges, then review how you did.
                </span>
                <button
                  onClick={finishAndRateReality}
                  className="px-4 py-2 rounded-xl border border-primary/40 bg-primary/10 hover:bg-primary/20 text-primary font-semibold text-xs flex items-center gap-1.5 transition-all hover-lift"
                >
                  <Award className="w-3.5 h-3.5" />
                  <span>Finish & Get Feedback</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* STAGE 3: REALITY RATING (CBT Reality Testing) */}
        {/* ========================================================= */}
        {stage === "reality_rating" && (
          <div className="animate-fade-up max-w-lg mx-auto w-full space-y-6 my-auto">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center mx-auto text-2xl">
                🎯
              </div>
              <h2 className="text-2xl font-serif font-bold text-foreground">
                How Was It in Reality?
              </h2>
              <p className="text-sm text-muted-foreground">
                You just finished practicing! Now let's compare your original prediction with how it actually felt.
              </p>
            </div>

            <div className="glass rounded-3xl p-6 border border-border/50 shadow-soft space-y-5">
              <div className="flex justify-between items-center text-xs text-muted-foreground">
                <span>Before: You predicted <strong className="text-foreground">{predictedScore}/10</strong></span>
                <span className="text-primary font-semibold">Reality Score</span>
              </div>

              <div className="space-y-3">
                <div className="text-center">
                  <span className="text-4xl font-bold font-serif text-foreground">
                    {realityScore}
                  </span>
                  <span className="text-sm text-muted-foreground ml-1">/ 10</span>
                  <p className={cn("text-xs font-semibold mt-1", getAnxietyDescriptor(realityScore).color)}>
                    {getAnxietyDescriptor(realityScore).text}
                  </p>
                </div>

                <input
                  type="range"
                  min="1"
                  max="10"
                  step="1"
                  value={realityScore}
                  onChange={(e) => setRealityScore(Number(e.target.value))}
                  className="w-full accent-primary h-2 bg-secondary rounded-lg cursor-pointer"
                />

                <div className="flex justify-between text-[11px] text-muted-foreground">
                  <span>1: Totally manageable</span>
                  <span>10: Impossible</span>
                </div>
              </div>

              <button
                onClick={submitFeedback}
                className="w-full py-3.5 rounded-2xl gradient-primary text-white font-bold text-sm shadow-soft hover-lift flex items-center justify-center gap-2 transition-all"
              >
                <span>See My Results & Feedback</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* STAGE 4: FEEDBACK & PREDICT VS REALITY RESULT */}
        {/* ========================================================= */}
        {stage === "feedback" && (
          <div className="animate-fade-up max-w-2xl mx-auto w-full space-y-6">
            {/* Header */}
            <div className="text-center space-y-1">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Rehearsal Complete</span>
              </div>
              <h2 className="text-3xl font-serif font-bold text-foreground">
                Your Growth Breakdown
              </h2>
            </div>

            {/* PREDICT VS REALITY CARD */}
            <div className="glass rounded-3xl p-6 border border-border/50 shadow-soft space-y-5">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <Sliders className="w-4 h-4 text-primary" />
                <span>Predict vs. Reality Comparison</span>
              </h3>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-secondary/40 border border-border/50 rounded-2xl p-4 text-center space-y-1">
                  <p className="text-xs text-muted-foreground">Predicted Fear</p>
                  <p className="text-3xl font-bold font-serif text-foreground">{predictedScore}<span className="text-xs text-muted-foreground">/10</span></p>
                  <p className={cn("text-[11px] font-medium truncate", getAnxietyDescriptor(predictedScore).color)}>
                    {getAnxietyDescriptor(predictedScore).text.split(" ")[0]}
                  </p>
                </div>

                <div className="bg-primary/10 border border-primary/20 rounded-2xl p-4 text-center space-y-1">
                  <p className="text-xs text-primary font-medium">Actual Reality</p>
                  <p className="text-3xl font-bold font-serif text-primary">{realityScore}<span className="text-xs text-primary/70">/10</span></p>
                  <p className={cn("text-[11px] font-medium truncate", getAnxietyDescriptor(realityScore).color)}>
                    {getAnxietyDescriptor(realityScore).text.split(" ")[0]}
                  </p>
                </div>
              </div>

              {/* Cognitive Takeaway Quote */}
              <div className="rounded-2xl p-4 bg-secondary/50 border border-border/40 text-xs leading-relaxed space-y-1">
                <p className="font-semibold text-foreground flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-primary" />
                  <span>The Mindset Shift:</span>
                </p>
                <p className="text-muted-foreground">
                  {predictedScore > realityScore ? (
                    <>
                      You predicted a difficulty of <strong>{predictedScore}/10</strong>, but in reality it felt like <strong>{realityScore}/10</strong>!{" "}
                      That is a <strong>{predictedScore - realityScore} point anxiety gap</strong>. Your brain predicted catastrophic awkwardness, but the real experience was far more manageable.
                    </>
                  ) : predictedScore === realityScore ? (
                    <>
                      Your prediction matched the difficulty (<strong>{realityScore}/10</strong>). You faced the situation head-on without avoidance — that is genuine courage!
                    </>
                  ) : (
                    <>
                      It felt tougher than expected (<strong>{realityScore}/10</strong> vs <strong>{predictedScore}/10</strong>), and you stayed through it. Each tough repetition stretches your social comfort zone.
                    </>
                  )}
                </p>
              </div>
            </div>

            {/* TYPED FEEDBACK CARD */}
            {isLoadingFeedback ? (
              <div className="glass rounded-3xl p-10 border border-border/50 text-center space-y-3">
                <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin mx-auto" />
                <p className="text-sm font-semibold text-foreground">Analyzing your conversation...</p>
                <p className="text-xs text-muted-foreground">Extracting communication strengths and practical advice.</p>
              </div>
            ) : feedback ? (
              <div className="space-y-4">
                {/* 1. What Went Well */}
                <div className="glass rounded-3xl p-6 border border-emerald-500/20 bg-emerald-500/[0.03] shadow-soft space-y-2">
                  <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-semibold text-sm">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>What Went Well</span>
                  </div>
                  <p className="text-xs text-foreground/90 leading-relaxed">
                    {feedback.what_went_well}
                  </p>
                </div>

                {/* 2. One Practical Tip */}
                <div className="glass rounded-3xl p-6 border border-amber-500/20 bg-amber-500/[0.03] shadow-soft space-y-2">
                  <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-semibold text-sm">
                    <Lightbulb className="w-4 h-4" />
                    <span>One Actionable Tip for Next Time</span>
                  </div>
                  <p className="text-xs text-foreground/90 leading-relaxed">
                    {feedback.one_tip}
                  </p>
                </div>

                {/* 3. A Better Opening Line */}
                <div className="glass rounded-3xl p-6 border border-primary/20 bg-primary/[0.03] shadow-soft space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-primary font-semibold text-sm">
                      <Quote className="w-4 h-4" />
                      <span>Try Saying This Out Loud</span>
                    </div>
                    <button
                      onClick={() => speakText(feedback.better_opening_line)}
                      title="Listen to this line"
                      className="text-xs text-primary hover:underline flex items-center gap-1 font-medium"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                      <span>Hear It</span>
                    </button>
                  </div>
                  <blockquote className="text-sm font-serif italic text-foreground bg-secondary/50 rounded-xl p-3 border-l-4 border-primary">
                    "{feedback.better_opening_line}"
                  </blockquote>
                </div>
              </div>
            ) : null}

            {/* Actions Footer */}
            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={restartAll}
                className="flex-1 py-3.5 rounded-2xl gradient-primary text-white font-bold text-sm shadow-soft hover-lift flex items-center justify-center gap-2 transition-all"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Practice Another Scenario</span>
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

export default function RehearsePage() {
  return (
    <AuthProvider>
      <ProtectedRoute>
        <RehearseContent />
      </ProtectedRoute>
    </AuthProvider>
  )
}
