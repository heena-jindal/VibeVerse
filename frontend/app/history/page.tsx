"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Navbar } from "@/components/navbar"
import { ProtectedRoute } from "@/components/protected-route"
import { AuthProvider } from "@/lib/auth-context"
import { Spinner } from "@/components/ui/spinner"
import { History, MessageSquare } from "lucide-react"
import { cn } from "@/lib/utils"

const API = ""

interface ChatHistory {
  mood: string
  situation: string
  user_message: string
  bot_reply: string
  timestamp: string
}

interface MoodCount {
  mood: string
  count: number
}

const moodColors: Record<string, { bg: string; text: string }> = {
  "very anxious": { bg: "bg-red-100", text: "text-red-700" },
  "anxious": { bg: "bg-red-100", text: "text-red-700" },
  "nervous": { bg: "bg-amber-100", text: "text-amber-700" },
  "confused": { bg: "bg-blue-100", text: "text-blue-700" },
  "okay": { bg: "bg-gray-100", text: "text-gray-700" },
  "confident": { bg: "bg-green-100", text: "text-green-700" },
}

const situationLabels: Record<string, string> = {
  in_class: "In Class",
  canteen: "Canteen",
  first_day: "First Day",
  group_project: "Group Project",
  presentation: "Presentation",
}

function HistoryContent() {
  const [chats, setChats] = useState<ChatHistory[]>([])
  const [moodCounts, setMoodCounts] = useState<MoodCount[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const fetchHistory = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/history`, {
        credentials: "include",
      })
      const data = await res.json()
      setChats(data.chats || [])
      setMoodCounts(data.counts || [])
    } catch {
      // Demo data
      setChats([
        {
          mood: "nervous",
          situation: "in_class",
          user_message: "I have to give a presentation tomorrow and I'm really scared. What if I forget everything?",
          bot_reply: "It's completely normal to feel nervous about presentations. Try practicing in front of a mirror tonight, and remember that your classmates want you to succeed. Take deep breaths before you start, and focus on one friendly face in the audience.",
          timestamp: new Date(Date.now() - 3600000).toISOString(),
        },
        {
          mood: "confused",
          situation: "group_project",
          user_message: "My group members keep talking over me. I don't know how to contribute.",
          bot_reply: "That sounds frustrating. One strategy is to write down your ideas and share them via the group chat instead. You could also try speaking up by building on what someone else said - like 'I agree with Sarah, and also...' This makes it easier to join the conversation.",
          timestamp: new Date(Date.now() - 86400000).toISOString(),
        },
        {
          mood: "okay",
          situation: "canteen",
          user_message: "I ate lunch alone again today. Is that weird?",
          bot_reply: "Not at all! Many people enjoy eating alone - it can be a nice break to recharge. If you'd like company sometimes, you could try sitting near others and gradually starting small conversations. But there's nothing wrong with enjoying your own company.",
          timestamp: new Date(Date.now() - 172800000).toISOString(),
        },
      ])
      setMoodCounts([
        { mood: "nervous", count: 5 },
        { mood: "confused", count: 3 },
        { mood: "okay", count: 2 },
        { mood: "confident", count: 1 },
      ])
    }
    setIsLoading(false)
  }, [])

  useEffect(() => {
    fetchHistory()
  }, [fetchHistory])

  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    })
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Spinner className="h-8 w-8 text-primary" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar variant="protected" />

      <div className="container mx-auto px-4 py-8 max-w-3xl">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
            <History className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Chat History</h1>
            <p className="text-sm text-muted-foreground">Your past conversations</p>
          </div>
        </div>

        {/* Mood Summary */}
        {moodCounts.length > 0 && (
          <div className="mb-8">
            <h2 className="text-sm font-medium text-muted-foreground mb-3">Mood Summary</h2>
            <div className="flex flex-wrap gap-3">
              {moodCounts.map((mc) => {
                const colors = moodColors[mc.mood.toLowerCase()] || { bg: "bg-gray-100", text: "text-gray-700" }
                return (
                  <Card
                    key={mc.mood}
                    className={cn("border-0 rounded-xl", colors.bg)}
                  >
                    <CardContent className="px-4 py-3 flex items-center gap-2">
                      <span className={cn("text-2xl font-bold", colors.text)}>{mc.count}</span>
                      <span className={cn("text-sm capitalize", colors.text)}>{mc.mood}</span>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </div>
        )}

        {/* Chat History */}
        <div className="space-y-4">
          <h2 className="text-sm font-medium text-muted-foreground">Recent Conversations</h2>
          
          {chats.length === 0 ? (
            <Card className="border-border bg-card rounded-2xl p-8 text-center">
              <MessageSquare className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">No chat history yet. Start a conversation!</p>
            </Card>
          ) : (
            chats.map((chat, index) => {
              const moodStyle = moodColors[chat.mood.toLowerCase()] || { bg: "bg-gray-100", text: "text-gray-700" }
              return (
                <Card key={index} className="border-border bg-card rounded-2xl shadow-sm">
                  <CardContent className="p-5">
                    {/* Header */}
                    <div className="flex flex-wrap items-center gap-2 mb-4">
                      <span className={cn("px-3 py-1 rounded-full text-xs font-medium", moodStyle.bg, moodStyle.text)}>
                        {chat.mood}
                      </span>
                      <span className="px-3 py-1 rounded-full text-xs font-medium bg-secondary text-secondary-foreground">
                        {situationLabels[chat.situation] || chat.situation}
                      </span>
                      <span className="text-xs text-muted-foreground ml-auto">
                        {formatDate(chat.timestamp)}
                      </span>
                    </div>

                    {/* User Message */}
                    <div className="mb-4 pl-4 border-l-2 border-primary/30">
                      <p className="text-sm italic text-muted-foreground">{chat.user_message}</p>
                    </div>

                    {/* Bot Reply */}
                    <div className="bg-secondary/50 rounded-xl p-4">
                      <p className="text-sm text-foreground leading-relaxed">{chat.bot_reply}</p>
                    </div>
                  </CardContent>
                </Card>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}

export default function HistoryPage() {
  return (
    <AuthProvider>
      <ProtectedRoute>
        <HistoryContent />
      </ProtectedRoute>
    </AuthProvider>
  )
}
