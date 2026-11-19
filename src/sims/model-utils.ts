import { DEFAULT_TIME_STEP } from '../core/constants'
import type {
  ParameterDefinition,
  SimulationDefinition,
  SimulationDomain,
  SimulationSample,
  SimulationVector,
} from './types'

export const parameter = (
  key: string,
  name: string,
  symbol: string,
  unit: string,
  min: number,
  max: number,
  step: number,
  defaultValue: number,
  scale: ParameterDefinition['scale'] = 'linear',
): ParameterDefinition => ({ key, name, symbol, unit, min, max, step, defaultValue, scale })

export const defineSimulation = (
  definition: Omit<SimulationDefinition, 'initState' | 'step'>,
): SimulationDefinition => ({
  ...definition,
  initState: (params) => ({ coordinate: definition.domain(params).min }),
  step: (state, params, dt = DEFAULT_TIME_STEP) => {
    const domain = definition.domain(params)
    const next = state.coordinate + dt
    return { coordinate: next > domain.max ? domain.min : next }
  },
})

export const sample = (
  graphValue: number,
  position: SimulationSample['position'],
  resultLabel: string,
  resultValue: string,
  equation: string,
  substitution: string,
  metrics: SimulationSample['metrics'] = [],
  vectors?: SimulationSample['vectors'],
  velocity?: SimulationSample['velocity'],
  invariant?: SimulationSample['invariant'],
): SimulationSample => ({
  graphValue,
  position,
  velocity,
  vectors,
  metrics,
  resultLabel,
  resultValue,
  equation,
  substitution,
  invariant,
})

export const vector = (
  key: string,
  label: string,
  color: string,
  value: SimulationVector['vector'],
  origin: SimulationVector['origin'] = [0, 0, 0],
): SimulationVector => ({ key, label, color, vector: value, origin })

export const timeDomain = (max: number, step = DEFAULT_TIME_STEP): SimulationDomain => ({
  variable: 't',
  unit: 's',
  min: 0,
  max: Math.max(step, max),
  step,
})
