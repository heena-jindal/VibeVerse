"use client"

import { useEffect, useState } from "react"
import { AuthProvider } from "@/lib/auth-context"
import { ProtectedRoute } from "@/components/protected-route"
import { Navbar } from "@/components/navbar"
import { Music2, Link2, Globe } from "lucide-react"
import { cn } from "@/lib/utils"

const MOODS = ["very anxious", "nervous", "confused", "okay", "confident"]

const LANGUAGES = [
  { id: "english", label: "English" },
  { id: "hindi", label: "Hindi" },
  { id: "punjabi", label: "Punjabi" },
  { id: "instrumental", label: "Instrumental" },
]

// ─────────────────────────────────────────────────────────
// Curated playlist IDs — these are starting points only!
// To customize: open any playlist on Spotify → Share →
// Copy link to playlist → the ID is the part after /playlist/
// Replace the IDs below (especially Hindi/Punjabi) with your favorites.
// ─────────────────────────────────────────────────────────
const PLAYLIST_MAP: Record<string, Record<string, { id: string; name: string }>> = {
  english: {
    "very anxious": { id: "37i9dQZF1DX4sWSpwq3LiO", name: "Peaceful Piano" },
    nervous:        { id: "37i9dQZF1DWZqd5JICZI0u", name: "Calm Vibes" },
    confused:       { id: "37i9dQZF1DWZeKCadgRdKQ", name: "Deep Focus" },
    okay:           { id: "37i9dQZF1DX3rxVfibe1L0", name: "Mood Booster" },
    confident:      { id: "37i9dQZF1DXdPec7aLTmlC", name: "Beast Mode" },
  },
  hindi: {
    "very anxious": { id: "37i9dQZF1DX0XUsuxWHRQd", name: "Bollywood Acoustic" },
    nervous:        { id: "37i9dQZF1DX0XUsuxWHRQd", name: "Bollywood Acoustic" },
    confused:       { id: "37i9dQZF1DX0XUsuxWHRQd", name: "Bollywood Acoustic" },
    okay:           { id: "37i9dQZF1DXcBWIGoYBM5M", name: "Bollywood Hits" },
    confident:      { id: "37i9dQZF1DXcBWIGoYBM5M", name: "Bollywood Hits" },
  },
  punjabi: {
    "very anxious": { id: "37i9dQZF1DX0XUsuxWHRQd", name: "Chill Punjabi" },
    nervous:        { id: "37i9dQZF1DX0XUsuxWHRQd", name: "Chill Punjabi" },
    confused:       { id: "37i9dQZF1DX0XUsuxWHRQd", name: "Chill Punjabi" },
    okay:           { id: "37i9dQZF1DX0XUsuxWHRQd", name: "Punjabi Hits" },
    confident:      { id: "37i9dQZF1DX0XUsuxWHRQd", name: "Punjabi Hits" },
  },
  instrumental: {
    "very anxious": { id: "37i9dQZF1DX4sWSpwq3LiO", name: "Peaceful Piano" },
    nervous:        { id: "37i9dQZF1DX4sWSpwq3LiO", name: "Peaceful Piano" },
    confused:       { id: "37i9dQZF1DWZeKCadgRdKQ", name: "Deep Focus" },
    okay:           { id: "37i9dQZF1DWZeKCadgRdKQ", name: "Deep Focus" },
    confident:      { id: "37i9dQZF1DX4sWSpwq3LiO", name: "Peaceful Piano" },
  },
}

// Extracts a Spotify ID from a pasted link, URI, or raw ID
function extractSpotifyId(input: string): string | null {
  const trimmed = input.trim()
  const urlMatch = trimmed.match(/(?:playlist|album|track)\/([a-zA-Z0-9]+)/)
  if (urlMatch) return urlMatch[1]
  const uriMatch = trimmed.match(/spotify:(?:playlist|album|track):([a-zA-Z0-9]+)/)
  if (uriMatch) return uriMatch[1]
  if (/^[a-zA-Z0-9]{20,24}$/.test(trimmed)) return trimmed
  return null
}

