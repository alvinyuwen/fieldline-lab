import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type RenderQuality = 'low' | 'medium' | 'high'

interface SiteState {
  visited: string[]
  completed: string[]
  quality: RenderQuality
  reduceEffects: boolean
  markVisited: (simulationId: string) => void
  markCompleted: (simulationId: string) => void
  setQuality: (quality: RenderQuality) => void
  setReduceEffects: (reduceEffects: boolean) => void
}

export const useSiteStore = create<SiteState>()(
  persist(
    (set) => ({
      visited: [],
      completed: [],
      quality: 'medium',
      reduceEffects: false,
      markVisited: (simulationId) => set((state) => ({
        visited: state.visited.includes(simulationId) ? state.visited : [...state.visited, simulationId],
      })),
      markCompleted: (simulationId) => set((state) => ({
        completed: state.completed.includes(simulationId) ? state.completed : [...state.completed, simulationId],
      })),
      setQuality: (quality) => set({ quality }),
      setReduceEffects: (reduceEffects) => set({ reduceEffects }),
    }),
    { name: 'fieldline-lab-progress' },
  ),
)
