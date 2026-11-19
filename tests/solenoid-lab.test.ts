import { describe, expect, it } from 'vitest'
import { solenoidField } from '../src/sims/labs/solenoid-physics'

describe('solenoid field', () => {
  it('follows the ideal air-core relation and scales with turns and current', () => {
    const field = solenoidField(2, 100, 1, false)
    expect(field.insideTesla).toBeCloseTo(2 * 4 * Math.PI * 1e-7 * 100, 12)
    expect(solenoidField(4, 100, 1, false).insideTesla).toBeCloseTo(2 * field.insideTesla, 12)
    expect(solenoidField(2, 200, 1, false).insideTesla).toBeCloseTo(2 * field.insideTesla, 12)
  })

  it('reverses the poles with current and gives no poles at zero current', () => {
    expect(solenoidField(2, 80, 1, false).northPole).toBe('right')
    expect(solenoidField(-2, 80, 1, false).northPole).toBe('left')
    expect(solenoidField(0, 80, 1, false).northPole).toBe('none')
  })

  it('strengthens the field with an iron core and limits it through saturation', () => {
    const air = solenoidField(5, 120, 1, false)
    const iron = solenoidField(5, 120, 1, true)
    const highCurrent = solenoidField(500, 120, 1, true)
    expect(iron.insideTesla).toBeGreaterThan(air.insideTesla)
    expect(highCurrent.insideTesla).toBeLessThan(1.6)
    expect(highCurrent.insideTesla).toBeGreaterThan(1.59)
  })

  it('rejects invalid solenoid geometry', () => {
    expect(() => solenoidField(1, 100, 0, false)).toThrow(RangeError)
  })
})
