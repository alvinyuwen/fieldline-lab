import { DEFAULT_TIME_STEP, MAX_FRAME_DELTA, MAX_SUBSTEPS } from './constants'
import { rk4Step, type ParticleParameters, type ParticleState } from './cyclotron'

export interface AdvanceResult {
  state: ParticleState
  elapsed: number
  accumulator: number
  steps: number
}

export const advanceFixed = (
  state: ParticleState,
  parameters: ParticleParameters,
  frameDelta: number,
  accumulator = 0,
  timeStep = DEFAULT_TIME_STEP,
): AdvanceResult => {
  if (!(timeStep > 0) || !Number.isFinite(timeStep)) throw new RangeError('Fixed time step must be finite and greater than zero.')
  if (frameDelta < 0 || !Number.isFinite(frameDelta)) throw new RangeError('Frame delta must be finite and non-negative.')
  if (accumulator < 0 || !Number.isFinite(accumulator)) throw new RangeError('Accumulator must be finite and non-negative.')
  let nextState = state
  let nextAccumulator = accumulator + Math.min(frameDelta, MAX_FRAME_DELTA)
  let steps = 0
  while (nextAccumulator >= timeStep && steps < MAX_SUBSTEPS) {
    nextState = rk4Step(nextState, parameters, timeStep)
    nextAccumulator -= timeStep
    steps += 1
  }
  if (steps === MAX_SUBSTEPS) nextAccumulator = 0
  return { state: nextState, elapsed: steps * timeStep, accumulator: nextAccumulator, steps }
}

export const integrateToTime = (
  initial: ParticleState,
  parameters: ParticleParameters,
  targetTime: number,
  timeStep = DEFAULT_TIME_STEP,
): ParticleState => {
  if (targetTime < 0 || !Number.isFinite(targetTime)) throw new RangeError('Target time must be finite and non-negative.')
  const fullSteps = Math.floor(targetTime / timeStep)
  let state = initial
  for (let step = 0; step < fullSteps; step += 1) state = rk4Step(state, parameters, timeStep)
  const remainder = targetTime - fullSteps * timeStep
  return remainder > Number.EPSILON ? rk4Step(state, parameters, remainder) : state
}
