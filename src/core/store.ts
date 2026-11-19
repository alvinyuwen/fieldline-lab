import { create } from 'zustand'
import { DEFAULT_TIME_STEP } from './constants'
import { initialState, parametersFromControls, type ParticleState } from './cyclotron'
import { integrateToTime } from './integrator'
import type { ViewPreset } from '../registry'

export type LearningLevel = 'Intuition' | 'Equation' | 'Derivation' | 'Advanced'
export type SimMode = 'G12' | 'Y1'

export interface Controls {
  charge: number
  mass: number
  field: number
  speed: number
  pitch: number
  mode: SimMode
}

export interface SimStore {
  controls: Controls
  elapsed: number
  particle: ParticleState
  playing: boolean
  playbackSpeed: number
  level: LearningLevel
  view: ViewPreset
  orthographic: boolean
  showVelocity: boolean
  showForce: boolean
  showField: boolean
  showTrail: boolean
  showAxes: boolean
  showGrid: boolean
  controlsOpen: boolean
  uiHidden: boolean
  clearTrailSignal: number
  leftPanelOpen: boolean
  rightPanelOpen: boolean
  setControls: (controls: Partial<Controls>) => void
  setMode: (mode: SimMode) => void
  setElapsed: (elapsed: number, particle?: ParticleState) => void
  setPlaying: (playing: boolean) => void
  setPlaybackSpeed: (speed: number) => void
  setLevel: (level: LearningLevel) => void
  setView: (view: ViewPreset) => void
  setOrthographic: (orthographic: boolean) => void
  setUiHidden: (hidden: boolean) => void
  toggle: (key: 'showVelocity' | 'showForce' | 'showField' | 'showTrail' | 'showAxes' | 'showGrid' | 'leftPanelOpen' | 'rightPanelOpen' | 'controlsOpen') => void
  step: () => void
  reset: () => void
  scrub: (elapsed: number) => void
  clearTrail: () => void
}

export const initialControls: Controls = {
  charge: 1,
  mass: 1,
  field: 1,
  speed: 1,
  pitch: 90,
  mode: 'G12',
}

const getParameters = (controls: Controls) => parametersFromControls(
  controls.charge,
  controls.mass,
  controls.field,
  controls.speed,
  controls.pitch,
)

const getInitialParticle = (controls: Controls) => initialState(getParameters(controls))

export const useSimStore = create<SimStore>((set) => ({
  controls: initialControls,
  elapsed: 0,
  particle: getInitialParticle(initialControls),
  playing: true,
  playbackSpeed: 1,
  level: 'Intuition',
  view: 'Isometric',
  orthographic: false,
  showVelocity: true,
  showForce: true,
  showField: true,
  showTrail: true,
  showAxes: true,
  showGrid: true,
  controlsOpen: false,
  uiHidden: false,
  clearTrailSignal: 0,
  leftPanelOpen: true,
  rightPanelOpen: true,
  setControls: (updates) => set((state) => {
    const controls = { ...state.controls, ...updates }
    return { controls, elapsed: 0, particle: getInitialParticle(controls) }
  }),
  setMode: (mode) => set((state) => ({
    controls: { ...state.controls, mode, pitch: mode === 'G12' ? 90 : 55 },
    elapsed: 0,
    particle: getInitialParticle({ ...state.controls, mode, pitch: mode === 'G12' ? 90 : 55 }),
  })),
  setElapsed: (elapsed, particle) => set((state) => ({
    elapsed,
    ...(particle ? { particle } : {}),
    ...(elapsed === 0 ? { particle: getInitialParticle(state.controls) } : {}),
  })),
  setPlaying: (playing) => set({ playing }),
  setPlaybackSpeed: (playbackSpeed) => set({ playbackSpeed }),
  setLevel: (level) => set({ level }),
  setView: (view) => set({ view }),
  setOrthographic: (orthographic) => set({ orthographic }),
  setUiHidden: (uiHidden) => set({ uiHidden }),
  toggle: (key) => set((state) => ({ [key]: !state[key] })),
  step: () => set((state) => {
    const elapsed = state.elapsed + DEFAULT_TIME_STEP
    const particle = integrateToTime(getInitialParticle(state.controls), getParameters(state.controls), elapsed)
    return { elapsed, particle, playing: false }
  }),
  reset: () => set((state) => ({
    ...state,
    controls: initialControls,
    elapsed: 0,
    particle: getInitialParticle(initialControls),
    playing: false,
  })),
  scrub: (elapsed) => set((state) => {
    const boundedTime = Math.max(0, elapsed)
    const particle = integrateToTime(getInitialParticle(state.controls), getParameters(state.controls), boundedTime)
    return { elapsed: boundedTime, particle, playing: false }
  }),
  clearTrail: () => set((state) => ({ clearTrailSignal: state.clearTrailSignal + 1 })),
}))

export const selectParameters = (controls: Controls) => getParameters(controls)
