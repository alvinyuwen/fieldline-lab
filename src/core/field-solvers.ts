import { add, cross, scale, type Vec3 } from './vector'

export interface UniformMagneticField {
  kind: 'uniform'
  field: Vec3
}

export const uniformMagneticField = (field: Vec3): UniformMagneticField => ({
  kind: 'uniform',
  field,
})

export const magneticFieldAt = (_position: Vec3, source: UniformMagneticField): Vec3 => source.field

export const lorentzForce = (charge: number, velocity: Vec3, electricField: Vec3, magneticField: Vec3): Vec3 =>
  scale(add(electricField, cross(velocity, magneticField)), charge)
