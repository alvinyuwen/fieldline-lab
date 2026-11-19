import { numberForMath } from '../core/model-math'
import { defineSimulation, parameter, sample, timeDomain, vector } from './model-utils'
import type { SimulationDefinition } from './types'

const depthLevels = {
  Intuition: 'Look for the shape of the wave or field before reading the formula.',
  Equation: 'The current parameter values are substituted into the governing relation.',
  Derivation: 'Compare local changes, symmetry, and superposition.',
  Advanced: 'Plots are ideal mathematical models, not measured data.',
} as const

const fourier = defineSimulation({
  id: 'fourier-series',
  title: 'Fourier series',
  topic: 'Math',
  levels: ['Y1', 'Y2'],
  description: 'Build a square wave from a finite sum of sine waves.',
  scene: 'wave',
  params: [
    parameter('harmonics', 'Odd harmonics', 'N', '1', 1, 15, 2, 5),
    parameter('frequency', 'Fundamental frequency', 'f₀', 'Hz', 0.1, 3, 0.05, 1),
    parameter('amplitude', 'Amplitude', 'A', '1', 0.1, 2, 0.05, 1),
  ],
  domain: () => timeDomain(2),
  equation: String.raw`f_N(x)=\frac{4A}{\pi}\sum_{n=1,3,\ldots}^{N}\frac{\sin(nx)}{n}`,
  vectors: [],
  predictionPrompts: [{ question: 'What happens as more odd harmonics are added?', options: ['The approximation becomes more square-like', 'It becomes a pure sine wave', 'The period grows'], answer: 0, explanation: 'Adding harmonics improves the piecewise-constant shape, with oscillations near jumps (Gibbs phenomenon).' }],
  depthLevels,
  presets: [{ id: 'smooth', label: 'Few harmonics', description: 'A smoother approximation with fewer terms.', values: { harmonics: 3 } }, { id: 'sharp', label: 'Sharper edges', description: 'Add more odd harmonics to sharpen the transition.', values: { harmonics: 13 } }],
  challenge: { title: 'Sharpen the wave', description: 'Use at least nine odd harmonics.', complete: (p) => p.harmonics >= 9 },
  assumptions: 'The periodic square-wave Fourier series is truncated to the selected odd harmonics.',
  whatToNotice: 'More harmonics sharpen the transitions, but the overshoot near a discontinuity does not vanish completely.',
  waveAt: (x, t, p) => {
    const omega = 2 * Math.PI * p.frequency
    let value = 0
    for (let n = 1; n <= p.harmonics; n += 2) value += Math.sin(n * (x - omega * t)) / n
    return (4 * p.amplitude / Math.PI) * value
  },
  sample: (t, p) => {
    const value = fourier.waveAt?.(Math.PI, t, p) ?? 0
    return sample(
      value, [Math.PI, value, 0], 'Series value', numberForMath(value),
      fourier.equation,
      String.raw`N=${p.harmonics},\quad f_0=${numberForMath(p.frequency)}\ \mathrm{Hz}`,
      [{ label: 'Period', value: numberForMath(1 / p.frequency), unit: 's' }, { label: 'Terms used', value: String(Math.ceil(p.harmonics / 2)) }],
    )
  },
})

const gradientSurfaces = defineSimulation({
  id: 'gradient-surfaces',
  title: 'Gradient and level surfaces',
  topic: 'Math',
  levels: ['Y1', 'Y2'],
  description: 'Compare a scalar field, its level curves, and its gradient.',
  scene: 'surface',
  params: [
    parameter('y', 'Vertical position', 'y', 'm', -2, 2, 0.02, 0.5),
    parameter('scale', 'Field scale', 'a', '1', 0.1, 3, 0.05, 1),
  ],
  domain: () => ({ variable: 'x', unit: 'm', min: -2, max: 2, step: 0.02 }),
  equation: String.raw`f(x,y)=a(x^2+y^2),\qquad \nabla f=(2ax,2ay)`,
  vectors: [{ key: 'gradient', label: 'Gradient', color: '#22D3EE' }],
  predictionPrompts: [{ question: 'Which direction does the gradient point?', options: ['Along a level curve', 'Perpendicular to the level curve toward increasing f', 'Toward decreasing f'], answer: 1, explanation: 'The gradient is normal to a level curve and points in the direction of greatest increase.' }],
  depthLevels,
  presets: [{ id: 'steep', label: 'Steeper field', description: 'Increase the scale of the scalar field.', values: { scale: 2 } }],
  challenge: { title: 'Flatten the field', description: 'Reduce the field scale below 0.5.', complete: (p) => p.scale < 0.5 },
  assumptions: 'The scalar field is a smooth quadratic bowl f=a(x²+y²); the surface visualization is scaled for display.',
  whatToNotice: 'The gradient is perpendicular to level curves and grows in magnitude farther from the origin.',
  sample: (x, p) => {
    const value = p.scale * (x * x + p.y ** 2)
    const gradient: [number, number, number] = [2 * p.scale * x, 2 * p.scale * p.y, 0]
    return sample(
      value, [x, p.y, value], 'Scalar field', numberForMath(value),
      gradientSurfaces.equation,
      String.raw`\nabla f=(${numberForMath(gradient[0])},${numberForMath(gradient[1])})`,
      [{ label: 'Gradient magnitude', value: numberForMath(Math.hypot(...gradient)), unit: 'field/m' }],
      [vector('gradient', 'Gradient', '#22D3EE', gradient, [x, p.y, value])],
    )
  },
})

