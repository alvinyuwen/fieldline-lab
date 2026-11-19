import { describe, expect, it } from 'vitest'
import {
  advanceElectricParticle,
  electricFieldAt,
  electricForce,
  sampleElectricTrajectory,
  traceElectricFieldLines,
  type ElectricParticleSettings,
} from '../src/sims/labs/electric-field-physics'

const settings: ElectricParticleSettings = {
  mode: 'charges',
  charges: [{ id: 'source', x: 0, y: 0, chargeMicroC: 1 }],
  plateVoltage: 0,
  plateGap: 1,
  particleChargeNanoC: 1,
  particleMassMg: 1,
}

describe('electric field laboratory physics', () => {
  it('uses Coulomb field magnitude and points away from a positive charge', () => {
    const field = electricFieldAt({ x: 1, y: 0 }, settings)
    expect(field.x).toBeCloseTo(8_987.55, 1)
    expect(field.y).toBeCloseTo(0)
  })

  it('reverses the field direction for a negative source and sums fields', () => {
    const negative = electricFieldAt({ x: 1, y: 0 }, {
      ...settings,
      charges: [{ id: 'source', x: 0, y: 0, chargeMicroC: -1 }],
    })
    expect(negative.x).toBeLessThan(0)

    const midpoint = electricFieldAt({ x: 0, y: 0 }, {
      ...settings,
      charges: [
        { id: 'left', x: -1, y: 0, chargeMicroC: 1 },
        { id: 'right', x: 1, y: 0, chargeMicroC: -1 },
      ],
    })
    expect(midpoint.x).toBeGreaterThan(0)
    expect(midpoint.y).toBeCloseTo(0)
  })

  it('gives a uniform field between ideal parallel plates', () => {
    const field = electricFieldAt({ x: 0, y: -2 }, { ...settings, mode: 'plates', plateVoltage: 120, plateGap: 0.4 })
    expect(field).toEqual({ x: 300, y: 0 })
  })

  it('applies force and acceleration with the test-particle charge sign', () => {
    const field = { x: 200, y: 0 }
    expect(electricForce(2, field).x).toBeCloseTo(4e-7)
    const particle = advanceElectricParticle(
      { x: 0, y: 0, vx: 0, vy: 0 },
      { ...settings, mode: 'plates', plateVoltage: 200, plateGap: 1, particleMassMg: 1 },
      0.01,
    )
    expect(particle.vx).toBeCloseTo(0.002)
    const negativeParticle = advanceElectricParticle(
      { x: 0, y: 0, vx: 0, vy: 0 },
      { ...settings, mode: 'plates', plateVoltage: 200, plateGap: 1, particleChargeNanoC: -1, particleMassMg: 1 },
      0.01,
    )
    expect(negativeParticle.vx).toBeCloseTo(-0.002)
  })

  it('returns a reproducible trajectory and charge-origin field lines', () => {
    const first = sampleElectricTrajectory({ x: 0, y: -1, vx: 0, vy: 0 }, { ...settings, mode: 'plates', plateVoltage: 10, plateGap: 1 }, 1)
    const second = sampleElectricTrajectory({ x: 0, y: -1, vx: 0, vy: 0 }, { ...settings, mode: 'plates', plateVoltage: 10, plateGap: 1 }, 1)
    expect(first).toEqual(second)
    expect(first.at(-1)?.x).toBeGreaterThan(0)
    expect(traceElectricFieldLines(settings.charges).length).toBeGreaterThan(0)
  })
})
