import { describe, expect, it } from 'vitest'
import { longWireMagneticField, magneticFieldMagnitude, magneticForceOnCharge } from '../src/sims/labs/magnetic-wire-physics'

describe('long straight wire magnetic field', () => {
  it('uses the long-wire field magnitude and right-hand-rule direction', () => {
    const field = longWireMagneticField(5, 0.5, 0)
    expect(Math.hypot(field.x, field.y)).toBeCloseTo(2e-6, 12)
    expect(field.x).toBeCloseTo(0)
    expect(field.y).toBeGreaterThan(0)
  })

  it('reverses with current and decays inversely with distance', () => {
    expect(longWireMagneticField(-5, 0.5, 0).y).toBeLessThan(0)
    expect(magneticFieldMagnitude(5, 1)).toBeCloseTo(magneticFieldMagnitude(5, 0.5) / 2)
    expect(magneticFieldMagnitude(-10, 0.5)).toBeCloseTo(2 * magneticFieldMagnitude(5, 0.5))
  })

  it('returns zero field at zero current and rejects the ideal wire axis', () => {
    expect(longWireMagneticField(0, 1, 0)).toEqual({ x: 0, y: 0 })
    expect(() => longWireMagneticField(1, 0, 0)).toThrow(RangeError)
  })

  it('computes magnetic force using q times v cross B', () => {
    expect(magneticForceOnCharge(2, [1, 0, 0], [0, 0, 3])).toEqual([0, -6, 0])
  })
})
