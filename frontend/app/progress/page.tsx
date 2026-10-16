"use client"

import { useEffect, useState } from "react"
import { AuthProvider } from "@/lib/auth-context"
import { ProtectedRoute } from "@/components/protected-route"
import { Navbar } from "@/components/navbar"

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from "chart.js"

import { Line, Doughnut, Bar } from "react-chartjs-2"

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
)

const API = ""

function ProgressContent() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    fetch(`${API}/api/progress`, { credentials: "include" })
      .then((r) => r.json())
      .then((d) => {
        setData(d)
        setLoading(false)
      })
      .catch(() => {
        setError("Could not load data.")
        setLoading(false)
      })
  }, [])

  const moodColors: Record<string, string> = {
    "very anxious": "#E24B4A",
    "nervous": "#BA7517",
    "confused": "#185FA5",
    "okay": "#888780",
    "confident": "#1D9E75"
  }

  const moodTrend = data?.mood_trend || []
  const journalTrend = data?.journal_trend || []

  return (
    <div className="min-h-screen bg-background">
      <Navbar variant="protected" />

      <div className="container mx-auto max-w-4xl p-6">

        <h1 className="text-2xl font-bold text-primary mb-1">
          Your Progress
        </h1>

        <p className="text-muted-foreground text-sm mb-6">
          Track how your social confidence is growing over time
        </p>

        {/* Loading */}
        {loading && (
          <div className="text-center py-20 text-muted-foreground">
            Loading your progress...
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-destructive/10 text-destructive rounded-xl p-4 mb-4">
            {error}
          </div>
        )}

        {/* DATA */}
        {data && (
          <>
            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              {[
                {
                  label: "Confidence Score",
                  value: `${data.confidence_score}/100`
                },
                {
                  label: "Day Streak",
                  value: `${data.streak} 🔥`
                },
                {
                  label: "Challenges Done",
                  value: `${data.completion_rate}%`
                },
                {
                  label: "Total Sessions",
                  value: moodTrend.reduce(
                    (s: number, d: any) => s + (d.chat_count || 0),
                    0
                  )
                }
              ].map((s, i) => (
                <div
                  key={i}
                  className="bg-card rounded-2xl p-4 text-center border border-border/50"
                >
                  <div className="text-2xl font-bold text-primary">
                    {s.value}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1 uppercase">
                    {s.label}
                  </div>
                </div>
              ))}
            </div>

            {/* Confidence bar */}
            <div className="bg-card rounded-2xl p-5 border mb-4">
              <h2 className="font-semibold text-primary mb-3">
                Overall Confidence Score
              </h2>

              <div className="h-3 bg-secondary rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary"
                  style={{ width: `${data.confidence_score}%` }}
                />
              </div>
            </div>

            {/* Mood Trend */}
            <div className="bg-card rounded-2xl p-5 border mb-4">
              <h2 className="font-semibold text-primary mb-3">
                Mood Trend (30 days)
              </h2>

              {moodTrend.length > 0 ? (
                <Line
                  data={{
                    labels: moodTrend.map((d: any) => d.day),
                    datasets: [
                      {
                        label: "Mood",
                        data: moodTrend.map((d: any) =>
                          Number(d.avg_polarity)
                        ),
                        borderColor: "#534AB7",
                        backgroundColor: "rgba(83,74,183,0.1)",
                        fill: true,
                        tension: 0.4
                      }
                    ]
                  }}
                  options={{
                    responsive: true,
                    plugins: { legend: { display: false } },
                    scales: {
                      y: { min: -1, max: 1 }
                    }
                  }}
                />
              ) : (
                <p className="text-sm text-muted-foreground">
                  No mood data yet
                </p>
              )}
            </div>

            {/* Journal */}
            <div className="bg-card rounded-2xl p-5 border">
              <h2 className="font-semibold text-primary mb-3">
                Journal Activity
              </h2>

              {journalTrend.length > 0 ? (
                <Bar
                  data={{
                    labels: journalTrend.map((d: any) => d.day),
                    datasets: [
                      {
                        label: "Entries",
                        data: journalTrend.map((d: any) => d.entry_count),
                        backgroundColor: "rgba(29,158,117,0.7)"
                      }
                    ]
                  }}
                  options={{
                    responsive: true,
                    plugins: { legend: { display: false } },
                    scales: {
                      y: { beginAtZero: true }
                    }
                  }}
                />
              ) : (
                <p className="text-sm text-muted-foreground">
                  No journal entries yet
                </p>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default function ProgressPage() {
  return (
    <AuthProvider>
      <ProtectedRoute>
        <ProgressContent />
      </ProtectedRoute>
    </AuthProvider>
  )
}