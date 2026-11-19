export type Derivative = (state: readonly number[], time: number) => readonly number[]

const advanceRK4 = (
  state: readonly number[],
  derivative: Derivative,
  time: number,
  dt: number,
): number[] => {
  const add = (base: readonly number[], delta: readonly number[], amount: number) =>
    base.map((value, index) => value + delta[index] * amount)
  const k1 = derivative(state, time)
  const k2 = derivative(add(state, k1, dt / 2), time + dt / 2)
  const k3 = derivative(add(state, k2, dt / 2), time + dt / 2)
  const k4 = derivative(add(state, k3, dt), time + dt)
  const next = state.map((value, index) => value + (dt / 6) * (k1[index] + 2 * k2[index] + 2 * k3[index] + k4[index]))
  if (!next.every(Number.isFinite)) throw new RangeError('Integration produced a non-finite state.')
  return next
}

export const integrateRK4 = (
  initial: readonly number[],
  derivative: Derivative,
  duration: number,
  stepSize = 1 / 240,
): number[] => {
  if (!Number.isFinite(duration) || duration < 0) throw new RangeError('Duration must be finite and non-negative.')
  if (!(stepSize > 0) || !Number.isFinite(stepSize)) throw new RangeError('Step size must be finite and positive.')
  let state = [...initial]
  let time = 0
  while (time < duration) {
    const dt = Math.min(stepSize, duration - time)
    state = advanceRK4(state, derivative, time, dt)
    time += dt
  }
  return state
}

export const createRK4Sampler = <P extends Readonly<Record<string, number>>>(
  initial: (params: P) => readonly number[],
  derivative: (state: readonly number[], time: number, params: P) => readonly number[],
  stepSize: number,
) => {
  if (!(stepSize > 0) || !Number.isFinite(stepSize)) throw new RangeError('Step size must be finite and positive.')
  let signature = ''
  let states: number[][] = []
  return (params: P, time: number): number[] => {
    if (!Number.isFinite(time) || time < 0) throw new RangeError('Sample time must be finite and non-negative.')
    const nextSignature = JSON.stringify(params)
    if (signature !== nextSignature) {
      signature = nextSignature
      states = [[...initial(params)]]
    }
    const fullSteps = Math.floor(time / stepSize)
    while (states.length <= fullSteps) {
      const currentIndex = states.length - 1
      const currentTime = currentIndex * stepSize
      states.push(advanceRK4(states[currentIndex], (state, t) => derivative(state, t, params), currentTime, stepSize))
    }
    const remainder = time - fullSteps * stepSize
    return remainder > 0
      ? advanceRK4(states[fullSteps], (state, t) => derivative(state, t, params), fullSteps * stepSize, remainder)
      : [...states[fullSteps]]
  }
}

export const numberForMath = (value: number, digits = 3): string => {
  if (!Number.isFinite(value)) return '\\text{undefined}'
  if (value === 0) return '0'
  const absolute = Math.abs(value)
  if (absolute < 0.001 || absolute >= 100_000) {
    const [mantissa, exponent] = value.toExponential(digits - 1).split('e')
    return `${Number(mantissa)}\\times 10^{${Number(exponent)}}`
  }
  return Number(value.toPrecision(digits)).toString()
}

export const normalizeAngle = (angle: number): number => {
  let normalized = angle % (2 * Math.PI)
  if (normalized > Math.PI) normalized -= 2 * Math.PI
  if (normalized < -Math.PI) normalized += 2 * Math.PI
  return normalized
}
