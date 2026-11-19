import { isFiniteVec3, scale, vec3, type Vec3 } from './vector'
import { lorentzForce } from './field-solvers'

export interface ParticleParameters {
  charge: number
  mass: number
  magneticField: Vec3
  initialPosition: Vec3
  initialVelocity: Vec3
}

export interface ParticleState {
  position: Vec3
  velocity: Vec3
}

export const cyclotronFrequency = (charge: number, magneticFieldMagnitude: number, mass: number): number =>
  mass > 0 ? Math.abs(charge) * Math.abs(magneticFieldMagnitude) / mass : 0

export const cyclotronPeriod = (charge: number, magneticFieldMagnitude: number, mass: number): number => {
  const frequency = cyclotronFrequency(charge, magneticFieldMagnitude, mass)
  return frequency > 0 ? 2 * Math.PI / frequency : Infinity
}

export const cyclotronRadius = (speedPerpendicular: number, charge: number, magneticFieldMagnitude: number, mass: number): number => {
  const frequency = cyclotronFrequency(charge, magneticFieldMagnitude, mass)
  return frequency > 0 ? Math.abs(speedPerpendicular) / frequency : Infinity
}

export const acceleration = (velocity: Vec3, parameters: ParticleParameters): Vec3 => {
  if (parameters.mass <= 0) throw new RangeError('Mass must be greater than zero.')
  return scale(lorentzForce(parameters.charge, velocity, vec3(), parameters.magneticField), 1 / parameters.mass)
}

const derivative = (state: ParticleState, parameters: ParticleParameters): ParticleState => ({
  position: state.velocity,
  velocity: acceleration(state.velocity, parameters),
})

const addScaled = (state: ParticleState, derivativeState: ParticleState, amount: number): ParticleState => ({
  position: [
    state.position[0] + derivativeState.position[0] * amount,
    state.position[1] + derivativeState.position[1] * amount,
    state.position[2] + derivativeState.position[2] * amount,
  ],
  velocity: [
    state.velocity[0] + derivativeState.velocity[0] * amount,
    state.velocity[1] + derivativeState.velocity[1] * amount,
    state.velocity[2] + derivativeState.velocity[2] * amount,
  ],
})

export const rk4Step = (state: ParticleState, parameters: ParticleParameters, dt: number): ParticleState => {
  if (!(dt > 0) || !Number.isFinite(dt)) throw new RangeError('Time step must be finite and greater than zero.')
  if (!(parameters.mass > 0) || !Number.isFinite(parameters.mass)) throw new RangeError('Mass must be finite and greater than zero.')

  const k1 = derivative(state, parameters)
  const k2 = derivative(addScaled(state, k1, dt / 2), parameters)
  const k3 = derivative(addScaled(state, k2, dt / 2), parameters)
  const k4 = derivative(addScaled(state, k3, dt), parameters)
  const combine = (base: Vec3, a: Vec3, b: Vec3, c: Vec3, d: Vec3): Vec3 => [
    base[0] + (dt / 6) * (a[0] + 2 * b[0] + 2 * c[0] + d[0]),
    base[1] + (dt / 6) * (a[1] + 2 * b[1] + 2 * c[1] + d[1]),
    base[2] + (dt / 6) * (a[2] + 2 * b[2] + 2 * c[2] + d[2]),
  ]
  const next = {
    position: combine(state.position, k1.position, k2.position, k3.position, k4.position),
    velocity: combine(state.velocity, k1.velocity, k2.velocity, k3.velocity, k4.velocity),
  }
  if (!isFiniteVec3(next.position) || !isFiniteVec3(next.velocity)) throw new RangeError('Integration produced a non-finite particle state.')
  return next
}

export const initialState = (parameters: ParticleParameters): ParticleState => ({
  position: parameters.initialPosition,
  velocity: parameters.initialVelocity,
})

export const analyticState = (parameters: ParticleParameters, time: number): ParticleState => {
  if (time < 0 || !Number.isFinite(time)) throw new RangeError('Time must be finite and non-negative.')
  const [bx, by, bz] = parameters.magneticField
  const fieldMagnitude = Math.hypot(bx, by, bz)
  if (fieldMagnitude === 0 || parameters.charge === 0) {
    return {
      position: [
        parameters.initialPosition[0] + parameters.initialVelocity[0] * time,
        parameters.initialPosition[1] + parameters.initialVelocity[1] * time,
        parameters.initialPosition[2] + parameters.initialVelocity[2] * time,
      ],
      velocity: parameters.initialVelocity,
    }
  }
  if (bx !== 0 || by !== 0) throw new RangeError('Analytic solution currently supports a magnetic field along the z axis.')

  const omega = (parameters.charge * bz) / parameters.mass
  const angle = omega * time
  const sin = Math.sin(angle)
  const cos = Math.cos(angle)
  const [x0, y0, z0] = parameters.initialPosition
  const [vx0, vy0, vz0] = parameters.initialVelocity
  return {
    position: [
      x0 + (vx0 * sin + vy0 * (1 - cos)) / omega,
      y0 + (-vx0 * (1 - cos) + vy0 * sin) / omega,
      z0 + vz0 * time,
    ],
    velocity: [
      vx0 * cos + vy0 * sin,
      -vx0 * sin + vy0 * cos,
      vz0,
    ],
  }
}

export const parametersFromControls = (
  charge: number,
  mass: number,
  magneticField: number,
  speed: number,
  pitchAngleDegrees: number,
): ParticleParameters => {
  const pitch = (pitchAngleDegrees * Math.PI) / 180
  return {
    charge,
    mass,
    magneticField: vec3(0, 0, magneticField),
    initialPosition: vec3(),
    initialVelocity: vec3(speed * Math.sin(pitch), 0, speed * Math.cos(pitch)),
  }
}
