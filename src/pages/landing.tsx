import React from 'react'
import { Link } from 'react-router-dom'
import { Film, Shield, Zap } from 'lucide-react'

export const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center text-center px-6 relative overflow-hidden">
      {/* Background neon glows */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-secondary/10 rounded-full blur-[150px] pointer-events-none" />

      <div className="max-w-3xl relative z-10">
        <div className="flex justify-center mb-6">
          <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20">
            <Film className="w-8 h-8 text-secondary" />
          </div>
        </div>

        <h1 className="text-5xl md:text-7xl font-bold font-heading mb-6 tracking-tight">
          Welcome to <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">ZORYNTH</span>
        </h1>
        
        <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto font-sans leading-relaxed">
          The ultimate cyberpunk high-performance web streaming experience. Discover premium indie cinema and shows with zero lag.
        </p>

        <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
          <Link 
            to="/login"
            className="w-full sm:w-auto px-8 py-3.5 bg-primary text-primary-foreground font-semibold rounded-lg shadow-lg hover:bg-primary/90 transition-all text-center cursor-pointer"
          >
            Start Streaming
          </Link>
          <Link 
            to="/login"
            className="w-full sm:w-auto px-8 py-3.5 bg-muted text-foreground border border-border font-semibold rounded-lg hover:bg-muted/80 transition-all text-center cursor-pointer"
          >
            Sign In
          </Link>
        </div>

        {/* Feature Highlights */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16 text-left">
          <div className="border border-border p-6 rounded-xl bg-card/50 backdrop-blur-sm">
            <Zap className="w-6 h-6 text-secondary mb-3" />
            <h3 className="text-base font-semibold mb-2 font-heading">Sub-second Latency</h3>
            <p className="text-xs text-muted-foreground">Lightning-fast media retrieval and zero layout shifts via Vite and React 19.</p>
          </div>
          <div className="border border-border p-6 rounded-xl bg-card/50 backdrop-blur-sm">
            <Shield className="w-6 h-6 text-primary mb-3" />
            <h3 className="text-base font-semibold mb-2 font-heading">Secure Access</h3>
            <p className="text-xs text-muted-foreground">Data isolated at database levels using PostgreSQL Row Level Security.</p>
          </div>
          <div className="border border-border p-6 rounded-xl bg-card/50 backdrop-blur-sm">
            <Film className="w-6 h-6 text-secondary mb-3" />
            <h3 className="text-base font-semibold mb-2 font-heading">Multi-Profile Sync</h3>
            <p className="text-xs text-muted-foreground">Independent watch logs, watchlists, and resume targets for up to 4 users.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
