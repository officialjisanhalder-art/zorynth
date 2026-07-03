import React, { useRef, useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useProfileStore } from '../stores/useProfileStore'
import { supabase } from '../lib/supabaseClient'
import { Play, Pause, Volume2, VolumeX, Maximize, Minimize, ArrowLeft, RotateCcw, RotateCw, Settings } from 'lucide-react'

interface SubtitleLine {
  start: number
  end: number
  en: string
  es: string
}

export const PlayerPage: React.FC = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { currentProfile } = useProfileStore()
  
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(1)
  const [isMuted, setIsMuted] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showControls, setShowControls] = useState(true)
  
  // Settings menu states
  const [showSettings, setShowSettings] = useState(false)
  const [playbackSpeed, setPlaybackSpeed] = useState(1.0)
  const [resolution, setResolution] = useState('1080p')
  const [subtitleLang, setSubtitleLang] = useState<'off' | 'en' | 'es'>('en')

  const mockVideoSource = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4'

  const subtitles: SubtitleLine[] = [
    { start: 0, end: 3, en: '[Upbeat cinematic music plays]', es: '[Suena música cinematográfica alegre]' },
    { start: 4, end: 8, en: 'Narrator: Welcome to Neon Horizon. A Zorynth Original.', es: 'Narrador: Bienvenido a Neon Horizon. Un Original de Zorynth.' },
    { start: 9, end: 14, en: 'Narrator: In this city, memories are the only currency that matters.', es: 'Narrador: En esta ciudad, los recuerdos son la única moneda que importa.' },
    { start: 15, end: 20, en: 'Narrator: And someone is hacking them.', es: 'Narrador: Y alguien los está hackeando.' },
    { start: 21, end: 25, en: '[Dramatic synthesizer beats rise]', es: '[Suben los ritmos dramáticos de sintetizador]' },
    { start: 26, end: 30, en: "Sarah: 'We have to find the source before the grid resets.'", es: "Sarah: 'Tenemos que encontrar la fuente antes de reiniciar la red.'" },
    { start: 31, end: 35, en: "Marcus: 'It's too late. The consciousness hack has already begun.'", es: "Marcus: 'Es demasiado tarde. El hackeo de conciencia ya ha comenzado.'" }
  ]

  const activeSubtitle = subtitleLang === 'off' 
    ? '' 
    : subtitles.find(line => currentTime >= line.start && currentTime <= line.end)?.[subtitleLang] || ''

  // Controls overlay auto-hide timer
  useEffect(() => {
    let timeoutId: number
    const resetTimer = () => {
      setShowControls(true)
      clearTimeout(timeoutId)
      timeoutId = window.setTimeout(() => {
        if (!showSettings) setShowControls(false)
      }, 3000)
    }

    window.addEventListener('mousemove', resetTimer)
    resetTimer()

    return () => {
      window.removeEventListener('mousemove', resetTimer)
      clearTimeout(timeoutId)
    }
  }, [showSettings])

  // Restore history progress on mount
  useEffect(() => {
    const fetchHistory = async () => {
      if (!currentProfile || !id) return
      
      try {
        const { data, error } = await supabase
          .from('watch_history')
          .select('progress_seconds')
          .eq('profile_id', currentProfile.id)
          .eq('media_id', id)
          .single()
          
        if (error) throw error
        if (data && videoRef.current) {
          videoRef.current.currentTime = data.progress_seconds
          setCurrentTime(data.progress_seconds)
        }
      } catch (err) {
        // Fallback local storage
        const storedHistory = localStorage.getItem(`zorynth_history_${currentProfile.id}`)
        if (storedHistory && videoRef.current) {
          const historyObj = JSON.parse(storedHistory)
          const savedProgress = historyObj[id]
          if (savedProgress) {
            videoRef.current.currentTime = savedProgress
            setCurrentTime(savedProgress)
          }
        }
      }
    }

    fetchHistory()
  }, [currentProfile, id])

  // Save progress heartbeat
  useEffect(() => {
    if (!isPlaying || !currentProfile || !id) return

    const intervalId = setInterval(async () => {
      if (videoRef.current) {
        const progress = videoRef.current.currentTime
        
        // Local backup
        const storedHistory = localStorage.getItem(`zorynth_history_${currentProfile.id}`)
        const historyObj = storedHistory ? JSON.parse(storedHistory) : {}
        historyObj[id] = progress
        localStorage.setItem(`zorynth_history_${currentProfile.id}`, JSON.stringify(historyObj))

        // DB Upsert progress
        try {
          await supabase
            .from('watch_history')
            .upsert({
              profile_id: currentProfile.id,
              media_id: id,
              progress_seconds: Math.floor(progress),
              is_completed: progress >= (duration - 10)
            }, { onConflict: 'profile_id,media_id' })
        } catch (err) {
          // Silent fallback ignore
        }
      }
    }, 5000)

    return () => clearInterval(intervalId)
  }, [isPlaying, currentProfile, id, duration])

  const handlePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause()
      } else {
        videoRef.current.play()
      }
      setIsPlaying(!isPlaying)
    }
  }

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime)
    }
  }

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration)
    }
  }

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value)
    if (videoRef.current) {
      videoRef.current.currentTime = time
      setCurrentTime(time)
    }
  }

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const vol = parseFloat(e.target.value)
    setVolume(vol)
    if (videoRef.current) {
      videoRef.current.volume = vol
      videoRef.current.muted = vol === 0
      setIsMuted(vol === 0)
    }
  }

  const handleToggleMute = () => {
    if (videoRef.current) {
      const nextMuted = !isMuted
      videoRef.current.muted = nextMuted
      setIsMuted(nextMuted)
    }
  }

  const handleToggleFullscreen = () => {
    const container = document.getElementById('player-container')
    if (container) {
      if (!isFullscreen) {
        if (container.requestFullscreen) container.requestFullscreen()
      } else {
        if (document.exitFullscreen) document.exitFullscreen()
      }
      setIsFullscreen(!isFullscreen)
    }
  }

  const handleSkip = (seconds: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime += seconds
    }
  }

  const handleSpeedChange = (speed: number) => {
    setPlaybackSpeed(speed)
    if (videoRef.current) {
      videoRef.current.playbackRate = speed
    }
  }

  const formatTime = (timeInSeconds: number) => {
    const mins = Math.floor(timeInSeconds / 60)
    const secs = Math.floor(timeInSeconds % 60)
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`
  }

  return (
    <div 
      id="player-container"
      className="fixed inset-0 z-50 bg-black flex items-center justify-center select-none"
    >
      <video
        ref={videoRef}
        src={mockVideoSource}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onClick={handlePlayPause}
        className="w-full h-full max-h-screen object-contain cursor-pointer"
      />

      {/* Subtitles text overlay */}
      {activeSubtitle && (
        <div className="absolute bottom-28 left-1/2 -translate-x-1/2 bg-black/80 px-5 py-2.5 rounded-xl border border-white/10 text-center max-w-xl md:max-w-2xl shadow-2xl pointer-events-none transition-all duration-300">
          <span className="text-white text-base md:text-lg font-medium leading-relaxed font-sans">{activeSubtitle}</span>
        </div>
      )}

      {/* Controls Overlay UI */}
      <div 
        className={`absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/60 flex flex-col justify-between p-6 transition-opacity duration-300 ${
          showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        {/* Top bar */}
        <div className="flex items-center justify-between">
          <button 
            onClick={() => navigate('/browse')}
            className="flex items-center gap-2 text-white hover:text-primary transition-colors cursor-pointer bg-black/40 hover:bg-black/60 px-3 py-1.5 rounded-lg border border-white/10"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm font-semibold font-heading">Exit</span>
          </button>
          
          <span className="text-sm text-white/95 font-semibold tracking-wider font-heading">Now Streaming: Neon Horizon</span>
        </div>

        {/* Bottom controls */}
        <div className="flex flex-col gap-4 relative">
          {/* Settings Menu */}
          {showSettings && (
            <div className="absolute bottom-16 right-0 bg-card border border-border w-64 rounded-xl p-4 shadow-2xl flex flex-col gap-4 animate-fade-in text-xs z-30">
              <div className="flex justify-between items-center border-b border-border pb-2">
                <span className="font-bold text-foreground font-heading">Playback Settings</span>
                <button onClick={() => setShowSettings(false)} className="text-muted-foreground hover:text-foreground cursor-pointer">Close</button>
              </div>

              {/* Speed */}
              <div className="flex flex-col gap-1.5">
                <span className="text-muted-foreground font-semibold">Playback Speed</span>
                <div className="grid grid-cols-4 gap-1">
                  {[0.5, 1.0, 1.5, 2.0].map((sp) => (
                    <button
                      key={sp}
                      onClick={() => handleSpeedChange(sp)}
                      className={`py-1 rounded border cursor-pointer transition-all ${
                        playbackSpeed === sp ? 'bg-primary border-primary text-primary-foreground' : 'bg-background border-border text-foreground hover:bg-muted'
                      }`}
                    >
                      {sp}x
                    </button>
                  ))}
                </div>
              </div>

              {/* Resolution */}
              <div className="flex flex-col gap-1.5">
                <span className="text-muted-foreground font-semibold">Resolution Quality</span>
                <div className="flex gap-1">
                  {['1080p', '720p', '480p'].map((res) => (
                    <button
                      key={res}
                      onClick={() => setResolution(res)}
                      className={`flex-1 py-1 rounded border cursor-pointer transition-all ${
                        resolution === res ? 'bg-primary border-primary text-primary-foreground' : 'bg-background border-border text-foreground hover:bg-muted'
                      }`}
                    >
                      {res}
                    </button>
                  ))}
                </div>
              </div>

              {/* Subtitles */}
              <div className="flex flex-col gap-1.5">
                <span className="text-muted-foreground font-semibold">Subtitles Track</span>
                <div className="flex gap-1">
                  {[
                    { id: 'off', label: 'Off' },
                    { id: 'en', label: 'English' },
                    { id: 'es', label: 'Spanish' }
                  ].map((sub) => (
                    <button
                      key={sub.id}
                      onClick={() => setSubtitleLang(sub.id as any)}
                      className={`flex-1 py-1 rounded border cursor-pointer transition-all ${
                        subtitleLang === sub.id ? 'bg-primary border-primary text-primary-foreground' : 'bg-background border-border text-foreground hover:bg-muted'
                      }`}
                    >
                      {sub.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Progress bar */}
          <div className="flex items-center gap-4 text-xs text-white/90">
            <span>{formatTime(currentTime)}</span>
            <input 
              type="range"
              min="0"
              max={duration || 100}
              value={currentTime}
              onChange={handleSeek}
              className="flex-1 accent-primary bg-white/20 h-1.5 rounded-lg appearance-none cursor-pointer"
            />
            <span>{formatTime(duration)}</span>
          </div>

          {/* Control Buttons */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <button 
                onClick={handlePlayPause}
                className="text-white hover:text-primary transition-all hover:scale-105 cursor-pointer"
              >
                {isPlaying ? <Pause className="w-6 h-6 fill-white" /> : <Play className="w-6 h-6 fill-white" />}
              </button>

              <button onClick={() => handleSkip(-10)} className="text-white hover:text-secondary transition-all cursor-pointer">
                <RotateCcw className="w-5 h-5" />
              </button>
              <button onClick={() => handleSkip(10)} className="text-white hover:text-secondary transition-all cursor-pointer">
                <RotateCw className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-2">
                <button onClick={handleToggleMute} className="text-white hover:text-secondary transition-all cursor-pointer">
                  {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                </button>
                <input 
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={isMuted ? 0 : volume}
                  onChange={handleVolumeChange}
                  className="w-20 accent-secondary bg-white/20 h-1 rounded-lg appearance-none cursor-pointer"
                />
              </div>
            </div>

            <div className="flex items-center gap-4">
              <button 
                onClick={() => setShowSettings(!showSettings)}
                className={`text-white hover:text-primary transition-all cursor-pointer ${showSettings ? 'rotate-45 text-primary' : ''}`}
              >
                <Settings className="w-5 h-5" />
              </button>

              <button 
                onClick={handleToggleFullscreen}
                className="text-white hover:text-secondary transition-all cursor-pointer"
              >
                {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
