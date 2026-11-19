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

export const laboratoryEntries: readonly CatalogEntry[] = [
  {
    id: 'electric-fields-lab',
    title: 'Electric fields and charges',
    subtitle: 'Arrange point charges or parallel plates',
    description: 'Arrange charges or plates, then release a test particle to see how electric fields guide its motion.',
    levels: ['G12', 'Y1'],
    category: 'Electric Fields',
  },
  {
    id: 'magnetic-wire-lab',
    title: 'Magnetic field around a wire',
    subtitle: 'A compass explores the field around a conductor',
    description: 'Reverse the current and move a compass probe to explore the circular magnetic field around a straight conductor.',
    levels: ['G12', 'Y1'],
    category: 'Magnetic Fields',
  },
  {
    id: 'solenoid-lab',
    title: 'Solenoids and electromagnets',
    subtitle: 'Build a coil and insert a magnetic core',
    description: 'Change coil current and turns, then compare the magnetic field with and without a soft-iron core.',
    levels: ['G12', 'Y1', 'Y2'],
    category: 'Electromagnetic Devices',
  },
  {
    id: 'cyclotron-lab',
    title: 'Cyclotron particle accelerator',
    subtitle: 'Build energy at each synchronized gap crossing',
    description: 'Inspect a synchronized accelerating gap, then follow how each crossing increases particle energy and orbit radius.',
    levels: ['Y1', 'Y2', 'Y3'],
    category: 'Particle Acceleration',
  },
  {
    id: 'dc-motor-lab',
    title: 'DC motor and magnetic torque',
    subtitle: 'A rotating coil between permanent magnets',
    description: 'Change coil current, field, turns, and area. Follow the commutator as it keeps the motor turning.',
    levels: ['G12', 'Y1', 'Y2'],
    category: 'Electromagnetic Devices',
  },
  {
    id: 'induction-lab',
    title: "Faraday and Lenz's law",
    subtitle: 'A moving magnet induces current in a coil',
    description: 'Move a bar magnet past a coil and track the changing magnetic flux, induced emf, and current direction.',
    levels: ['G12', 'Y1', 'Y2'],
    category: 'Electromagnetic Induction',
  },
]

export const simulationDefinitions: readonly SimulationDefinition[] = [
  ...mechanicsSimulations,
  ...electromagnetismSimulations,
  ...mathWaveSimulations,
  ...advancedSimulations,
]

export const simulationRegistry: readonly CatalogEntry[] = [
  chargedParticle,
  ...laboratoryEntries,
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
