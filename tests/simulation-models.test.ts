import { describe, expect, it } from 'vitest'
import { advancedPhysics, advancedSimulations } from '../src/sims/advanced'
import { electromagnetismSimulations } from '../src/sims/electromagnetism'
import { mathWaveSimulations } from '../src/sims/math-waves'
import { mechanicsPhysics, mechanicsSimulations } from '../src/sims/mechanics'
import { simulationRegistry } from '../src/registry'
import type { SimulationDefinition } from '../src/sims/types'

const definitions: readonly SimulationDefinition[] = [
  ...mechanicsSimulations,
  ...electromagnetismSimulations,
  ...mathWaveSimulations,
  ...advancedSimulations,
]

const defaults = (definition: SimulationDefinition) =>
  Object.fromEntries(definition.params.map((parameter) => [parameter.key, parameter.defaultValue]))

describe('simulation catalog models', () => {
  it('registers every Phase 2-6 model with valid defaults and finite samples', () => {
    expect(simulationRegistry).toHaveLength(definitions.length + 1)
    expect(new Set(simulationRegistry.map((simulation) => simulation.id)).size).toBe(simulationRegistry.length)

    for (const definition of definitions) {
      const params = defaults(definition)
      const domain = definition.domain(params)
      expect(domain.max).toBeGreaterThan(domain.min)
      expect(domain.step).toBeGreaterThan(0)
      expect(definition.challenge.complete(params), `${definition.id} challenge should require an action`).toBe(false)
      for (const parameter of definition.params) {
        expect(params[parameter.key]).toBeGreaterThanOrEqual(parameter.min)
        expect(params[parameter.key]).toBeLessThanOrEqual(parameter.max)
      }

      for (const coordinate of [domain.min, (domain.min + domain.max) / 2, domain.max]) {
        const state = definition.sample(coordinate, params)
        expect(Number.isFinite(state.graphValue), `${definition.id} graph at ${coordinate}`).toBe(true)
        expect(state.position.every(Number.isFinite), `${definition.id} position at ${coordinate}`).toBe(true)
      }
    }
  })

  it('matches projectile range and elastic-collision analytic results', () => {
    expect(mechanicsPhysics.projectileRange(10, 45, 10)).toBeCloseTo(10, 10)
    const [first, second] = mechanicsPhysics.collisionVelocities(1, 1, 3, 0, 1)
    expect(first).toBeCloseTo(0, 12)
    expect(second).toBeCloseTo(3, 12)
  })

  it('keeps conservative oscillator and pendulum energy within the stated numerical tolerance', () => {
    const spring = mechanicsSimulations.find((simulation) => simulation.id === 'spring-mass')
    const hamiltonian = advancedSimulations.find((simulation) => simulation.id === 'hamiltonian-oscillator')
    const pendulum = advancedSimulations.find((simulation) => simulation.id === 'lagrangian-pendulum')
    const doublePendulum = advancedSimulations.find((simulation) => simulation.id === 'double-pendulum')
    if (!spring || !hamiltonian || !pendulum || !doublePendulum) throw new Error('Expected conservative models are missing.')

    expect(spring.sample(60, defaults(spring)).invariant?.relativeDrift).toBeLessThan(1e-12)
    expect(hamiltonian.sample(60, defaults(hamiltonian)).invariant?.relativeDrift).toBeLessThan(1e-12)
    expect(pendulum.sample(60, defaults(pendulum)).invariant?.relativeDrift).toBeLessThan(0.001)
    expect(doublePendulum.sample(60, defaults(doublePendulum)).invariant?.relativeDrift).toBeLessThan(0.001)
  })

  it('shows reduced tunneling transmission for a wider sub-barrier barrier', () => {
    const tunneling = advancedSimulations.find((simulation) => simulation.id === 'quantum-tunneling')
    if (!tunneling) throw new Error('Quantum tunneling model is missing.')
    const params = defaults(tunneling)
    const narrow = tunneling.sample(0, { ...params, width: 0.2 })
    const wide = tunneling.sample(0, { ...params, width: 1.2 })
    const narrowTransmission = narrow.metrics.find((metric) => metric.label === 'Transmission probability')?.value
    const wideTransmission = wide.metrics.find((metric) => metric.label === 'Transmission probability')?.value
    expect(Number.parseFloat(wideTransmission ?? '')).toBeLessThan(Number.parseFloat(narrowTransmission ?? ''))
  })

  it('uses the expected standing-wave nodes and antinode', () => {
    const standing = mathWaveSimulations.find((simulation) => simulation.id === 'standing-waves')
    if (!standing?.waveAt) throw new Error('Standing-wave model is missing its wave function.')
    const params = defaults(standing)
    expect(standing.waveAt(0, 0.3, params)).toBeCloseTo(0, 12)
    expect(standing.waveAt(params.wavelength / 2, 0.3, params)).toBeCloseTo(0, 12)
    expect(Math.abs(standing.waveAt(params.wavelength / 4, 0, params))).toBeCloseTo(params.amplitude, 12)
  })

  it('conserves momentum in a head-on collision for elastic and inelastic restitution', () => {
    const collision = mechanicsSimulations.find((simulation) => simulation.id === 'collisions')
    if (!collision) throw new Error('Collision model is missing.')
    const params = { ...defaults(collision), angle: 0, speed1: 3, speed2: 0, mass1: 2, mass2: 1 }
    for (const restitution of [0, 0.4, 1]) {
      const state = collision.sample(collision.domain(params).max, { ...params, restitution })
      expect(state.invariant?.relativeDrift).toBeLessThan(1e-12)
    }
  })

  it('handles the tunneling threshold with a finite probability', () => {
    const tunneling = advancedSimulations.find((simulation) => simulation.id === 'quantum-tunneling')
    if (!tunneling) throw new Error('Quantum tunneling model is missing.')
    const state = tunneling.sample(0.2, { ...defaults(tunneling), energy: 1, barrier: 1 })
    expect(state.resultValue).not.toContain('undefined')
    expect(Number.parseFloat(state.resultValue)).toBeGreaterThanOrEqual(0)
    expect(Number.parseFloat(state.resultValue)).toBeLessThanOrEqual(100)
  })

  it('keeps double-pendulum energy evaluation finite for a representative state', () => {
    expect(Number.isFinite(advancedPhysics.doublePendulumEnergy([0.6, 0.4, -0.3, 0.2], 1, 1, 1, 1, 9.81))).toBe(true)
  })
})
