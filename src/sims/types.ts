import type { Vec3 } from '../core/vector'

export type SimulationTopic = 'Mechanics' | 'Electromagnetism' | 'Waves and Optics' | 'Thermal' | 'Modern Physics' | 'Math'
export type LearningTier = 'G12' | 'Y1' | 'Y2' | 'Y3' | 'Y4'
export type SceneKind = 'trajectory' | 'lever' | 'collision' | 'rotation' | 'field' | 'coil' | 'gauss' | 'circuit' | 'wave' | 'surface' | 'phase' | 'quantum' | 'distribution'
export type ParameterValues = Readonly<Record<string, number>>

export interface ParameterDefinition {
  key: string
  name: string
  symbol: string
  unit: string
  min: number
  max: number
  step: number
  defaultValue: number
  scale?: 'linear' | 'log'
}

export interface SimulationDomain {
  variable: string
  unit: string
  min: number
  max: number
  step: number
}

export interface SimulationCursorState {
  coordinate: number
}

export interface SimulationVector {
  key: string
  label: string
  color: string
  vector: Vec3
  origin: Vec3
}

export interface SimulationMetric {
  label: string
  value: string
  unit?: string
}

export interface SimulationSample {
  graphValue: number
  position: Vec3
  velocity?: Vec3
  vectors?: readonly SimulationVector[]
  metrics: readonly SimulationMetric[]
  resultLabel: string
  resultValue: string
  equation: string
  substitution: string
  invariant?: { label: string; value: number; initial: number; relativeDrift: number }
}

export interface SimulationPreset {
  id: string
  label: string
  description: string
  values: Partial<Record<string, number>>
}

export interface SimulationDefinition {
  id: string
  title: string
  topic: SimulationTopic
  levels: readonly LearningTier[]
  description: string
  scene: SceneKind
  params: readonly ParameterDefinition[]
  domain: (params: ParameterValues) => SimulationDomain
  initState: (params: ParameterValues) => SimulationCursorState
  step: (state: SimulationCursorState, params: ParameterValues, dt: number) => SimulationCursorState
  sample: (coordinate: number, params: ParameterValues) => SimulationSample
  waveAt?: (space: number, coordinate: number, params: ParameterValues) => number
  equation: string
  vectors: readonly Omit<SimulationVector, 'vector' | 'origin'>[]
  predictionPrompts: readonly { question: string; options: readonly string[]; answer: number; explanation: string }[]
  depthLevels: Readonly<Record<'Intuition' | 'Equation' | 'Derivation' | 'Advanced', string>>
  presets: readonly SimulationPreset[]
  challenge: { title: string; description: string; complete: (params: ParameterValues) => boolean }
  assumptions: string
  whatToNotice: string
}