const divergenceCurl = defineSimulation({
  id: 'divergence-curl',
  title: 'Divergence and curl',
  topic: 'Math',
  levels: ['Y2', 'Y3'],
  description: 'Separate local expansion from local rotation in a vector field.',
  scene: 'field',
  params: [
    parameter('expansion', 'Expansion rate', 'a', 's⁻¹', -2, 2, 0.05, 0.5),
    parameter('rotation', 'Rotation rate', 'b', 's⁻¹', -2, 2, 0.05, 0.75),
    parameter('y', 'Probe y position', 'y', 'm', -2, 2, 0.02, 0.5),
  ],
  domain: () => ({ variable: 'x', unit: 'm', min: -2, max: 2, step: 0.02 }),
  equation: String.raw`\vec{F}=(ax-by,\ bx+ay),\quad \nabla\cdot\vec{F}=2a,\quad (\nabla\times\vec{F})_z=2b`,
  vectors: [{ key: 'field', label: 'Vector field', color: '#A78BFA' }],
  predictionPrompts: [{ question: 'For a=b=0.5 s⁻¹, what is the 2D divergence?', options: ['0 s⁻¹', '0.5 s⁻¹', '1 s⁻¹'], answer: 2, explanation: 'The divergence is ∂Fx/∂x + ∂Fy/∂y = a+a = 2a = 1 s⁻¹.' }],
  depthLevels,
  presets: [{ id: 'pure-source', label: 'Pure expansion', description: 'Set rotation to zero to isolate divergence.', values: { rotation: 0 } }, { id: 'pure-vortex', label: 'Pure rotation', description: 'Set expansion to zero to isolate curl.', values: { expansion: 0 } }],
  challenge: { title: 'Pure rotation', description: 'Set expansion to zero while keeping rotation nonzero.', complete: (p) => Math.abs(p.expansion) < 0.05 && Math.abs(p.rotation) > 0.1 },
  assumptions: 'A two-dimensional linear vector field F=(ax−by,bx+ay); divergence and curl are constant everywhere.',
  whatToNotice: 'Parameter a controls source-like expansion; b controls local rotation.',
  sample: (x, p) => {
    const fx = p.expansion * x - p.rotation * p.y
    const fy = p.rotation * x + p.expansion * p.y
    const divergence = 2 * p.expansion
    const curl = 2 * p.rotation
    return sample(
      divergence, [x, p.y, 0], 'Divergence', `${numberForMath(divergence)} s⁻¹`,
      divergenceCurl.equation,
      String.raw`\nabla\cdot\vec{F}=2(${numberForMath(p.expansion)})=${numberForMath(divergence)},\quad(\nabla\times\vec{F})_z=${numberForMath(curl)}`,
      [{ label: 'Curl z-component', value: numberForMath(curl), unit: 's⁻¹' }, { label: 'Field at probe', value: `(${numberForMath(fx)}, ${numberForMath(fy)})`, unit: 'm/s' }],
      [vector('field', 'Vector field', '#A78BFA', [fx, fy, 0], [x, p.y, 0])],
    )
  },
})

