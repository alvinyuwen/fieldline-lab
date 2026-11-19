export interface MotorSettings {
  currentA: number
  magneticFieldT: number
  turns: number
  coilAreaM2: number
  coilHeightM: number
  inertiaKgM2: number
}

export interface MotorState {
  angleRad: number
  angularVelocityRadS: number
}

export function commutatorCurrentDirection(angleRad: number): 1 | -1 {
  const angle = ((angleRad % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI)
  return angle < Math.PI ? 1 : -1
}

export function motorTorque(settings: MotorSettings, angleRad: number): number {
  if (!(settings.inertiaKgM2 > 0) || settings.turns < 0 || settings.coilAreaM2 < 0) {
    throw new RangeError('Motor inertia must be positive; turns and area must be non-negative.')
  }
  const effectiveCurrent = settings.currentA * commutatorCurrentDirection(angleRad)
  return settings.turns * effectiveCurrent * settings.coilAreaM2 * settings.magneticFieldT * Math.sin(angleRad)
}

export function motorSideForce(settings: MotorSettings, angleRad: number): number {
  const effectiveCurrent = settings.currentA * commutatorCurrentDirection(angleRad)
  return settings.magneticFieldT * effectiveCurrent * settings.coilHeightM * Math.sin(angleRad)
}

export function advanceMotor(state: MotorState, settings: MotorSettings, dt: number): MotorState {
  if (!(settings.inertiaKgM2 > 0) || !(dt >= 0)) throw new RangeError('Motor inertia must be positive and timestep non-negative.')
  const derivative = (value: MotorState): MotorState => ({
    angleRad: value.angularVelocityRadS,
    angularVelocityRadS: motorTorque(settings, value.angleRad) / settings.inertiaKgM2,
  })
  const k1 = derivative(state)
  const k2 = derivative(addScaled(state, k1, dt / 2))
  const k3 = derivative(addScaled(state, k2, dt / 2))
  const k4 = derivative(addScaled(state, k3, dt))
  return {
    angleRad: state.angleRad + (dt / 6) * (k1.angleRad + 2 * k2.angleRad + 2 * k3.angleRad + k4.angleRad),
    angularVelocityRadS: state.angularVelocityRadS + (dt / 6) * (k1.angularVelocityRadS + 2 * k2.angularVelocityRadS + 2 * k3.angularVelocityRadS + k4.angularVelocityRadS),
  }
}

export function sampleMotorTrajectory(settings: MotorSettings, initial: MotorState, durationS: number, timeStepS = 1 / 120): readonly MotorState[] {
  if (!(durationS >= 0) || !(timeStepS > 0)) throw new RangeError('Duration must be non-negative and timestep positive.')
  const samples = [initial]
  let state = initial
  const count = Math.ceil(durationS / timeStepS)
  for (let index = 0; index < count; index += 1) {
    state = advanceMotor(state, settings, Math.min(timeStepS, durationS - index * timeStepS))
    samples.push(state)
  }
  return samples
}

function addScaled(state: MotorState, derivative: MotorState, scale: number): MotorState {
  return {
    angleRad: state.angleRad + derivative.angleRad * scale,
    angularVelocityRadS: state.angularVelocityRadS + derivative.angularVelocityRadS * scale,
  }
}
