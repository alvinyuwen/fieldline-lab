import { ATOMIC_MASS_CONSTANT, ELEMENTARY_CHARGE } from '../../core/constants'

export interface CyclotronSettings {
  chargeE: number
  massAmu: number
  magneticFieldT: number
  acceleratingVoltageV: number
  initialEnergyEv: number
}

export interface CyclotronState {
  x: number
  y: number
  vx: number
  vy: number
  magneticForceN: readonly [number, number]
  timeS: number
  kineticEnergyEv: number
  radiusM: number
  gapCrossings: number
  rfVoltageV: number
}

export function cyclotronPeriod(settings: Pick<CyclotronSettings, 'chargeE' | 'massAmu' | 'magneticFieldT'>): number {
  const charge = Math.abs(settings.chargeE) * ELEMENTARY_CHARGE
  const field = Math.abs(settings.magneticFieldT)
  if (charge === 0 || field === 0 || !(settings.massAmu > 0)) return Number.POSITIVE_INFINITY
  return (2 * Math.PI * settings.massAmu * ATOMIC_MASS_CONSTANT) / (charge * field)
}

export function cyclotronMagneticForce(
  settings: Pick<CyclotronSettings, 'chargeE' | 'magneticFieldT'>,
  velocity: readonly [number, number],
): readonly [number, number] {
  const chargeC = settings.chargeE * ELEMENTARY_CHARGE
  const fieldZ = -settings.magneticFieldT
  return [chargeC * velocity[1] * fieldZ, -chargeC * velocity[0] * fieldZ]
}

export function cyclotronElectricFieldDirection(chargeE: number, rfVoltageV: number): -1 | 0 | 1 {
  const direction = Math.sign(chargeE * rfVoltageV)
  if (direction > 0) return 1
  if (direction < 0) return -1
  return 0
}

export function cyclotronKineticEnergyEv(settings: CyclotronSettings, crossings: number): number {
  return settings.initialEnergyEv + Math.max(0, crossings) * Math.abs(settings.chargeE) * Math.abs(settings.acceleratingVoltageV)
}

export function cyclotronRadiusM(settings: CyclotronSettings, kineticEnergyEv: number): number {
  const charge = Math.abs(settings.chargeE) * ELEMENTARY_CHARGE
  const field = Math.abs(settings.magneticFieldT)
  if (charge === 0 || field === 0 || !(settings.massAmu > 0)) return Number.POSITIVE_INFINITY
  const mass = settings.massAmu * ATOMIC_MASS_CONSTANT
  const speed = Math.sqrt((2 * Math.max(0, kineticEnergyEv) * ELEMENTARY_CHARGE) / mass)
  return (mass * speed) / (charge * field)
}

export function cyclotronStateAt(timeS: number, settings: CyclotronSettings): CyclotronState {
  const time = Math.max(0, timeS)
  const period = cyclotronPeriod(settings)
  if (!Number.isFinite(period)) {
    const mass = Math.max(settings.massAmu, Number.EPSILON) * ATOMIC_MASS_CONSTANT
    const speed = Math.sqrt((2 * Math.max(0, settings.initialEnergyEv) * ELEMENTARY_CHARGE) / mass)
    return {
      x: speed * time,
      y: 0,
      vx: speed,
      vy: 0,
      magneticForceN: [0, 0],
      timeS: time,
      kineticEnergyEv: settings.initialEnergyEv,
      radiusM: Number.POSITIVE_INFINITY,
      gapCrossings: 0,
      rfVoltageV: 0,
    }
  }

  const halfPeriod = period / 2
  const gapCrossings = Math.floor(time / halfPeriod + 1e-10)
  const kineticEnergyEv = cyclotronKineticEnergyEv(settings, gapCrossings)
  const radiusM = cyclotronRadiusM(settings, kineticEnergyEv)
  const mass = settings.massAmu * ATOMIC_MASS_CONSTANT
  const speed = Math.sqrt((2 * kineticEnergyEv * ELEMENTARY_CHARGE) / mass)
  const chargeFieldSign = Math.sign(settings.chargeE * settings.magneticFieldT)
  const velocityDirection = gapCrossings % 2 === 0 ? 1 : -1
  const side = chargeFieldSign * velocityDirection
  const phaseWithinHalfTurn = Math.max(0, Math.min(1, (time - gapCrossings * halfPeriod) / halfPeriod))
  const arcAngle = Math.PI * phaseWithinHalfTurn
  let startY = 0
  for (let crossing = 0; crossing < gapCrossings; crossing += 1) {
    const crossingRadius = radiusFor(settings, crossing)
    const crossingSide = chargeFieldSign * (crossing % 2 === 0 ? 1 : -1)
    startY += 2 * crossingSide * crossingRadius
  }
  const omega = (2 * Math.PI) / period
  const rfVoltageV = settings.acceleratingVoltageV * Math.cos(omega * time)
  const x = velocityDirection * radiusM * Math.sin(arcAngle)
  const y = startY + side * radiusM * (1 - Math.cos(arcAngle))
  const vx = velocityDirection * speed * Math.cos(arcAngle)
  const vy = side * speed * Math.sin(arcAngle)
  return {
    x,
    y,
    vx,
    vy,
    magneticForceN: cyclotronMagneticForce(settings, [vx, vy]),
    timeS: time,
    kineticEnergyEv,
    radiusM,
    gapCrossings,
    rfVoltageV,
  }
}

export function sampleCyclotronTrajectory(settings: CyclotronSettings, timeS: number, samplesPerHalfTurn = 24): readonly CyclotronState[] {
  const time = Math.max(0, timeS)
  const period = cyclotronPeriod(settings)
  if (!Number.isFinite(period)) return [cyclotronStateAt(0, settings), cyclotronStateAt(time, settings)]
  const timeStep = period / (2 * samplesPerHalfTurn)
  const count = Math.ceil(time / timeStep)
  return Array.from({ length: count + 1 }, (_, index) => cyclotronStateAt(Math.min(time, index * timeStep), settings))
}

function radiusFor(settings: CyclotronSettings, crossings: number): number {
  return cyclotronRadiusM(settings, cyclotronKineticEnergyEv(settings, crossings))
}
