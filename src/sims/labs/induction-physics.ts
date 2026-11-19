import { VACUUM_PERMEABILITY } from '../../core/constants'

export interface InductionParameters {
  magnetMomentAm2: number
  coilRadiusM: number
  turns: number
  resistanceOhm: number
  separationM: number
  approachSpeedMPerS: number
}

export interface InductionReadings {
  fluxPerTurnWb: number
  fluxChangeRateWbPerS: number
  emfV: number
  currentA: number
}

export function inductionReadings(parameters: InductionParameters): InductionReadings {
  const { magnetMomentAm2, coilRadiusM, turns, resistanceOhm, separationM, approachSpeedMPerS } = parameters
  if (!(coilRadiusM > 0) || !(separationM > 0) || !Number.isInteger(turns) || !(turns > 0) || !(resistanceOhm > 0)) {
    throw new RangeError('Coil radius, separation, turns, and resistance must be positive.')
  }
  if (![magnetMomentAm2, coilRadiusM, turns, resistanceOhm, separationM, approachSpeedMPerS].every(Number.isFinite)) {
    throw new RangeError('Induction parameters must be finite.')
  }

  const radiusSquared = coilRadiusM * coilRadiusM
  const distanceSquared = separationM * separationM
  const denominator = radiusSquared + distanceSquared
  const fluxPerTurnWb = (VACUUM_PERMEABILITY * magnetMomentAm2 * radiusSquared) / (2 * denominator ** 1.5)
  const fluxGradientWbPerM = (-3 * VACUUM_PERMEABILITY * magnetMomentAm2 * radiusSquared * separationM) / (2 * denominator ** 2.5)
  const fluxChangeRateWbPerS = fluxGradientWbPerM * -approachSpeedMPerS
  const emfV = -turns * fluxChangeRateWbPerS

  return {
    fluxPerTurnWb,
    fluxChangeRateWbPerS,
    emfV,
    currentA: emfV / resistanceOhm,
  }
}
