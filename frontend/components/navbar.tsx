"use client"

import {
  MessageCircle, Trophy, BookOpen, History, LogOut,
  Sparkles, BarChart2, Gamepad2, Music2, Film, Home,
} from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/lib/auth-context"
import { useRouter, usePathname } from "next/navigation"
import { ThemeToggle } from "@/components/theme-toggle"
import { cn } from "@/lib/utils"

interface NavbarProps {
  variant?: "landing" | "protected"
}

const navLinks = [
  { href: "/chat",       label: "Chat",       icon: MessageCircle },
  { href: "/challenges", label: "Challenges", icon: Trophy },
  { href: "/journal",    label: "Journal",    icon: BookOpen },
  { href: "/music",      label: "Music",      icon: Music2 },
  { href: "/games",      label: "Games",      icon: Gamepad2 },
  { href: "/progress",   label: "Progress",   icon: BarChart2 },
  { href: "/history",    label: "History",    icon: History },
]

export function Navbar({ variant = "landing" }: NavbarProps) {
  const { user, logout } = useAuth()
  const router           = useRouter()
  const pathname         = usePathname()

  const handleLogout = async () => {
    await logout()
    router.push("/login")
  }

  /* ── Protected nav ───────────────────────────────── */
  if (variant === "protected") {
    return (
      <>
        {/* Top bar */}
        <header className="sticky top-0 z-50 w-full glass border-b border-border/40">
          <div className="container mx-auto flex h-14 items-center justify-between px-4">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="h-8 w-8 rounded-xl gradient-primary flex items-center justify-center shadow-soft group-hover:scale-110 transition-transform duration-200">
                <Sparkles className="h-4 w-4 text-white" />
              </div>
              <span className="font-bold text-base text-foreground hidden sm:block">VibeVerse</span>
            </Link>

            {/* Desktop nav links */}
            <nav className="hidden lg:flex items-center gap-0.5">
              {navLinks.map(({ href, label, icon: Icon }) => {
                const active = pathname === href
                return (
                  <Link
                    key={href}
                    href={href}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200",
                      active
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:text-foreground hover:bg-secondary/70"
                    )}
                  >
                    <Icon className="h-4 w-4 flex-shrink-0" />
                    <span>{label}</span>
                  </Link>
                )
              })}
            </nav>

            {/* Right side */}
            <div className="flex items-center gap-2">
              {user && (
                <span className="text-xs text-muted-foreground hidden md:block">
                  hey, <span className="font-semibold text-foreground">{user}</span> 👋
                </span>
              )}
              <ThemeToggle />
              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-destructive hover:bg-destructive/10 px-3 py-2 rounded-xl transition-all duration-200"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>
        </header>

        {/* Mobile bottom nav */}
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 glass border-t border-border/40 px-2 pb-safe">
          <div className="flex items-center justify-around py-2">
            {navLinks.slice(0, 6).map(({ href, label, icon: Icon }) => {
              const active = pathname === href
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    "flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-xl transition-all duration-200 min-w-[48px]",
                    active ? "text-primary" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <div className={cn(
                    "p-1.5 rounded-xl transition-all duration-200",
                    active && "bg-primary/10"
                  )}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <span className="text-[10px] font-medium leading-none">{label}</span>
                </Link>
              )
            })}
          </div>
        </nav>

        {/* Spacer so bottom nav doesn't overlap content on mobile */}
        <div className="lg:hidden h-16" />
      </>
    )
  }

  /* ── Landing nav ─────────────────────────────────── */
  return (
    <header className="sticky top-0 z-50 w-full glass border-b border-border/40">
      <div className="container mx-auto flex h-14 items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="h-8 w-8 rounded-xl gradient-primary flex items-center justify-center shadow-soft group-hover:scale-110 transition-transform duration-200">
            <Sparkles className="h-4 w-4 text-white" />
          </div>
          <span className="font-bold text-base text-foreground">VibeVerse</span>
        </Link>

        <nav className="flex items-center gap-2">
          <Link href="/challenges" className="hidden sm:block">
            <button className="text-sm font-medium text-muted-foreground hover:text-foreground px-3 py-2 rounded-xl hover:bg-secondary/70 transition-all">
              Daily Challenge
            </button>
          </Link>
          <Link href="/journal" className="hidden sm:block">
            <button className="text-sm font-medium text-muted-foreground hover:text-foreground px-3 py-2 rounded-xl hover:bg-secondary/70 transition-all">
              Journal
            </button>
          </Link>
          {user ? (
            <Link href="/chat">
              <button className="gradient-primary text-white text-sm font-semibold px-5 py-2.5 rounded-full shadow-soft hover-lift">
                Start Chatting
              </button>
            </Link>
          ) : (
            <>
              <Link href="/login">
                <button className="text-sm font-medium text-muted-foreground hover:text-foreground px-3 py-2 rounded-xl hover:bg-secondary/70 transition-all">
                  Login
                </button>
              </Link>
              <Link href="/register">
                <button className="gradient-primary text-white text-sm font-semibold px-5 py-2.5 rounded-full shadow-soft hover-lift">
                  Register
                </button>
              </Link>
            </>
          )}
          <div className="border-l border-border pl-2 ml-1">
            <ThemeToggle />
          </div>
        </nav>
      </div>
    </header>
  )
}