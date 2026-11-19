import { describe, expect, it } from 'vitest'
import {
  analyticState,
  cyclotronFrequency,
  cyclotronPeriod,
  cyclotronRadius,
  initialState,
  parametersFromControls,
} from '../src/core/cyclotron'
import { advanceFixed, integrateToTime } from '../src/core/integrator'
import { magneticFieldAt, uniformMagneticField } from '../src/core/field-solvers'
import { magnitude, vec3 } from '../src/core/vector'

describe('uniform magnetic field particle motion', () => {
  it('matches the analytic circular trajectory within 1e-8 m after one second', () => {
    const parameters = parametersFromControls(1, 1, 1, 1, 90)
    const numerical = integrateToTime(initialState(parameters), parameters, 1)
    const analytic = analyticState(parameters, 1)
    expect(magnitude([
      numerical.position[0] - analytic.position[0],
      numerical.position[1] - analytic.position[1],
      numerical.position[2] - analytic.position[2],
    ])).toBeLessThan(1e-8)
    expect(magnitude([
      numerical.velocity[0] - analytic.velocity[0],
      numerical.velocity[1] - analytic.velocity[1],
      numerical.velocity[2] - analytic.velocity[2],
    ])).toBeLessThan(1e-8)
  })

  it('matches the analytic helix and preserves parallel motion', () => {
    const parameters = parametersFromControls(1, 1, 0.8, 2, 55)
    const time = 2.4
    const numerical = integrateToTime(initialState(parameters), parameters, time)
    const analytic = analyticState(parameters, time)
    expect(magnitude([
      numerical.position[0] - analytic.position[0],
      numerical.position[1] - analytic.position[1],
      numerical.position[2] - analytic.position[2],
    ])).toBeLessThan(1e-7)
    expect(numerical.position[2]).toBeCloseTo(parameters.initialVelocity[2] * time, 8)
    expect(magnitude(numerical.velocity)).toBeCloseTo(2, 8)
  })

  it('reverses curvature for negative charge', () => {
    const positive = parametersFromControls(1, 1, 1, 1, 90)
    const negative = parametersFromControls(-1, 1, 1, 1, 90)
    expect(analyticState(positive, 0.5).position[1]).toBeLessThan(0)
    expect(analyticState(negative, 0.5).position[1]).toBeGreaterThan(0)
  })

  it('uses straight-line motion when charge or field is zero', () => {
    const zeroField = parametersFromControls(1, 1, 0, 3, 35)
    const zeroCharge = parametersFromControls(0, 1, 1, 3, 35)
    for (const parameters of [zeroField, zeroCharge]) {
      expect(analyticState(parameters, 2).position).toEqual([
        parameters.initialVelocity[0] * 2,
        parameters.initialVelocity[1] * 2,
        parameters.initialVelocity[2] * 2,
      ])
      expect(analyticState(parameters, 2).velocity).toEqual(parameters.initialVelocity)
    }
    expect(cyclotronPeriod(0, 1, 1)).toBe(Infinity)
    expect(cyclotronRadius(1, 1, 0, 1)).toBe(Infinity)
  })

  it('computes radius and period from the SI cyclotron relations', () => {
    expect(cyclotronRadius(2, 1, 4, 2)).toBe(1)
    expect(cyclotronFrequency(1, 4, 2)).toBe(2)
    expect(cyclotronPeriod(1, 1, 1)).toBeCloseTo(2 * Math.PI)
  })

  it('returns a position-independent field for a uniform field source', () => {
    const field = uniformMagneticField(vec3(0, 0, 1))
    expect(magneticFieldAt(vec3(1, -3, 5), field)).toEqual([0, 0, 1])
    expect(magneticFieldAt(vec3(-2, 0, 9), field)).toEqual([0, 0, 1])
  })

  it('advances with fixed 1/240 second steps and bounds a long frame', () => {
    const parameters = parametersFromControls(1, 1, 1, 1, 90)
    const start = initialState(parameters)
    const oneFrame = advanceFixed(start, parameters, 1 / 60)
    expect(oneFrame.steps).toBe(4)
    expect(oneFrame.elapsed).toBeCloseTo(1 / 60)
    const stalledFrame = advanceFixed(start, parameters, 1)
    expect(stalledFrame.steps).toBe(24)
    expect(stalledFrame.elapsed).toBeCloseTo(0.1)
  })

  it('rejects invalid integration steps and supports zero initial position', () => {
    expect(vec3()).toEqual([0, 0, 0])
    const parameters = parametersFromControls(1, 1, 1, 1, 90)
    expect(() => integrateToTime(initialState(parameters), parameters, -1)).toThrow(RangeError)
  })
})
