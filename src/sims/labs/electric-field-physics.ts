import { COULOMB_CONSTANT } from '../../core/constants'

export interface Point2 {
  x: number
  y: number
}

export interface PointCharge extends Point2 {
  id: string
  chargeMicroC: number
}

export interface ElectricParticleState extends Point2 {
  vx: number
  vy: number
}

export interface ElectricParticleSettings {
  mode: 'charges' | 'plates'
  charges: readonly PointCharge[]
  plateVoltage: number
  plateGap: number
  particleChargeNanoC: number
  particleMassMg: number
}

export function electricFieldAt(point: Point2, settings: Pick<ElectricParticleSettings, 'mode' | 'charges' | 'plateVoltage' | 'plateGap'>): Point2 {
  if (settings.mode === 'plates') {
    return { x: settings.plateVoltage / settings.plateGap, y: 0 }
  }

  let x = 0
  let y = 0
  for (const charge of settings.charges) {
    const dx = point.x - charge.x
    const dy = point.y - charge.y
    const radiusSquared = dx * dx + dy * dy
    if (radiusSquared < 1e-8) continue
    const fieldScale = COULOMB_CONSTANT * charge.chargeMicroC * 1e-6 / (radiusSquared * Math.sqrt(radiusSquared))
    x += fieldScale * dx
    y += fieldScale * dy
  }
  return { x, y }
}

export function electricForce(chargeNanoC: number, field: Point2): Point2 {
  const charge = chargeNanoC * 1e-9
  return { x: charge * field.x, y: charge * field.y }
}

export function advanceElectricParticle(state: ElectricParticleState, settings: ElectricParticleSettings, dt: number): ElectricParticleState {
  if (!(settings.particleMassMg > 0) || !(dt >= 0)) throw new RangeError('Particle mass must be positive and timestep non-negative.')
  const chargeToMass = settings.particleChargeNanoC * 1e-9 / (settings.particleMassMg * 1e-6)
  const derivative = (value: ElectricParticleState): ElectricParticleState => {
    const field = electricFieldAt(value, settings)
    return { x: value.vx, y: value.vy, vx: chargeToMass * field.x, vy: chargeToMass * field.y }
  }
  const k1 = derivative(state)
  const k2 = derivative(addScaled(state, k1, dt / 2))
  const k3 = derivative(addScaled(state, k2, dt / 2))
  const k4 = derivative(addScaled(state, k3, dt))
  return {
    x: state.x + (dt / 6) * (k1.x + 2 * k2.x + 2 * k3.x + k4.x),
    y: state.y + (dt / 6) * (k1.y + 2 * k2.y + 2 * k3.y + k4.y),
    vx: state.vx + (dt / 6) * (k1.vx + 2 * k2.vx + 2 * k3.vx + k4.vx),
    vy: state.vy + (dt / 6) * (k1.vy + 2 * k2.vy + 2 * k3.vy + k4.vy),
  }
}

export function sampleElectricTrajectory(initial: ElectricParticleState, settings: ElectricParticleSettings, duration: number, timeStep = 1 / 120): readonly ElectricParticleState[] {
  if (!(duration >= 0) || !(timeStep > 0)) throw new RangeError('Duration must be non-negative and timestep positive.')
  const states = [initial]
  let state = initial
  const count = Math.ceil(duration / timeStep)
  for (let index = 0; index < count; index += 1) {
    state = advanceElectricParticle(state, settings, Math.min(timeStep, duration - index * timeStep))
    states.push(state)
  }
  return states
}

export function traceElectricFieldLines(charges: readonly PointCharge[], bounds = { x: 4, y: 2.8 }): readonly (readonly Point2[])[] {
  const positive = charges.filter((charge) => charge.chargeMicroC > 0)
  const sources = positive.length ? positive.map((charge) => ({ charge, sign: 1 })) : charges
    .filter((charge) => charge.chargeMicroC < 0)
    .map((charge) => ({ charge, sign: -1 }))
  const lines: Point2[][] = []
  for (const source of sources) {
    const count = Math.max(8, Math.min(48, Math.round(Math.abs(source.charge.chargeMicroC) * 12)))
    for (let index = 0; index < count; index += 1) {
      const angle = (2 * Math.PI * index) / count
      let point = { x: source.charge.x + Math.cos(angle) * 0.13, y: source.charge.y + Math.sin(angle) * 0.13 }
      const path = [point]
      for (let step = 0; step < 640; step += 1) {
        const field = electricFieldAt(point, { mode: 'charges', charges, plateVoltage: 0, plateGap: 1 })
        const magnitude = Math.hypot(field.x, field.y)
        if (magnitude < 1e-9) break
        const direction = source.sign / magnitude
        point = { x: point.x + field.x * direction * 0.035, y: point.y + field.y * direction * 0.035 }
        path.push(point)
        if (Math.abs(point.x) > bounds.x || Math.abs(point.y) > bounds.y) break
        const reachedNegative = charges.some((charge) => charge.chargeMicroC < 0 && distance(point, charge) < 0.12)
        if (source.sign > 0 && reachedNegative) break
      }
      if (source.sign < 0) path.reverse()
      if (path.length > 3) lines.push(path)
    }
  }
  return lines
}

function addScaled(state: ElectricParticleState, derivative: ElectricParticleState, scale: number): ElectricParticleState {
  return {
    x: state.x + derivative.x * scale,
    y: state.y + derivative.y * scale,
    vx: state.vx + derivative.vx * scale,
    vy: state.vy + derivative.vy * scale,
  }
}

function distance(a: Point2, b: Point2): number {
  return Math.hypot(a.x - b.x, a.y - b.y)
}
