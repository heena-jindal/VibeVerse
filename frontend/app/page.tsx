"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Navbar } from "@/components/navbar"
import { AuthProvider } from "@/lib/auth-context"
import { MessageCircle, Brain, Compass, Sparkles, Heart, Shield } from "lucide-react"

function LandingContent() {
  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="decorative-blur w-[500px] h-[500px] bg-primary/30 -top-48 -right-48 fixed" />
      <div className="decorative-blur w-[400px] h-[400px] bg-accent/30 top-1/2 -left-48 fixed" />
      <div className="decorative-blur w-[300px] h-[300px] bg-primary/20 bottom-20 right-1/4 fixed" />
      
      <Navbar variant="landing" />
      
      {/* Hero Section */}
      <section className="container mx-auto px-4 pt-24 pb-32 text-center relative">
        <div className="mx-auto max-w-4xl animate-fade-up">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary/80 backdrop-blur-sm border border-border mb-8">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-secondary-foreground">Your Safe Space for Growth</span>
          </div>
          
          <h1 className="text-5xl font-serif font-semibold tracking-tight text-foreground sm:text-6xl md:text-7xl text-balance leading-[1.1]">
            Find Your Voice,
            <br />
            <span className="text-gradient">At Your Own Pace</span>
          </h1>
          
          <p className="mt-8 text-lg text-muted-foreground max-w-2xl mx-auto text-pretty leading-relaxed">
            Your AI-powered vibe check — helping introverted students navigate social situations with confidence. ✨
            Build confidence in social situations through personalized guidance, 
            mood-aware conversations, and daily micro-challenges.
          </p>
          
          <div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/chat">
              <Button size="lg" className="rounded-full px-10 py-7 text-base font-medium shadow-soft hover-lift gradient-primary border-0 text-white">
                Begin Your Journey
              </Button>
            </Link>
            <Link href="/register">
              <Button variant="outline" size="lg" className="rounded-full px-10 py-7 text-base font-medium glass hover-lift">
                Create Free Account
              </Button>
            </Link>
          </div>
          
          {/* Trust indicators */}
          <div className="mt-16 flex flex-wrap items-center justify-center gap-8 text-muted-foreground">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-accent" />
              <span className="text-sm">Private & Secure</span>
            </div>
            <div className="flex items-center gap-2">
              <Heart className="h-5 w-5 text-primary" />
              <span className="text-sm">No Judgment</span>
            </div>
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-accent" />
              <span className="text-sm">Personalized Support</span>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-20 relative">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-serif font-semibold text-foreground md:text-4xl text-balance">
            Everything You Need to Thrive
          </h2>
          <p className="mt-4 text-muted-foreground max-w-xl mx-auto">
            Tools designed with empathy for your unique journey
          </p>
        </div>
        
        <div className="grid gap-8 md:grid-cols-3 max-w-5xl mx-auto">
          <Card className="border-0 bg-card/80 backdrop-blur-sm rounded-3xl shadow-soft hover-lift p-2 animate-fade-up" style={{ animationDelay: '0.1s' }}>
            <CardContent className="pt-8 pb-6 px-6 text-center">
              <div className="h-16 w-16 rounded-2xl gradient-primary flex items-center justify-center mb-6 mx-auto shadow-soft animate-float">
                <MessageCircle className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-card-foreground mb-3">Gentle Conversations</h3>
              <p className="text-muted-foreground leading-relaxed">
                Share your thoughts in a safe space. Our AI listens without judgment and responds with understanding and care.
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 bg-card/80 backdrop-blur-sm rounded-3xl shadow-soft hover-lift p-2 animate-fade-up" style={{ animationDelay: '0.2s' }}>
            <CardContent className="pt-8 pb-6 px-6 text-center">
              <div className="h-16 w-16 rounded-2xl gradient-accent flex items-center justify-center mb-6 mx-auto shadow-soft animate-float" style={{ animationDelay: '1s' }}>
                <Brain className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-card-foreground mb-3">Mood-Aware Support</h3>
              <p className="text-muted-foreground leading-relaxed">
                Our AI senses how you&apos;re feeling and adapts its responses to match your emotional state with empathy.
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 bg-card/80 backdrop-blur-sm rounded-3xl shadow-soft hover-lift p-2 animate-fade-up" style={{ animationDelay: '0.3s' }}>
            <CardContent className="pt-8 pb-6 px-6 text-center">
              <div className="h-16 w-16 rounded-2xl gradient-primary flex items-center justify-center mb-6 mx-auto shadow-soft animate-float" style={{ animationDelay: '2s' }}>
                <Compass className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-card-foreground mb-3">Situation Guidance</h3>
              <p className="text-muted-foreground leading-relaxed">
                Get practical tips tailored to where you are - classroom, cafeteria, or any social setting that feels challenging.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20 relative">
        <div className="max-w-3xl mx-auto text-center glass rounded-3xl p-12 shadow-soft">
          <h2 className="text-3xl font-serif font-semibold text-foreground mb-4">
            Ready to Start Your Journey?
          </h2>
          <p className="text-muted-foreground mb-8 max-w-md mx-auto">
            Join thousands of students who are building confidence one gentle step at a time.
          </p>
          <Link href="/register">
            <Button size="lg" className="rounded-full px-10 py-7 text-base font-medium gradient-primary border-0 text-white hover-lift">
              Get Started Free
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-12 mt-8 relative">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm text-muted-foreground">
            Built with care for introverted souls everywhere.
          </p>
        </div>
      </footer>
    </div>
  )
}

export default function Home() {
  return (
    <AuthProvider>
      <LandingContent />
    </AuthProvider>
  )
}