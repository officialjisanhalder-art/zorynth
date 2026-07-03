import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabaseAdmin } from '../lib/supabaseClient'
import { Plus, Trash2, Edit2, CheckCircle, EyeOff, Film, ArrowLeft } from 'lucide-react'

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

export const AdminContentPage: React.FC = () => {
  const [catalog, setCatalog] = useState<MediaItem[]>([])
  
  // Form states
  const [editingId, setEditingId] = useState<string | null>(null)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [type, setType] = useState<'movie' | 'series'>('movie')
  const [category, setCategory] = useState('Sci-Fi')
  const [year, setYear] = useState(new Date().getFullYear())
  const [rating, setRating] = useState('PG-13')
  const [posterUrl, setPosterUrl] = useState('')
  const [backdropUrl, setBackdropUrl] = useState('')
  const [duration, setDuration] = useState<number | ''>('')

  // Fetch catalog
  const fetchCatalog = async () => {
    try {
      const { data, error } = await supabaseAdmin
        .from('media')
        .select('*')
        .order('created_at', { ascending: false })
        
      if (error) throw error
      if (data) {
        setCatalog(data)
        localStorage.setItem('zorynth_catalog', JSON.stringify(data))
      }
    } catch (err) {
      const stored = localStorage.getItem('zorynth_catalog')
      if (stored) {
        setCatalog(JSON.parse(stored))
      }
    }
  }

  useEffect(() => {
    fetchCatalog()
  }, [])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !description.trim()) return

    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-')

    const mediaData: any = {
      title,
      slug,
      description,
      type,
      category,
      release_year: Number(year),
      age_rating: rating,
      poster_path: posterUrl || 'https://images.unsplash.com/photo-1594909122845-11baa439b7bf?w=400&auto=format&fit=crop&q=80',
      backdrop_path: backdropUrl || 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=1200&auto=format&fit=crop&q=80',
      movie_duration_minutes: type === 'movie' && duration ? Number(duration) : null,
      is_published: editingId ? (catalog.find(m => m.id === editingId)?.is_published ?? true) : true
    }

    try {
      if (editingId) {
        const { error } = await supabaseAdmin
          .from('media')
          .update(mediaData)
          .eq('id', editingId)
          
        if (error) throw error
      } else {
        const { error } = await supabaseAdmin
          .from('media')
          .insert([mediaData])
          
        if (error) throw error
      }
      fetchCatalog()
      resetForm()
    } catch (err) {
      let updated: MediaItem[]
      const localData = {
        id: editingId || 'm-' + Math.random().toString(36).substring(7),
        ...mediaData
      }
      if (editingId) {
        updated = catalog.map(m => m.id === editingId ? localData : m)
      } else {
        updated = [...catalog, localData]
      }
      setCatalog(updated)
      localStorage.setItem('zorynth_catalog', JSON.stringify(updated))
      resetForm()
    }
  }

  const handleEdit = (item: MediaItem) => {
    setEditingId(item.id)
    setTitle(item.title)
    setDescription(item.description)
    setType(item.type)
    setCategory(item.category)
    setYear(item.release_year)
    setRating(item.age_rating)
    setPosterUrl(item.poster_path)
    setBackdropUrl(item.backdrop_path)
    setDuration(item.movie_duration_minutes || '')
  }

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabaseAdmin
        .from('media')
        .delete()
        .eq('id', id)
        
      if (error) throw error
      fetchCatalog()
    } catch (err) {
      const updated = catalog.filter(m => m.id !== id)
      setCatalog(updated)
      localStorage.setItem('zorynth_catalog', JSON.stringify(updated))
    }
  }

  const handleTogglePublish = async (item: MediaItem) => {
    const nextPublished = !item.is_published
    
    try {
      const { error } = await supabaseAdmin
        .from('media')
        .update({ is_published: nextPublished })
        .eq('id', item.id)
        
      if (error) throw error
      fetchCatalog()
    } catch (err) {
      const updated = catalog.map((m) => {
        if (m.id === item.id) {
          return { ...m, is_published: nextPublished }
        }
        return m
      })
      setCatalog(updated)
      localStorage.setItem('zorynth_catalog', JSON.stringify(updated))
    }
  }

  const resetForm = () => {
    setEditingId(null)
    setTitle('')
    setDescription('')
    setType('movie')
    setCategory('Sci-Fi')
    setYear(new Date().getFullYear())
    setRating('PG-13')
    setPosterUrl('')
    setBackdropUrl('')
    setDuration('')
  }

  return (
    <div className="p-6 md:p-8 bg-background min-h-screen flex flex-col gap-8">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div className="flex items-center gap-4">
          <Link 
            to="/" 
            className="flex items-center justify-center w-8 h-8 rounded-lg bg-muted border border-border hover:bg-muted/80 text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold font-heading text-foreground flex items-center gap-2">
              <Film className="w-7 h-7 text-secondary" /> CMS Video Catalog
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">Manage your movies, series, titles, and live content states.</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Form */}
        <div className="lg:col-span-1 border border-border rounded-xl p-6 bg-card/40 flex flex-col gap-4 shadow-xl max-h-[85vh] overflow-y-auto">
          <h3 className="font-bold font-heading text-foreground text-sm border-b border-border pb-2 flex items-center gap-2">
            <Plus className="w-4 h-4 text-secondary" /> {editingId ? 'Edit Media Title' : 'Add New Media Title'}
          </h3>

          <form onSubmit={handleSave} className="flex flex-col gap-4 text-xs">
            <div className="flex flex-col gap-1">
              <label className="text-muted-foreground font-medium">Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Neon Horizon"
                required
                className="w-full bg-background border border-border rounded-lg px-3 py-2 text-foreground focus:outline-none focus:border-primary"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-muted-foreground font-medium">Type</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as any)}
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 text-foreground focus:outline-none focus:border-primary"
                >
                  <option value="movie">Movie</option>
                  <option value="series">TV Show</option>
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-muted-foreground font-medium">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 text-foreground focus:outline-none focus:border-primary"
                >
                  <option value="Sci-Fi">Sci-Fi</option>
                  <option value="Action">Action</option>
                  <option value="Drama">Drama</option>
                  <option value="Thriller">Thriller</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-muted-foreground font-medium">Release Year</label>
                <input
                  type="number"
                  min={1900}
                  max={2100}
                  value={year}
                  onChange={(e) => setYear(Number(e.target.value))}
                  required
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 text-foreground focus:outline-none focus:border-primary"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-muted-foreground font-medium">Age Rating</label>
                <input
                  type="text"
                  value={rating}
                  onChange={(e) => setRating(e.target.value)}
                  placeholder="e.g. PG-13"
                  required
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 text-foreground focus:outline-none focus:border-primary"
                />
              </div>
            </div>

            {type === 'movie' && (
              <div className="flex flex-col gap-1">
                <label className="text-muted-foreground font-medium">Duration (minutes)</label>
                <input
                  type="number"
                  min={1}
                  value={duration}
                  onChange={(e) => setDuration(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="e.g. 120"
                  required={type === 'movie'}
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 text-foreground focus:outline-none focus:border-primary"
                />
              </div>
            )}

            <div className="flex flex-col gap-1">
              <label className="text-muted-foreground font-medium">Poster Image URL</label>
              <input
                type="url"
                value={posterUrl}
                onChange={(e) => setPosterUrl(e.target.value)}
                placeholder="https://..."
                className="w-full bg-background border border-border rounded-lg px-3 py-2 text-foreground focus:outline-none focus:border-primary"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-muted-foreground font-medium">Backdrop Image URL</label>
              <input
                type="url"
                value={backdropUrl}
                onChange={(e) => setBackdropUrl(e.target.value)}
                placeholder="https://..."
                className="w-full bg-background border border-border rounded-lg px-3 py-2 text-foreground focus:outline-none focus:border-primary"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-muted-foreground font-medium">Description</label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Plot summary..."
                required
                className="w-full bg-background border border-border rounded-lg px-3 py-2 text-foreground focus:outline-none focus:border-primary resize-none"
              />
            </div>

            <div className="flex items-center gap-3 mt-4">
              {editingId && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="flex-1 py-2 border border-border rounded-lg hover:bg-muted text-foreground transition-all cursor-pointer font-semibold"
                >
                  Cancel
                </button>
              )}
              <button
                type="submit"
                className="flex-1 py-2 bg-primary text-primary-foreground font-semibold rounded-lg hover:bg-primary/95 transition-all cursor-pointer"
              >
                {editingId ? 'Update Title' : 'Publish Title'}
              </button>
            </div>
          </form>
        </div>

        {/* Media Grid */}
        <div className="lg:col-span-2 border border-border rounded-xl overflow-hidden bg-card/40 flex flex-col shadow-xl">
          <div className="border-b border-border px-6 py-4 flex items-center justify-between bg-card/60">
            <h3 className="font-bold font-heading text-foreground text-sm">Media Catalog ({catalog.length})</h3>
            <span className="text-xs text-muted-foreground">Manage active streams.</span>
          </div>

          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-border bg-muted/20 text-muted-foreground font-bold font-heading uppercase text-[10px]">
                  <th className="px-6 py-3">Title</th>
                  <th className="px-6 py-3">Category</th>
                  <th className="px-6 py-3">Type</th>
                  <th className="px-6 py-3">Release</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {catalog.map((item) => (
                  <tr key={item.id} className="hover:bg-muted/10 transition-colors">
                    <td className="px-6 py-4 font-medium text-foreground">{item.title}</td>
                    <td className="px-6 py-4 text-muted-foreground">{item.category}</td>
                    <td className="px-6 py-4 capitalize text-muted-foreground">{item.type}</td>
                    <td className="px-6 py-4 text-muted-foreground">{item.release_year}</td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleTogglePublish(item)}
                        className={`flex items-center gap-1 px-2.5 py-0.5 rounded-full border text-[10px] font-semibold cursor-pointer transition-all ${
                          item.is_published
                            ? 'bg-green-500/10 border-green-500/20 text-green-400'
                            : 'bg-muted border-border text-muted-foreground'
                        }`}
                      >
                        {item.is_published ? (
                          <>
                            <CheckCircle className="w-3.5 h-3.5" /> Published
                          </>
                        ) : (
                          <>
                            <EyeOff className="w-3.5 h-3.5" /> Draft
                          </>
                        )}
                      </button>
                    </td>
                    <td className="px-6 py-4 text-right flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleEdit(item)}
                        className="p-1.5 border border-border rounded hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer transition-all"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="p-1.5 border border-destructive/20 rounded hover:bg-destructive/10 text-destructive cursor-pointer transition-all"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}

