import { describe, expect, it } from 'vitest'
import { advanceMotor, commutatorCurrentDirection, motorSideForce, motorTorque, sampleMotorTrajectory, type MotorSettings } from '../src/sims/labs/motor-physics'

const settings: MotorSettings = {
  currentA: 2,
  magneticFieldT: 0.5,
  turns: 20,
  coilAreaM2: 0.1,
  coilHeightM: 0.4,
  inertiaKgM2: 0.2,
}

describe('DC motor physics', () => {
  it('scales maximum torque with current, field, turns, and coil area', () => {
    expect(motorTorque(settings, Math.PI / 2)).toBeCloseTo(2)
    expect(motorTorque({ ...settings, currentA: 4 }, Math.PI / 2)).toBeCloseTo(4)
    expect(motorTorque({ ...settings, turns: 40 }, Math.PI / 2)).toBeCloseTo(4)
  })

  it('reverses armature current every half-turn to keep torque in the same direction', () => {
    expect(commutatorCurrentDirection(Math.PI / 2)).toBe(1)
    expect(commutatorCurrentDirection((3 * Math.PI) / 2)).toBe(-1)
    expect(motorTorque(settings, Math.PI / 2)).toBeGreaterThan(0)
    expect(motorTorque(settings, (3 * Math.PI) / 2)).toBeGreaterThan(0)
    expect(motorTorque({ ...settings, currentA: -2 }, Math.PI / 2)).toBeLessThan(0)
  })

  it('computes the force on a current-carrying coil side', () => {
    expect(motorSideForce(settings, Math.PI / 2)).toBeCloseTo(0.4)
    expect(motorSideForce(settings, (3 * Math.PI) / 2)).toBeCloseTo(0.4)
  })

  it('integrates angle and angular speed deterministically', () => {
    const initial = { angleRad: 0.2, angularVelocityRadS: 1 }
    const next = advanceMotor(initial, settings, 0.01)
    expect(next.angleRad).toBeGreaterThan(initial.angleRad)
    expect(next.angularVelocityRadS).toBeGreaterThan(initial.angularVelocityRadS)
    expect(sampleMotorTrajectory(settings, initial, 1)).toEqual(sampleMotorTrajectory(settings, initial, 1))
  })

  it('rejects invalid rotational inertia', () => {
    expect(() => motorTorque({ ...settings, inertiaKgM2: 0 }, 1)).toThrow(RangeError)
  })
})
