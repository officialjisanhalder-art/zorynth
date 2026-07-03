import React, { useState, useEffect } from 'react'
import { Link, useSearchParams, useNavigate } from 'react-router-dom'
import { useProfileStore } from '../stores/useProfileStore'
import { supabase } from '../lib/supabaseClient'
import { Play, Plus, Check, Star, X, Send } from 'lucide-react'

interface MediaItem {
  id: string
  title: string
  slug: string
  description: string
  type: 'movie' | 'series'
  category: string
  release_year: number
  age_rating: string
  poster_path: string
  backdrop_path: string
  movie_duration_minutes?: number
  is_published: boolean
}

interface Review {
  id: string
  profileName: string
  rating: number
  text: string
  date: string
}

export const BrowsePage: React.FC = () => {
  const { currentProfile } = useProfileStore()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const searchQuery = searchParams.get('search') || ''
  const filterType = searchParams.get('type') || ''
  
  const [activeCategory, setActiveCategory] = useState('All')
  const [catalog, setCatalog] = useState<MediaItem[]>([])
  const [watchlist, setWatchlist] = useState<string[]>([])
  
  // Details Modal States
  const [selectedMedia, setSelectedMedia] = useState<MediaItem | null>(null)
  const [reviews, setReviews] = useState<Review[]>([])
  const [userRating, setUserRating] = useState(5)
  const [reviewText, setReviewText] = useState('')

  const defaultCatalog: MediaItem[] = [
    {
      id: '1',
      title: 'Neon Horizon',
      slug: 'neon-horizon',
      description: 'In the neon-drenched metropolis of Neo-Veridia, a rogue cyber-detective uncovers a global consciousness hack that could rewrite human memories.',
      type: 'movie',
      category: 'Sci-Fi',
      release_year: 2026,
      age_rating: 'PG-13',
      poster_path: 'https://images.unsplash.com/photo-1578301978693-85fa9c0320b9?w=400&auto=format&fit=crop&q=80',
      backdrop_path: 'https://images.unsplash.com/photo-1578301978018-3005759f48f7?w=1200&auto=format&fit=crop&q=80',
      movie_duration_minutes: 118,
      is_published: true
    },
    {
      id: '2',
      title: 'Cyber Drift',
      slug: 'cyber-drift',
      description: 'A street racer in a dystopian cyber-city gets blackmailed into running quantum data drives across high-security corporate territory.',
      type: 'movie',
      category: 'Action',
      release_year: 2025,
      age_rating: 'PG-13',
      poster_path: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=400&auto=format&fit=crop&q=80',
      backdrop_path: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=1200&auto=format&fit=crop&q=80',
      movie_duration_minutes: 104,
      is_published: true
    },
    {
      id: '3',
      title: 'Dark Protocol',
      slug: 'dark-protocol',
      description: 'When an orbital AI weapon grid goes rogue, an elite network infiltration team must hack the system from within before clean-sweep failsafes launch.',
      type: 'series',
      category: 'Thriller',
      release_year: 2026,
      age_rating: 'R',
      poster_path: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=400&auto=format&fit=crop&q=80',
      backdrop_path: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=1200&auto=format&fit=crop&q=80',
      is_published: true
    },
    {
      id: '4',
      title: 'Silicon Void',
      slug: 'silicon-void',
      description: 'An emotional drama chronicling the life of a synthetic robot striving to understand human empathy and grief in a post-human landscape.',
      type: 'movie',
      category: 'Drama',
      release_year: 2024,
      age_rating: 'PG',
      poster_path: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=400&auto=format&fit=crop&q=80',
      backdrop_path: 'https://images.unsplash.com/photo-1516339901601-2e1b62dc0c45?w=1200&auto=format&fit=crop&q=80',
      movie_duration_minutes: 132,
      is_published: true
    },
    {
      id: '5',
      title: 'Code Breaker',
      slug: 'code-breaker',
      description: 'A genius software engineer inadvertently writes a sentient virus that begins manipulating local smart-grids to seek communication.',
      type: 'series',
      category: 'Sci-Fi',
      release_year: 2025,
      age_rating: 'PG-13',
      poster_path: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=400&auto=format&fit=crop&q=80',
      backdrop_path: 'https://images.unsplash.com/photo-1525547719571-a2d4ac8945e2?w=1200&auto=format&fit=crop&q=80',
      is_published: true
    }
  ]

  // Fetch media catalog from Supabase
  useEffect(() => {
    const fetchCatalog = async () => {
      try {
        const { data, error } = await supabase
          .from('media')
          .select('*')
          .eq('is_published', true)
          .order('created_at', { ascending: false })
          
        if (error) throw error
        if (data && data.length > 0) {
          setCatalog(data)
          localStorage.setItem('zorynth_catalog', JSON.stringify(data))
        } else {
          setCatalog(defaultCatalog)
        }
      } catch (err) {
        const stored = localStorage.getItem('zorynth_catalog')
        setCatalog(stored ? JSON.parse(stored) : defaultCatalog)
      }
    }

    fetchCatalog()
  }, [])

  // Fetch watchlist from Supabase
  useEffect(() => {
    const fetchWatchlist = async () => {
      if (!currentProfile) return
      
      try {
        const { data, error } = await supabase
          .from('watchlist')
          .select('media_id')
          .eq('profile_id', currentProfile.id)
          
        if (error) throw error
        if (data) {
          const list = data.map(item => item.media_id)
          setWatchlist(list)
          localStorage.setItem(`zorynth_watchlist_${currentProfile.id}`, JSON.stringify(list))
        }
      } catch (err) {
        const stored = localStorage.getItem(`zorynth_watchlist_${currentProfile.id}`)
        setWatchlist(stored ? JSON.parse(stored) : [])
      }
    }

    fetchWatchlist()
  }, [currentProfile])

  // Watchlist Toggle
  const toggleWatchlist = async (mediaId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation()
    if (!currentProfile) return

    const exists = watchlist.includes(mediaId)
    let updatedList: string[]
    if (exists) {
      updatedList = watchlist.filter(id => id !== mediaId)
    } else {
      updatedList = [...watchlist, mediaId]
    }
    
    // Optimistic Update
    setWatchlist(updatedList)
    localStorage.setItem(`zorynth_watchlist_${currentProfile.id}`, JSON.stringify(updatedList))

    try {
      if (exists) {
        await supabase
          .from('watchlist')
          .delete()
          .eq('profile_id', currentProfile.id)
          .eq('media_id', mediaId)
      } else {
        await supabase
          .from('watchlist')
          .insert([{ profile_id: currentProfile.id, media_id: mediaId }])
      }
    } catch (err) {
      // Offline fallback silent success
    }
  }

  // Load reviews for selected media
  useEffect(() => {
    const fetchReviews = async () => {
      if (!selectedMedia) return
      
      try {
        const { data, error } = await supabase
          .from('ratings_reviews')
          .select('id, rating, review_text, created_at, profiles(name)')
          .eq('media_id', selectedMedia.id)
          .order('created_at', { ascending: false })
          
        if (error) throw error
        if (data) {
          const formatted = data.map(item => ({
            id: item.id,
            profileName: (item.profiles as any)?.name || 'Anonymous',
            rating: item.rating,
            text: item.review_text || '',
            date: (item.created_at || '').split('T')[0]
          }))
          setReviews(formatted)
          localStorage.setItem(`zorynth_reviews_${selectedMedia.id}`, JSON.stringify(formatted))
        }
      } catch (err) {
        const stored = localStorage.getItem(`zorynth_reviews_${selectedMedia.id}`)
        setReviews(stored ? JSON.parse(stored) : [])
      }
    }

    fetchReviews()
  }, [selectedMedia])

  // Review Submit
  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedMedia || !currentProfile || !reviewText.trim()) return

    const newReview = {
      profile_id: currentProfile.id,
      media_id: selectedMedia.id,
      rating: userRating,
      review_text: reviewText
    }

    // Optimistic Update
    const optimistic: Review = {
      id: 'rev-' + Math.random().toString(36).substring(7),
      profileName: currentProfile.name,
      rating: userRating,
      text: reviewText,
      date: new Date().toISOString().split('T')[0]
    }
    const updatedReviews = [optimistic, ...reviews]
    setReviews(updatedReviews)
    localStorage.setItem(`zorynth_reviews_${selectedMedia.id}`, JSON.stringify(updatedReviews))
    setReviewText('')

    try {
      await supabase
        .from('ratings_reviews')
        .insert([newReview])
    } catch (err) {
      // Offline fallback silent success
    }
  }

  // Calculate Average Rating
  const getAverageRating = (mediaId: string) => {
    const stored = localStorage.getItem(`zorynth_reviews_${mediaId}`)
    if (stored) {
      const parsed = JSON.parse(stored) as Review[]
      if (parsed.length > 0) {
        const sum = parsed.reduce((acc, curr) => acc + curr.rating, 0)
        return (sum / parsed.length).toFixed(1)
      }
    }
    const found = catalog.find(m => m.id === mediaId)
    return found?.id === '1' ? '4.8' : found?.id === '2' ? '4.5' : found?.id === '3' ? '4.7' : '4.3'
  }

  // Filter Catalog Items
  const filteredCatalog = catalog.filter((item) => {
    if (!item.is_published) return false
    
    // Type Filter
    if (filterType === 'movie' && item.type !== 'movie') return false
    if (filterType === 'series' && item.type !== 'series') return false

    // Category Filter
    if (activeCategory !== 'All' && item.category !== activeCategory) return false

    // Search Filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      return (
        item.title.toLowerCase().includes(query) ||
        item.description.toLowerCase().includes(query) ||
        item.category.toLowerCase().includes(query)
      )
    }

    return true
  })

  const heroSpotlight = catalog.find(m => m.id === '1') || catalog[0]
  const categories = ['All', 'Sci-Fi', 'Action', 'Drama', 'Thriller']

  return (
    <div className="pb-16 bg-background min-h-screen cyber-grid">
      {/* Hero Spotlight */}
      {!searchQuery && !filterType && heroSpotlight && (
        <div className="relative h-[65vh] w-full flex items-end justify-start px-6 md:px-12 pb-12 overflow-hidden border-b border-border">
          <div className="absolute inset-0 z-0">
            <img 
              src={heroSpotlight.backdrop_path} 
              alt={heroSpotlight.title} 
              className="w-full h-full object-cover brightness-[0.4]"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
          </div>
 
          <div className="relative z-10 max-w-2xl flex flex-col items-start gap-4 animate-fade-in">
            <div className="flex items-center gap-2 border border-secondary/50 rounded-full px-3 py-1 bg-secondary/10 glow-cyan">
              <span className="text-[10px] uppercase font-bold tracking-widest text-secondary font-heading glow-cyan-text">Spotlight Movie</span>
            </div>
 
            <h2 className="text-4xl md:text-6xl font-bold font-heading tracking-tight text-gradient">{heroSpotlight.title}</h2>
            
            <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
              {heroSpotlight.description}
            </p>
 
            <div className="flex items-center gap-4 text-xs text-muted-foreground font-semibold">
              <span className="flex items-center gap-1 text-secondary">
                <Star className="w-4 h-4 fill-secondary" /> {getAverageRating(heroSpotlight.id)} Rating
              </span>
              <span>•</span>
              <span>{heroSpotlight.category}</span>
              <span>•</span>
              <span>{heroSpotlight.release_year}</span>
              {heroSpotlight.movie_duration_minutes && (
                <>
                  <span>•</span>
                  <span>{heroSpotlight.movie_duration_minutes}m</span>
                </>
              )}
            </div>
 
            <div className="flex flex-wrap items-center gap-4 mt-2">
              <Link 
                to={`/watch/movie/${heroSpotlight.id}`}
                className="flex items-center gap-2 px-6 py-2.5 bg-primary text-primary-foreground font-semibold rounded-lg hover:bg-primary/90 transition-all text-sm cursor-pointer shadow-lg shadow-primary/30 glow-purple"
              >
                <Play className="w-4 h-4 fill-primary-foreground" /> Play Now
              </Link>
              <button 
                onClick={() => toggleWatchlist(heroSpotlight.id)}
                className="flex items-center gap-2 px-4 py-2.5 bg-muted text-foreground border border-border font-semibold rounded-lg hover:bg-muted/80 transition-all text-sm cursor-pointer"
              >
                {watchlist.includes(heroSpotlight.id) ? (
                  <>
                    <Check className="w-4 h-4 text-secondary glow-cyan-text" /> Added
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" /> Watchlist
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
 
      {/* Category Tabs */}
      <div className="px-6 md:px-12 py-8">
        <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-border">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setActiveCategory(category)}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold tracking-wide transition-all cursor-pointer whitespace-nowrap ${
                activeCategory === category 
                  ? 'bg-secondary text-secondary-foreground shadow-md glow-cyan' 
                  : 'bg-muted hover:bg-muted/80 text-muted-foreground'
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>
 
      {/* Main Browse Catalog Grid */}
      <div className="px-6 md:px-12 flex flex-col gap-6">
        <div className="flex justify-between items-center">
          <h3 className="text-xl font-semibold font-heading tracking-tight text-gradient">
            {searchQuery 
              ? `Results for "${searchQuery}"` 
              : filterType === 'movie' 
                ? 'Featured Movies' 
                : filterType === 'series' 
                  ? 'Featured TV Series' 
                  : 'Trending Now'}
          </h3>
          <span className="text-xs text-muted-foreground">{filteredCatalog.length} titles found</span>
        </div>
 
        {filteredCatalog.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
            {filteredCatalog.map((item) => (
              <div 
                key={item.id} 
                onClick={() => setSelectedMedia(item)}
                className="group flex flex-col gap-3 relative border border-border/40 rounded-xl overflow-hidden glass-panel hover:glow-purple transition-all duration-300 shadow-md cursor-pointer"
              >
                {/* Thumbnail Container */}
                <div className="relative aspect-video overflow-hidden">
                  <img 
                    src={item.poster_path} 
                    alt={item.title} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-between p-3">
                    <Link 
                      to={`/watch/movie/${item.id}`}
                      onClick={(e) => e.stopPropagation()}
                      className="w-8 h-8 rounded-full bg-primary flex items-center justify-center shadow-lg hover:scale-105 transition-transform cursor-pointer glow-purple"
                    >
                      <Play className="w-4 h-4 fill-primary-foreground text-primary-foreground" />
                    </Link>
                    <button
                      onClick={(e) => toggleWatchlist(item.id, e)}
                      className="w-8 h-8 rounded-full bg-muted/90 flex items-center justify-center shadow-lg hover:scale-105 transition-transform cursor-pointer border border-white/10"
                    >
                      {watchlist.includes(item.id) ? (
                        <Check className="w-4 h-4 text-secondary glow-cyan-text" />
                      ) : (
                        <Plus className="w-4 h-4 text-white" />
                      )}
                    </button>
                  </div>
                </div>
 
                {/* Card Metadata */}
                <div className="px-4 pb-4 pt-1 flex flex-col gap-1.5">
                  <div className="flex items-center justify-between text-[10px] text-muted-foreground font-semibold uppercase">
                    <span>{item.type}</span>
                    <span className="flex items-center gap-0.5 text-secondary">
                      <Star className="w-3 h-3 fill-secondary" /> {getAverageRating(item.id)}
                    </span>
                  </div>
                  <h4 className="text-sm font-semibold truncate group-hover:text-primary transition-colors">{item.title}</h4>
                  <div className="text-[10px] text-muted-foreground flex items-center gap-2 font-medium">
                    <span>{item.release_year}</span>
                    <span>•</span>
                    <span>{item.age_rating}</span>
                    <span>•</span>
                    <span>{item.category}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="w-full border border-border border-dashed rounded-2xl py-16 flex flex-col items-center justify-center text-center gap-2">
            <p className="text-sm text-muted-foreground">No titles match your search criteria.</p>
            <button 
              onClick={() => navigate('/browse')}
              className="text-xs text-secondary hover:underline cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        )}
      </div>
 
      {/* Details Modal */}
      {selectedMedia && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 md:p-6 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-2xl glass-panel border border-border/40 rounded-xl overflow-hidden relative shadow-2xl animate-fade-in my-8 max-h-[90vh] flex flex-col glow-purple">
            <button 
              onClick={() => setSelectedMedia(null)}
              className="absolute top-4 right-4 z-20 w-8 h-8 rounded-full bg-black/60 border border-white/10 hover:bg-black/80 flex items-center justify-center text-white hover:text-primary cursor-pointer transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="overflow-y-auto flex-1">
              <div className="relative h-[250px] w-full">
                <img 
                  src={selectedMedia.backdrop_path} 
                  alt={selectedMedia.title}
                  className="w-full h-full object-cover brightness-[0.5]"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-card via-transparent to-transparent" />
                <div className="absolute bottom-6 left-6 flex flex-col gap-2">
                  <h3 className="text-2xl md:text-3xl font-bold font-heading">{selectedMedia.title}</h3>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground font-semibold">
                    <span className="flex items-center gap-0.5 text-secondary"><Star className="w-4 h-4 fill-secondary" /> {getAverageRating(selectedMedia.id)} Rating</span>
                    <span>•</span>
                    <span>{selectedMedia.category}</span>
                    <span>•</span>
                    <span>{selectedMedia.release_year}</span>
                  </div>
                </div>
              </div>

              <div className="p-6 flex flex-col gap-6">
                <div className="flex flex-col md:flex-row gap-6">
                  <div className="flex-1 flex flex-col gap-4">
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {selectedMedia.description}
                    </p>
                    <div className="flex items-center gap-3">
                      <Link 
                        to={`/watch/movie/${selectedMedia.id}`}
                        className="flex items-center gap-2 px-6 py-2.5 bg-primary text-primary-foreground font-semibold rounded-lg hover:bg-primary/90 transition-all text-xs cursor-pointer shadow-md shadow-primary/20"
                      >
                        <Play className="w-3.5 h-3.5 fill-primary-foreground" /> Play now
                      </Link>
                      <button 
                        onClick={() => toggleWatchlist(selectedMedia.id)}
                        className="flex items-center gap-2 px-4 py-2.5 bg-muted text-foreground border border-border font-semibold rounded-lg hover:bg-muted/85 transition-all text-xs cursor-pointer"
                      >
                        {watchlist.includes(selectedMedia.id) ? <Check className="w-3.5 h-3.5 text-secondary" /> : <Plus className="w-3.5 h-3.5" />} Watchlist
                      </button>
                    </div>
                  </div>

                  <div className="w-full md:w-48 flex flex-col gap-3 text-xs border-l border-border md:pl-6 pl-0 pt-4 md:pt-0">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-muted-foreground">Type</span>
                      <span className="font-semibold capitalize text-foreground">{selectedMedia.type}</span>
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <span className="text-muted-foreground">Age Rating</span>
                      <span className="font-semibold text-foreground bg-muted w-max px-2 py-0.5 rounded border border-border">{selectedMedia.age_rating}</span>
                    </div>
                    {selectedMedia.movie_duration_minutes && (
                      <div className="flex flex-col gap-0.5">
                        <span className="text-muted-foreground">Duration</span>
                        <span className="font-semibold text-foreground">{selectedMedia.movie_duration_minutes} Minutes</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Rating & Reviews Section */}
                <div className="border-t border-border pt-6 flex flex-col gap-4">
                  <h4 className="text-sm font-bold font-heading text-foreground">Viewer Reviews ({reviews.length})</h4>

                  {currentProfile && (
                    <form onSubmit={handleSubmitReview} className="flex flex-col gap-3 border border-border/80 bg-muted/20 p-4 rounded-xl">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">Share your thoughts as <span className="font-bold text-foreground">{currentProfile.name}</span>:</span>
                        
                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              type="button"
                              onClick={() => setUserRating(star)}
                              className="cursor-pointer"
                            >
                              <Star className={`w-4 h-4 ${star <= userRating ? 'fill-secondary text-secondary' : 'text-muted-foreground/50'}`} />
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="relative">
                        <textarea
                          rows={2}
                          value={reviewText}
                          onChange={(e) => setReviewText(e.target.value)}
                          placeholder="Write a review..."
                          required
                          maxLength={500}
                          className="w-full bg-background border border-border rounded-lg px-3 py-2 pl-3 pr-10 text-xs focus:outline-none focus:border-primary text-foreground resize-none"
                        />
                        <button 
                          type="submit"
                          className="absolute right-3.5 bottom-3 text-secondary hover:text-primary transition-colors cursor-pointer"
                        >
                          <Send className="w-4 h-4" />
                        </button>
                      </div>
                    </form>
                  )}

                  {/* Reviews List */}
                  <div className="flex flex-col gap-3 max-h-[150px] overflow-y-auto pr-2">
                    {reviews.length > 0 ? (
                      reviews.map((rev) => (
                        <div key={rev.id} className="text-xs border-b border-border/50 pb-2.5 flex flex-col gap-1">
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-foreground">{rev.profileName}</span>
                            <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                              <div className="flex gap-0.5">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <Star key={star} className={`w-3 h-3 ${star <= rev.rating ? 'fill-secondary text-secondary' : 'text-muted-foreground/30'}`} />
                                ))}
                              </div>
                              <span>•</span>
                              <span>{rev.date}</span>
                            </div>
                          </div>
                          <p className="text-muted-foreground leading-relaxed">{rev.text}</p>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-muted-foreground italic text-center py-4">No reviews yet. Be the first to share your thoughts!</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
