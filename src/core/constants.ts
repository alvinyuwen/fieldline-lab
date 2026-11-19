export const ELEMENTARY_CHARGE = 1.602_176_634e-19
export const ELECTRON_MASS = 9.109_383_713_9e-31
export const PROTON_MASS = 1.672_621_925_95e-27
export const COULOMB_CONSTANT = 8.987_551_792_3e9
export const VACUUM_PERMITTIVITY = 8.854_187_812_8e-12
export const VACUUM_PERMEABILITY = 1.256_637_062_12e-6
export const SPEED_OF_LIGHT = 299_792_458
export const PLANCK_CONSTANT = 6.626_070_15e-34
export const REDUCED_PLANCK_CONSTANT = PLANCK_CONSTANT / (2 * Math.PI)
export const STANDARD_GRAVITY = 9.81

export const DEFAULT_TIME_STEP = 1 / 240
export const MAX_FRAME_DELTA = 0.1
export const MAX_SUBSTEPS = 240

export const QUANTITY_COLORS = {
  force: '#FF6B6B',
  velocity: '#22D3EE',
  acceleration: '#F472B6',
  electric: '#FBBF24',
  magnetic: '#A78BFA',
  torque: '#34D399',
  momentum: '#FB923C',
  energy: '#A3E635',
} as const

export const LEVEL_COLORS = {
  G12: '#5EEAD4',
  Y1: '#60A5FA',
  Y2: '#818CF8',
  Y3: '#C084FC',
  Y4: '#F0ABFC',
} as const