const standingWaves = defineSimulation({
  id: 'standing-waves',
  title: 'Standing waves',
  topic: 'Waves and Optics',
  levels: ['G12', 'Y1'],
  description: 'Find nodes and antinodes in a fixed-end standing wave.',
  scene: 'wave',
  params: [
    parameter('amplitude', 'Amplitude', 'A', 'm', 0.01, 1, 0.01, 0.3),
    parameter('wavelength', 'Wavelength', 'λ', 'm', 0.2, 4, 0.02, 2),
    parameter('frequency', 'Frequency', 'f', 'Hz', 0.1, 5, 0.05, 1),
  ],
  domain: (p) => timeDomain(2 / p.frequency),
  equation: String.raw`y(x,t)=A\sin(kx)\cos(\omega t),\quad k=\frac{2\pi}{\lambda}`,
  vectors: [],
  predictionPrompts: [{ question: 'What is the displacement at a node?', options: ['Always zero', 'Maximum amplitude', 'It depends on time'], answer: 0, explanation: 'At a node, sin(kx)=0, so displacement remains zero at all times.' }],
  depthLevels,
  presets: [{ id: 'second-mode', label: 'Higher mode', description: 'Shorten the wavelength to fit more nodes.', values: { wavelength: 1 } }],
  challenge: { title: 'Add a node', description: 'Set wavelength to at most 1 m.', complete: (p) => p.wavelength <= 1 },
  assumptions: 'Ideal sinusoidal standing wave along a string fixed at both ends; displayed segment spans one wavelength.',
  whatToNotice: 'Nodes never move; antinodes oscillate with the largest displacement.',
  waveAt: (x, t, p) => p.amplitude * Math.sin((2 * Math.PI * x) / p.wavelength) * Math.cos(2 * Math.PI * p.frequency * t),
  sample: (t, p) => {
    const displacement = standingWaves.waveAt?.(p.wavelength / 4, t, p) ?? 0
    return sample(
      displacement, [p.wavelength / 4, displacement, 0], 'Displacement at x = λ/4', `${numberForMath(displacement)} m`,
      standingWaves.equation,
      String.raw`y(\lambda/4,t)=A\cos(2\pi ft)`,
      [{ label: 'Wave speed', value: numberForMath(p.frequency * p.wavelength), unit: 'm/s' }, { label: 'Period', value: numberForMath(1 / p.frequency), unit: 's' }],
    )
  },
})

const doppler = defineSimulation({
  id: 'doppler-effect',
  title: 'Doppler effect',
  topic: 'Waves and Optics',
  levels: ['G12', 'Y1'],
  description: 'Compare emitted and observed sound frequency for a moving source.',
  scene: 'wave',
  params: [
    parameter('sourceFrequency', 'Source frequency', 'fₛ', 'Hz', 100, 1200, 10, 440),
    parameter('sourceSpeed', 'Source speed', 'vₛ', 'm/s', -100, 100, 1, 25),
    parameter('soundSpeed', 'Sound speed', 'v', 'm/s', 250, 400, 1, 343),
  ],
  domain: () => timeDomain(4),
  equation: String.raw`f_\mathrm{obs}=f_s\frac{v}{v-v_s}`,
  vectors: [{ key: 'source-velocity', label: 'Source velocity', color: '#22D3EE' }],
  predictionPrompts: [{ question: 'As a sound source approaches you, what happens to observed pitch?', options: ['It rises', 'It falls', 'It is unchanged'], answer: 0, explanation: 'A moving source compresses wavefronts ahead of it, increasing observed frequency.' }],
  depthLevels,
  presets: [{ id: 'receding', label: 'Receding source', description: 'Reverse the source motion to lower observed frequency.', values: { sourceSpeed: -25 } }],
  challenge: { title: 'Increase the shift', description: 'Set the approaching source speed above 60 m/s.', complete: (p) => p.sourceSpeed > 60 && p.sourceSpeed < p.soundSpeed },
  assumptions: 'Stationary observer, uniform sound speed, and source speed below the medium wave speed.',
  whatToNotice: 'Approach increases observed frequency, while recession decreases it.',
  sample: (t, p) => {
    const valid = Math.abs(p.sourceSpeed) < p.soundSpeed
    const observed = valid ? p.sourceFrequency * p.soundSpeed / (p.soundSpeed - p.sourceSpeed) : Number.NaN
    const x = p.sourceSpeed * t
    return sample(
      observed, [x, 0, 0], 'Observed frequency', `${numberForMath(observed)} Hz`,
      doppler.equation,
      String.raw`f_\mathrm{obs}=${numberForMath(p.sourceFrequency)}\frac{${numberForMath(p.soundSpeed)}}{${numberForMath(p.soundSpeed)}-${numberForMath(p.sourceSpeed)}}=${numberForMath(observed)}\ \mathrm{Hz}`,
      [{ label: 'Frequency shift', value: numberForMath(observed - p.sourceFrequency), unit: 'Hz' }, { label: 'Source position', value: numberForMath(x), unit: 'm' }],
      [vector('source-velocity', 'Source velocity', '#22D3EE', [p.sourceSpeed, 0, 0], [x, 0, 0])],
    )
  },
})

export const mathWaveSimulations: readonly SimulationDefinition[] = [
  fourier,
  gradientSurfaces,
  divergenceCurl,
  standingWaves,
  doppler,
]
