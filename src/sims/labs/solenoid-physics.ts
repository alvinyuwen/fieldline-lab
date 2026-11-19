import { VACUUM_PERMEABILITY } from '../../core/constants'

export interface SolenoidField {
  insideTesla: number
  outsideTesla: number
  northPole: 'left' | 'right' | 'none'
  turnDensityPerM: number
}

export function solenoidField(currentA: number, turns: number, lengthM: number, hasIronCore: boolean, relativePermeability = 200): SolenoidField {
  if (!(turns >= 0) || !(lengthM > 0) || !(relativePermeability >= 1)) {
    throw new RangeError('Turns must be non-negative, length positive, and relative permeability at least one.')
  }
  const turnDensityPerM = turns / lengthM
  const airField = VACUUM_PERMEABILITY * turnDensityPerM * currentA
  const ironField = 1.6 * Math.tanh(relativePermeability * airField / 1.6)
  const insideTesla = hasIronCore ? ironField : airField
  return {
    insideTesla,
    outsideTesla: insideTesla * 0.04,
    northPole: currentA === 0 ? 'none' : (currentA > 0 ? 'right' : 'left'),
    turnDensityPerM,
  }
}
