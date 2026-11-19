export type Vec3 = readonly [x: number, y: number, z: number]

export const vec3 = (x = 0, y = 0, z = 0): Vec3 => [x, y, z]
export const add = (a: Vec3, b: Vec3): Vec3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]]
export const subtract = (a: Vec3, b: Vec3): Vec3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]]
export const scale = (vector: Vec3, amount: number): Vec3 => [vector[0] * amount, vector[1] * amount, vector[2] * amount]
export const dot = (a: Vec3, b: Vec3): number => a[0] * b[0] + a[1] * b[1] + a[2] * b[2]
export const cross = (a: Vec3, b: Vec3): Vec3 => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0],
]
export const magnitude = (vector: Vec3): number => Math.hypot(vector[0], vector[1], vector[2])
export const normalize = (vector: Vec3): Vec3 => {
  const length = magnitude(vector)
  return length === 0 ? vec3() : scale(vector, 1 / length)
}

export const isFiniteVec3 = (vector: Vec3): boolean => vector.every(Number.isFinite)