function MusicContent() {
  const [mood, setMood] = useState("okay")
  const [language, setLanguage] = useState("english")
  const [customInput, setCustomInput] = useState("")
  const [customId, setCustomId] = useState<string | null>(null)
  const [customError, setCustomError] = useState("")
  const [loadingMood, setLoadingMood] = useState(true)

  useEffect(() => {
    fetch(`/api/music`, { credentials: "include" })
      .then((r) => r.json())
      .then((d) => {
        if (d.mood) setMood(d.mood)
        setLoadingMood(false)
      })
      .catch(() => setLoadingMood(false))
  }, [])

  const handleLoadCustom = () => {
    const id = extractSpotifyId(customInput)
    if (!id) {
      setCustomError("Couldn't read that link. Paste a Spotify playlist/album/track URL.")
      setCustomId(null)
      return
    }
    setCustomError("")
    setCustomId(id)
  }

  const playlist = PLAYLIST_MAP[language]?.[mood] ?? PLAYLIST_MAP.english.okay

  return (
    <div className="min-h-screen bg-background flex flex-col relative">
      <div className="decorative-blur w-[300px] h-[300px] bg-primary/20 -top-20 -right-20 fixed" />
      <div className="decorative-blur w-[250px] h-[250px] bg-accent/20 bottom-20 -left-20 fixed" />

      <Navbar variant="protected" />

      <div className="container mx-auto max-w-2xl px-4 py-8 relative z-10 flex-1 space-y-6">
        <div className="text-center mb-2 animate-fade-up">
          <h1 className="font-serif text-3xl font-semibold text-foreground mb-2 flex items-center justify-center gap-2">
            <Music2 className="h-7 w-7 text-primary" />
            Music for Your Mood
          </h1>
          <p className="text-muted-foreground text-sm">
            Calming sounds, picked for how you're feeling
          </p>
        </div>

        {/* Your own playlist */}
        <div className="bg-card rounded-3xl p-5 sm:p-6 border border-border/50 shadow-soft animate-fade-up">
          <h2 className="font-semibold text-foreground mb-1 flex items-center gap-2">
            <Link2 className="h-4 w-4 text-primary" />
            Your Spotify Playlist
          </h2>
          <p className="text-xs text-muted-foreground mb-4">
            Paste a link to any Spotify playlist, album, or track and listen right here.
          </p>
          <div className="flex gap-2 flex-wrap">
            <input
              value={customInput}
              onChange={(e) => setCustomInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleLoadCustom()}
              placeholder="https://open.spotify.com/playlist/..."
              className="flex-1 min-w-0 rounded-full px-4 py-2.5 bg-secondary/50 border border-border text-sm placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
            <button
              onClick={handleLoadCustom}
              className="gradient-primary text-white px-5 py-2.5 rounded-full text-sm font-medium shadow-soft hover-lift"
            >
              Load
            </button>
          </div>
          {customError && (
            <p className="text-xs text-destructive mt-2">{customError}</p>
          )}

          {customId && (
            <iframe
              src={`https://open.spotify.com/embed/${customInput.includes("/album/") ? "album" : customInput.includes("/track/") ? "track" : "playlist"}/${customId}?utm_source=generator&theme=0`}
              width="100%"
              height="352"
              frameBorder="0"
              allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
              loading="lazy"
              className="rounded-2xl mt-4"
            />
          )}
        </div>

        {/* Mood + language recommendations */}
        <div className="bg-card rounded-3xl p-5 sm:p-6 border border-border/50 shadow-soft animate-fade-up">
          <h2 className="font-semibold text-foreground mb-1 flex items-center gap-2">
            <Globe className="h-4 w-4 text-primary" />
            Recommended for You
          </h2>
          <p className="text-xs text-muted-foreground mb-4">
            {loadingMood ? "Reading your latest mood..." : `Based on your mood: ${mood}`}
          </p>

          {/* Language picker */}
          <div className="mb-3">
            <p className="text-xs font-medium text-muted-foreground mb-2">Language</p>
            <div className="flex flex-wrap gap-2">
              {LANGUAGES.map((l) => (
                <button
                  key={l.id}
                  onClick={() => setLanguage(l.id)}
                  className={cn(
                    "px-4 py-1.5 rounded-full text-xs font-medium transition-all",
                    language === l.id
                      ? "gradient-primary text-white"
                      : "bg-secondary text-secondary-foreground border border-border hover:bg-secondary/70"
                  )}
                >
                  {l.label}
                </button>
              ))}
            </div>
          </div>

          {/* Mood picker */}
          <div className="mb-4">
            <p className="text-xs font-medium text-muted-foreground mb-2">Mood</p>
            <div className="flex flex-wrap gap-2">
              {MOODS.map((m) => (
                <button
                  key={m}
                  onClick={() => setMood(m)}
                  className={cn(
                    "px-4 py-1.5 rounded-full text-xs font-medium capitalize transition-all",
                    mood === m
                      ? "gradient-primary text-white"
                      : "bg-secondary text-secondary-foreground border border-border hover:bg-secondary/70"
                  )}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-2xl bg-secondary/40 px-4 py-3 mb-3 text-sm font-medium text-foreground">
            🎵 {playlist.name}
          </div>

          <iframe
            src={`https://open.spotify.com/embed/playlist/${playlist.id}?utm_source=generator&theme=0`}
            width="100%"
            height="352"
            frameBorder="0"
            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
            loading="lazy"
            className="rounded-2xl"
          />
        </div>

        <p className="text-xs text-muted-foreground text-center">
          🎧 Free Spotify account = 30s previews · Premium = full tracks
        </p>
      </div>
    </div>
  )
}

export default function MusicPage() {
  return (
    <AuthProvider>
      <ProtectedRoute>
        <MusicContent />
      </ProtectedRoute>
    </AuthProvider>
  )
}