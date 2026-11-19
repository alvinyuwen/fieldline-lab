import { initialControls, type Controls } from '../core/store'

export interface SimPreset {
  id: string
  label: string
  description: string
  controls: Partial<Controls>
}

export const presets: readonly SimPreset[] = [
  {
    id: 'circular',
    label: 'Circular path',
    description: 'Velocity is perpendicular to the magnetic field.',
    controls: { ...initialControls, pitch: 90, mode: 'G12' },
  },
  {
    id: 'helical',
    label: 'Helical path',
    description: 'A parallel velocity component carries the particle along the field.',
    controls: { ...initialControls, pitch: 55, mode: 'Y1' },
  },
  {
    id: 'reversed',
    label: 'Reverse charge',
    description: 'Reversing the charge reverses the direction of curvature.',
    controls: { ...initialControls, charge: -1, pitch: 90, mode: 'G12' },
  },
  {
    id: 'no-field',
    label: 'No magnetic field',
    description: 'With no field, the particle continues in a straight line.',
    controls: { ...initialControls, field: 0, pitch: 90, mode: 'G12' },
  },
]
