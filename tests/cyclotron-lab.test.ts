import { describe, expect, it } from 'vitest'
import {
  cyclotronElectricFieldDirection,
  cyclotronMagneticForce,
  cyclotronKineticEnergyEv,
  cyclotronPeriod,
  cyclotronRadiusM,
  cyclotronStateAt,
  sampleCyclotronTrajectory,
  type CyclotronSettings,
} from '../src/sims/labs/cyclotron-physics'

const settings: CyclotronSettings = {
  chargeE: 1,
  massAmu: 1,
  magneticFieldT: 1,
  acceleratingVoltageV: 2000,
  initialEnergyEv: 5000,
}

describe('cyclotron laboratory physics', () => {
  it('uses the non-relativistic cyclotron period and scales with mass, charge, and field', () => {
    const period = cyclotronPeriod(settings)
    expect(period).toBeCloseTo(2 * Math.PI * 1.6605390666e-27 / 1.602176634e-19, 20)
    expect(cyclotronPeriod({ ...settings, massAmu: 2 })).toBeCloseTo(2 * period)
    expect(cyclotronPeriod({ ...settings, chargeE: 2 })).toBeCloseTo(period / 2)
    expect(cyclotronPeriod({ ...settings, magneticFieldT: 2 })).toBeCloseTo(period / 2)
  })

  it('adds |q|V of kinetic energy at each synchronized gap crossing', () => {
    expect(cyclotronKineticEnergyEv(settings, 1)).toBe(7000)
    expect(cyclotronKineticEnergyEv(settings, 2)).toBe(9000)
    const firstCrossing = cyclotronStateAt(cyclotronPeriod(settings) / 2, settings)
    const secondCrossing = cyclotronStateAt(cyclotronPeriod(settings), settings)
    expect(firstCrossing.gapCrossings).toBe(1)
    expect(secondCrossing.gapCrossings).toBe(2)
    expect(firstCrossing.kineticEnergyEv).toBe(7000)
    expect(secondCrossing.kineticEnergyEv).toBe(9000)
    expect(firstCrossing.rfVoltageV).toBeLessThan(0)
    expect(secondCrossing.rfVoltageV).toBeGreaterThan(0)
  })

  it('expands orbit radius with energy while keeping the injection direction fixed', () => {
    expect(cyclotronRadiusM(settings, 7000)).toBeGreaterThan(cyclotronRadiusM(settings, 5000))
    const positive = cyclotronStateAt(0, settings)
    const negative = cyclotronStateAt(0, { ...settings, chargeE: -1 })
    expect(positive.vx).toBeGreaterThan(0)
    expect(negative.vx).toBeCloseTo(positive.vx)
    expect(positive.x).toBe(0)
    expect(positive.y).toBe(0)
  })

  it('reverses magnetic-force direction and orbit curvature when charge changes sign', () => {
    const positive = cyclotronStateAt(cyclotronPeriod(settings) / 8, settings)
    const negative = cyclotronStateAt(cyclotronPeriod(settings) / 8, { ...settings, chargeE: -1 })
    expect(positive.vy).toBeGreaterThan(0)
    expect(negative.vy).toBeLessThan(0)
    expect(positive.y).toBeCloseTo(-negative.y)
    expect(positive.magneticForceN[1]).toBeGreaterThan(0)
    expect(negative.magneticForceN[1]).toBeLessThan(0)
    expect(Math.hypot(...negative.magneticForceN)).toBeCloseTo(Math.hypot(...positive.magneticForceN))
    const reversedField = cyclotronStateAt(cyclotronPeriod(settings) / 8, { ...settings, magneticFieldT: -1 })
    expect(reversedField.vy).toBeLessThan(0)
    expect(reversedField.magneticForceN[1]).toBeLessThan(0)
  })

  it('computes signed Lorentz force and charge-aware RF field direction', () => {
    const force = cyclotronMagneticForce({ chargeE: 1, magneticFieldT: 1 }, [2, 3])
    const reversedForce = cyclotronMagneticForce({ chargeE: -1, magneticFieldT: 1 }, [2, 3])
    expect(force[0]).toBeLessThan(0)
    expect(force[1]).toBeGreaterThan(0)
    expect(reversedForce[0]).toBeCloseTo(-force[0])
    expect(reversedForce[1]).toBeCloseTo(-force[1])
    expect(Math.hypot(...cyclotronMagneticForce({ chargeE: 2, magneticFieldT: 1 }, [2, 3]))).toBeCloseTo(2 * Math.hypot(...force))
    expect(cyclotronElectricFieldDirection(1, 5)).toBe(1)
    expect(cyclotronElectricFieldDirection(-1, 5)).toBe(-1)
    expect(cyclotronElectricFieldDirection(-1, -5)).toBe(1)
    expect(cyclotronElectricFieldDirection(1, 0)).toBe(0)
  })

  it('handles zero field or charge as straight, unaccelerated motion', () => {
    for (const noOrbit of [
      { ...settings, magneticFieldT: 0 },
      { ...settings, chargeE: 0 },
    ]) {
      const state = cyclotronStateAt(1e-8, noOrbit)
      expect(state.gapCrossings).toBe(0)
      expect(state.kineticEnergyEv).toBe(settings.initialEnergyEv)
      expect(state.radiusM).toBe(Number.POSITIVE_INFINITY)
    }
  })

  it('returns a deterministic trajectory through the requested time', () => {
    const time = cyclotronPeriod(settings) * 1.4
    const path = sampleCyclotronTrajectory(settings, time)
    expect(path).toEqual(sampleCyclotronTrajectory(settings, time))
    expect(path.at(-1)?.timeS).toBe(time)
    expect(path.length).toBeGreaterThan(20)
  })
})
