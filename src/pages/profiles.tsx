import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useProfileStore } from '../stores/useProfileStore'
import { useAuthStore } from '../stores/useAuthStore'
import { supabase } from '../lib/supabaseClient'
import { Plus, X } from 'lucide-react'

export const ProfilesPage: React.FC = () => {
  const { user } = useAuthStore()
  const { setProfile, profiles, setProfiles } = useProfileStore()
  const [showAddModal, setShowAddModal] = useState(false)
  const [newName, setNewName] = useState('')
  const [selectedAvatar, setSelectedAvatar] = useState(0)
  const navigate = useNavigate()

  const defaultAvatars = [
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80',
  ]

  // Fetch profiles from Supabase on mount
  useEffect(() => {
    const fetchProfiles = async () => {
      if (!user) return
      
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', user.id)
          
        if (error) throw error
        if (data && data.length > 0) {
          setProfiles(data)
          localStorage.setItem('zorynth_profiles', JSON.stringify(data))
        } else {
          // No profiles found in DB, fallback to default mock set
          const initial = [
            { id: 'p1', name: 'Sarah', avatar_url: defaultAvatars[0] },
            { id: 'p2', name: 'Marcus', avatar_url: defaultAvatars[1] }
          ]
          setProfiles(initial)
        }
      } catch (err) {
        // Local storage fallback if Supabase unconfigured / offline
        const stored = localStorage.getItem('zorynth_profiles')
        if (stored) {
          setProfiles(JSON.parse(stored))
        } else {
          const initial = [
            { id: 'p1', name: 'Sarah', avatar_url: defaultAvatars[0] },
            { id: 'p2', name: 'Marcus', avatar_url: defaultAvatars[1] }
          ]
          setProfiles(initial)
          localStorage.setItem('zorynth_profiles', JSON.stringify(initial))
        }
      }
    }

    fetchProfiles()
  }, [user, setProfiles])

  const handleSelectProfile = (profile: any) => {
    setProfile(profile)
    navigate('/browse')
  }

  const handleCreateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newName.trim() || !user) return

    const newProfile = {
      user_id: user.id,
      name: newName,
      avatar_url: defaultAvatars[selectedAvatar],
    }

    try {
      // Save profile to Supabase database
      const { data, error } = await supabase
        .from('profiles')
        .insert([newProfile])
        .select()
        .single()
        
      if (error) throw error
      if (data) {
        const updated = [...profiles, data]
        setProfiles(updated)
        localStorage.setItem('zorynth_profiles', JSON.stringify(updated))
      }
    } catch (err) {
      // Local fallback persistence
      const fallback = {
        id: 'p-' + Math.random().toString(36).substring(7),
        ...newProfile
      }
      const updated = [...profiles, fallback]
      setProfiles(updated)
      localStorage.setItem('zorynth_profiles', JSON.stringify(updated))
    }
    
    setNewName('')
    setShowAddModal(false)
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center px-6 relative">
      <h1 className="text-3xl md:text-4xl font-bold font-heading mb-12 tracking-tight text-center">
        Who's watching?
      </h1>

      <div className="flex flex-wrap justify-center items-center gap-8 max-w-4xl">
        {profiles.map((profile) => (
          <button
            key={profile.id}
            onClick={() => handleSelectProfile(profile)}
            className="flex flex-col items-center gap-4 group cursor-pointer"
          >
            <div className="w-28 h-28 md:w-32 md:h-32 rounded-2xl overflow-hidden border-2 border-transparent group-hover:border-primary group-hover:shadow-[0_0_15px_rgba(170,59,255,0.4)] transition-all duration-300">
              <img 
                src={profile.avatar_url} 
                alt={profile.name} 
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
            </div>
            <span className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">
              {profile.name}
            </span>
          </button>
        ))}

        {/* Add profile button */}
        {profiles.length < 4 && (
          <button 
            onClick={() => setShowAddModal(true)}
            className="flex flex-col items-center gap-4 group cursor-pointer opacity-50 hover:opacity-100 transition-opacity"
          >
            <div className="w-28 h-28 md:w-32 md:h-32 rounded-2xl border-2 border-dashed border-border group-hover:border-primary flex items-center justify-center transition-colors">
              <Plus className="w-8 h-8 text-muted-foreground group-hover:text-primary transition-colors" />
            </div>
            <span className="text-sm font-medium text-muted-foreground group-hover:text-primary transition-colors">
              Add Profile
            </span>
          </button>
        )}
      </div>

      {/* Add Profile Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-6 backdrop-blur-sm">
          <div className="w-full max-w-md bg-card border border-border rounded-xl p-8 relative shadow-2xl animate-fade-in">
            <button 
              onClick={() => setShowAddModal(false)}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-xl font-bold font-heading mb-2">Create Profile</h3>
            <p className="text-xs text-muted-foreground mb-6">Set up a profile with a name and avatar below.</p>

            <form onSubmit={handleCreateProfile} className="flex flex-col gap-6">
              {/* Profile Name */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-muted-foreground font-medium">Profile Name</label>
                <input 
                  type="text" 
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Guest"
                  required
                  maxLength={15}
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary transition-colors text-foreground"
                />
              </div>

              {/* Avatar Grid */}
              <div className="flex flex-col gap-2">
                <label className="text-xs text-muted-foreground font-medium">Choose Avatar</label>
                <div className="grid grid-cols-4 gap-4">
                  {defaultAvatars.map((url, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setSelectedAvatar(idx)}
                      className={`aspect-square rounded-xl overflow-hidden border-2 cursor-pointer transition-all ${
                        selectedAvatar === idx ? 'border-primary scale-105 shadow-md shadow-primary/20' : 'border-transparent opacity-60 hover:opacity-100'
                      }`}
                    >
                      <img src={url} alt="Avatar" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-4 mt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-2 bg-muted text-foreground border border-border font-semibold rounded-lg hover:bg-muted/80 transition-all text-sm cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-primary text-primary-foreground font-semibold rounded-lg hover:bg-primary/90 transition-all text-sm cursor-pointer"
                >
                  Save Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
