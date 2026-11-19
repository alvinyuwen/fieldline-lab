import { describe, expect, it } from 'vitest'
import { inductionReadings, type InductionParameters } from '../src/sims/labs/induction-physics'

const parameters: InductionParameters = {
  magnetMomentAm2: -1.2,
  coilRadiusM: 0.3,
  turns: 120,
  resistanceOhm: 4,
  separationM: 1.5,
  approachSpeedMPerS: 0.2,
}

describe('electromagnetic induction physics', () => {
  it('uses the axial dipole field integrated over the circular coil area', () => {
    const readings = inductionReadings(parameters)
    const expectedFlux = (4 * Math.PI * 1e-7 * parameters.magnetMomentAm2 * parameters.coilRadiusM ** 2)
      / (2 * (parameters.coilRadiusM ** 2 + parameters.separationM ** 2) ** 1.5)
    expect(readings.fluxPerTurnWb).toBeCloseTo(expectedFlux, 15)
  })

  it('opposes increasing flux and reverses the induced current when motion reverses', () => {
    const approaching = inductionReadings(parameters)
    const receding = inductionReadings({ ...parameters, approachSpeedMPerS: -parameters.approachSpeedMPerS })
    expect(approaching.fluxPerTurnWb).toBeLessThan(0)
    expect(approaching.emfV).toBeGreaterThan(0)
    expect(approaching.emfV).toBeCloseTo(-parameters.turns * approaching.fluxChangeRateWbPerS)
    expect(receding.emfV).toBeLessThan(0)
    expect(receding.currentA).toBeCloseTo(-approaching.currentA)
    expect(inductionReadings({ ...parameters, magnetMomentAm2: -parameters.magnetMomentAm2 }).emfV).toBeCloseTo(-approaching.emfV)
  })

  it('scales emf with turn count and speed, and gives zero current when stationary', () => {
    const baseline = inductionReadings(parameters)
    expect(inductionReadings({ ...parameters, turns: parameters.turns * 2 }).emfV).toBeCloseTo(2 * baseline.emfV)
    expect(inductionReadings({ ...parameters, approachSpeedMPerS: 0 }).currentA).toBe(0)
  })

  it('rejects invalid coil geometry and resistance', () => {
    expect(() => inductionReadings({ ...parameters, coilRadiusM: 0 })).toThrow(RangeError)
    expect(() => inductionReadings({ ...parameters, resistanceOhm: 0 })).toThrow(RangeError)
    expect(() => inductionReadings({ ...parameters, turns: 120.5 })).toThrow(RangeError)
    expect(() => inductionReadings({ ...parameters, separationM: Number.NaN })).toThrow(RangeError)
  })
})
