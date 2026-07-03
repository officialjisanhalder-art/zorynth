import { create } from 'zustand'

interface Profile {
  id: string
  name: string
  avatar_url: string
}

interface ProfileState {
  currentProfile: Profile | null
  profiles: Profile[]
  setProfile: (profile: Profile | null) => void;
  setProfiles: (profiles: Profile[]) => void;
  clearProfile: () => void;
}

export const useProfileStore = create<ProfileState>((set) => ({
  currentProfile: null,
  profiles: [],
  setProfile: (profile) => set({ currentProfile: profile }),
  setProfiles: (profiles) => set({ profiles }),
  clearProfile: () => set({ currentProfile: null }),
}))
