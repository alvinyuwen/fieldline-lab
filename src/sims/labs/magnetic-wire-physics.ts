import { VACUUM_PERMEABILITY } from '../../core/constants'

export interface FieldVector2 {
  x: number
  y: number
}

export function longWireMagneticField(currentA: number, x: number, y: number): FieldVector2 {
  if (currentA === 0) return { x: 0, y: 0 }
  const radiusSquared = x * x + y * y
  if (radiusSquared === 0) throw new RangeError('The magnetic field is undefined on an ideal wire axis.')
  const scale = VACUUM_PERMEABILITY * currentA / (2 * Math.PI * radiusSquared)
  return { x: -scale * y, y: scale * x }
}

export function magneticFieldMagnitude(currentA: number, radiusM: number): number {
  if (!(radiusM > 0)) throw new RangeError('Observation radius must be positive.')
  return (VACUUM_PERMEABILITY * Math.abs(currentA)) / (2 * Math.PI * radiusM)
}

export function magneticForceOnCharge(chargeC: number, velocity: readonly [number, number, number], field: readonly [number, number, number]): readonly [number, number, number] {
  return [
    chargeC * (velocity[1] * field[2] - velocity[2] * field[1]),
    chargeC * (velocity[2] * field[0] - velocity[0] * field[2]),
    chargeC * (velocity[0] * field[1] - velocity[1] * field[0]),
  ]
}
