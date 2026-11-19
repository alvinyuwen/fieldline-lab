import { advancedSimulations } from '../sims/advanced'
import { electromagnetismSimulations } from '../sims/electromagnetism'
import { mathWaveSimulations } from '../sims/math-waves'
import { mechanicsSimulations } from '../sims/mechanics'
import type { LearningTier, SimulationDefinition } from '../sims/types'

export type ViewPreset = 'Top' | 'Side' | 'Front' | 'Isometric'

export interface CatalogEntry {
  id: string
  title: string
  subtitle: string
  description: string
  levels: readonly LearningTier[]
  category: string
}

const chargedParticle: CatalogEntry = {
  id: 'charged-particle-magnetic-field',
  title: 'Magnetic motion',
  subtitle: 'Charged particle in a uniform magnetic field',
  description: 'See how a magnetic force bends a moving charge into a circle or a helix.',
  levels: ['G12', 'Y1'],
  category: 'Electromagnetism',
}

export const simulationDefinitions: readonly SimulationDefinition[] = [
  ...mechanicsSimulations,
  ...electromagnetismSimulations,
  ...mathWaveSimulations,
  ...advancedSimulations,
]

export const simulationRegistry: readonly CatalogEntry[] = [
  chargedParticle,
  ...simulationDefinitions.map(({ id, title, description, levels, topic }) => ({
    id,
    title,
    subtitle: description,
    description,
    levels,
    category: topic,
  })),
]

export const activeSimulation = chargedParticle

export const findSimulationDefinition = (id: string) =>
  simulationDefinitions.find((definition) => definition.id === id)

export const findCatalogEntry = (id: string) =>
  simulationRegistry.find((simulation) => simulation.id === id)
