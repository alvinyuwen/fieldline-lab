import {
  DEFAULT_TIME_STEP,
  ELECTRON_MASS,
  PLANCK_CONSTANT,
  REDUCED_PLANCK_CONSTANT,
  SPEED_OF_LIGHT,
  STANDARD_GRAVITY,
} from '../core/constants'
import { createRK4Sampler, numberForMath } from '../core/model-math'
import { defineSimulation, parameter, sample, timeDomain, vector } from './model-utils'
import type { ParameterValues, SimulationDefinition } from './types'

const EV = 1.602_176_634e-19
const depthLevels = {
  Intuition: 'Watch the motion or wave pattern first, then connect it to the model.',
  Equation: 'The current parameter values are substituted into the governing relation.',
  Derivation: 'Compare trajectories, phase-space variables, and conserved quantities.',
  Advanced: 'Numerical systems use fixed-step RK4; model assumptions and limits are stated below.',
} as const

const pendulumStateAt = createRK4Sampler(
  (p: ParameterValues) => [p.angle, 0],
  ([theta, omega], _time, p) => [omega, -(p.gravity / p.length) * Math.sin(theta)],
  DEFAULT_TIME_STEP,
)

const lorenzStateAt = createRK4Sampler(
  (p: ParameterValues) => [p.x0, 1, 1],
  ([x, y, z], _time, p) => [p.sigma * (y - x), x * (p.rho - z) - y, x * y - p.beta * z],
  0.005,
)

const doublePendulumDerivative = ([a1, w1, a2, w2]: readonly number[], _time: number, p: ParameterValues) => {
  const m1 = p.mass1
  const m2 = p.mass2
  const l1 = p.length1
  const l2 = p.length2
  const g = STANDARD_GRAVITY
  const delta = a1 - a2
  const denominator = 2 * m1 + m2 - m2 * Math.cos(2 * delta)
  const alpha1 = (-g * (2 * m1 + m2) * Math.sin(a1)
    - m2 * g * Math.sin(a1 - 2 * a2)
    - 2 * Math.sin(delta) * m2 * (w2 ** 2 * l2 + w1 ** 2 * l1 * Math.cos(delta)))
    / (l1 * denominator)
  const alpha2 = (2 * Math.sin(delta) * (w1 ** 2 * l1 * (m1 + m2)
    + g * (m1 + m2) * Math.cos(a1) + w2 ** 2 * l2 * m2 * Math.cos(delta)))
    / (l2 * denominator)
  return [w1, alpha1, w2, alpha2]
}

const doublePendulumStateAt = createRK4Sampler(
  (p: ParameterValues) => [p.angle, 0, 0.5, 0],
  doublePendulumDerivative,
  0.0025,
)

const lagrangianPendulum = defineSimulation({
  id: 'lagrangian-pendulum',
  title: 'Lagrangian pendulum',
  topic: 'Mechanics',
  levels: ['Y2', 'Y3'],
  description: 'Follow a nonlinear pendulum using its energy-based equation of motion.',
  scene: 'rotation',
  params: [
    parameter('length', 'Pendulum length', 'L', 'm', 0.2, 2, 0.01, 1),
    parameter('mass', 'Bob mass', 'm', 'kg', 0.1, 5, 0.1, 1),
    parameter('angle', 'Initial angle', 'θ₀', 'rad', -2.5, 2.5, 0.01, 0.8),
    parameter('gravity', 'Gravity', 'g', 'm/s²', 1, 20, 0.01, STANDARD_GRAVITY),
  ],
  domain: () => timeDomain(12),
  equation: String.raw`\ddot{\theta}+\frac{g}{L}\sin\theta=0`,
  vectors: [{ key: 'gravity', label: 'Gravity', color: '#F472B6' }],
  predictionPrompts: [{ question: 'For a large swing, does the small-angle period formula remain exact?', options: ['Yes, for any angle', 'No, the period grows slightly with amplitude', 'No, the period halves'], answer: 1, explanation: 'The small-angle approximation sin θ ≈ θ loses accuracy at large amplitude; the nonlinear pendulum period increases.' }],
  depthLevels,
  presets: [{ id: 'small-angle', label: 'Small angle', description: 'Compare with the harmonic small-angle approximation.', values: { angle: 0.1 } }, { id: 'large-angle', label: 'Large angle', description: 'Explore a nonlinear swing.', values: { angle: 1.8 } }],
  challenge: { title: 'Compare amplitudes', description: 'Set an initial angle above 1 radian to see stronger nonlinearity.', complete: (p) => Math.abs(p.angle) > 1 },
  assumptions: 'Point mass on a massless rigid rod; friction and air resistance are neglected. The trajectory uses RK4 with a fixed 1/240 s step.',
  whatToNotice: 'At large angles the motion is no longer sinusoidal, although total mechanical energy remains nearly constant.',
  sample: (t, p) => {
    const state = pendulumStateAt(p, t)
    const [theta, omega] = state
    const energy = 0.5 * p.mass * p.length ** 2 * omega ** 2 + p.mass * p.gravity * p.length * (1 - Math.cos(theta))
    const initialEnergy = p.mass * p.gravity * p.length * (1 - Math.cos(p.angle))
    const position: [number, number, number] = [p.length * Math.sin(theta), -p.length * Math.cos(theta), 0]
    return sample(
      theta, position, 'Angle', `${numberForMath(theta)} rad`,
      lagrangianPendulum.equation,
      String.raw`\ddot{\theta}=-(${numberForMath(p.gravity)}/${numberForMath(p.length)})\sin\theta`,
      [{ label: 'Angular speed', value: numberForMath(omega), unit: 'rad/s' }, { label: 'Mechanical energy', value: numberForMath(energy), unit: 'J' }],
      [vector('gravity', 'Gravity', '#F472B6', [0, -p.mass * p.gravity, 0], position)],
      [omega, 0, 0],
      { label: 'Mechanical energy', value: energy, initial: initialEnergy, relativeDrift: Math.abs(energy - initialEnergy) / Math.max(initialEnergy, 1e-12) },
    )
  },
})

const hamiltonianOscillator = defineSimulation({
  id: 'hamiltonian-oscillator',
  title: 'Hamiltonian oscillator',
  topic: 'Mechanics',
  levels: ['Y2', 'Y3'],
  description: 'Track position and canonical momentum in phase space.',
  scene: 'phase',
  params: [
    parameter('mass', 'Mass', 'm', 'kg', 0.1, 5, 0.01, 1),
    parameter('stiffness', 'Spring constant', 'k', 'N/m', 1, 100, 0.1, 16),
    parameter('position0', 'Initial position', 'x₀', 'm', -1, 1, 0.01, 0.4),
    parameter('momentum0', 'Initial momentum', 'p₀', 'kg·m/s', -5, 5, 0.01, 1),
  ],
  domain: () => timeDomain(8),
  equation: String.raw`H(x,p)=\frac{p^2}{2m}+\frac12kx^2`,
  vectors: [],
  predictionPrompts: [{ question: 'In phase space, what curve does an ideal harmonic oscillator trace?', options: ['An ellipse', 'A straight line', 'A random walk'], answer: 0, explanation: 'The fixed-energy relation p²/(2m)+kx²/2=H is an ellipse in (x,p).' }],
  depthLevels,
  presets: [{ id: 'zero-momentum', label: 'Release from rest', description: 'Start at maximum displacement with zero momentum.', values: { momentum0: 0 } }],
  challenge: { title: 'Increase the energy', description: 'Raise the initial momentum magnitude above 2 kg·m/s.', complete: (p) => Math.abs(p.momentum0) > 2 },
  assumptions: 'One-dimensional harmonic oscillator with constant mass and stiffness; analytical solution of Hamilton equations.',
  whatToNotice: 'Position and momentum exchange while the Hamiltonian remains constant.',
  sample: (t, p) => {
    const omega = Math.sqrt(p.stiffness / p.mass)
    const x = p.position0 * Math.cos(omega * t) + (p.momentum0 / (p.mass * omega)) * Math.sin(omega * t)
    const momentum = p.momentum0 * Math.cos(omega * t) - p.mass * omega * p.position0 * Math.sin(omega * t)
    const energy = momentum ** 2 / (2 * p.mass) + 0.5 * p.stiffness * x ** 2
    const initial = p.momentum0 ** 2 / (2 * p.mass) + 0.5 * p.stiffness * p.position0 ** 2
    return sample(
      x, [x, momentum, 0], 'Position', `${numberForMath(x)} m`,
      hamiltonianOscillator.equation,
      String.raw`H=\frac{(${numberForMath(momentum)})^2}{2(${numberForMath(p.mass)})}+\frac12(${numberForMath(p.stiffness)})(${numberForMath(x)})^2`,
      [{ label: 'Momentum', value: numberForMath(momentum), unit: 'kg·m/s' }, { label: 'Hamiltonian', value: numberForMath(energy), unit: 'J' }],
      undefined,
      [momentum / p.mass, 0, 0],
      { label: 'Hamiltonian', value: energy, initial, relativeDrift: Math.abs(energy - initial) / Math.max(initial, 1e-12) },
    )
  },
})

const lorenz = defineSimulation({
  id: 'lorenz-attractor',
  title: 'Lorenz attractor',
  topic: 'Math',
  levels: ['Y3', 'Y4'],
  description: 'Explore sensitive dependence in a classic nonlinear dynamical system.',
  scene: 'trajectory',
  params: [
    parameter('sigma', 'Prandtl parameter', 'σ', '1', 1, 20, 0.1, 10),
    parameter('rho', 'Rayleigh parameter', 'ρ', '1', 1, 50, 0.1, 28),
    parameter('beta', 'Geometric parameter', 'β', '1', 0.5, 6, 0.01, 2.667),
    parameter('x0', 'Initial x', 'x₀', '1', 0.1, 20, 0.1, 1),
  ],
  domain: () => timeDomain(20, 0.005),
  equation: String.raw`\dot{x}=\sigma(y-x),\quad\dot{y}=x(\rho-z)-y,\quad\dot{z}=xy-\beta z`,
  vectors: [],
  predictionPrompts: [{ question: 'Do two nearly identical Lorenz initial states stay close forever?', options: ['Yes, trajectories converge exactly', 'No, small differences can grow rapidly', 'Only if rho is zero'], answer: 1, explanation: 'The Lorenz system is chaotic in its classical parameter regime, so nearby states can diverge exponentially.' }],
  depthLevels,
  presets: [{ id: 'below-transition', label: 'Low Rayleigh', description: 'Below the classical chaotic regime.', values: { rho: 10 } }],
  challenge: { title: 'Shift the attractor', description: 'Raise the Rayleigh parameter above 32.', complete: (p) => p.rho > 32 },
  assumptions: 'The Lorenz equations are a reduced model of thermal convection, not a general fluid simulation. RK4 uses a 0.005 s step.',
  whatToNotice: 'The trajectory remains bounded while its detailed path is sensitive to initial conditions.',
  sample: (t, p) => {
    const [x, y, z] = lorenzStateAt(p, t)
    return sample(
      x, [x, y, z], 'Lorenz x coordinate', numberForMath(x),
      lorenz.equation,
      String.raw`(x,y,z)=(${numberForMath(x)},${numberForMath(y)},${numberForMath(z)})`,
      [{ label: 'y coordinate', value: numberForMath(y) }, { label: 'z coordinate', value: numberForMath(z) }],
    )
  },
})

const doublePendulum = defineSimulation({
  id: 'double-pendulum',
  title: 'Double pendulum',
  topic: 'Mechanics',
  levels: ['Y2', 'Y3'],
  description: 'See how coupled pendulums exchange energy and develop complex motion.',
  scene: 'trajectory',
  params: [
    parameter('mass1', 'Upper mass', 'm₁', 'kg', 0.1, 3, 0.05, 1),
    parameter('mass2', 'Lower mass', 'm₂', 'kg', 0.1, 3, 0.05, 1),
    parameter('length1', 'Upper length', 'L₁', 'm', 0.2, 2, 0.01, 1),
    parameter('length2', 'Lower length', 'L₂', 'm', 0.2, 2, 0.01, 1),
    parameter('angle', 'Initial upper angle', 'θ₁', 'rad', -2, 2, 0.01, 1),
  ],
  domain: () => timeDomain(15, 0.0025),
  equation: String.raw`L=T-V,\qquad \frac{d}{dt}\frac{\partial L}{\partial\dot q_i}-\frac{\partial L}{\partial q_i}=0`,
  vectors: [],
  predictionPrompts: [{ question: 'Why can two nearby initial angles lead to very different motion?', options: ['Because gravity changes randomly', 'Nonlinear coupling can amplify small differences', 'Because energy is not conserved'], answer: 1, explanation: 'The coupled nonlinear equations can be chaotic in some regimes, while ideal total mechanical energy remains conserved.' }],
  depthLevels,
  presets: [{ id: 'near-vertical', label: 'Small oscillation', description: 'Use a small initial angle for more regular motion.', values: { angle: 0.15 } }, { id: 'large-swing', label: 'Large swing', description: 'Increase the initial angle to explore complex motion.', values: { angle: 1.7 } }],
  challenge: { title: 'Explore coupling', description: 'Set the initial upper angle above 1.4 radians.', complete: (p) => Math.abs(p.angle) > 1.4 },
  assumptions: 'Two point masses joined by massless rigid rods in a plane, with no damping. Numerical integration uses RK4 at 0.0025 s.',
  whatToNotice: 'Energy moves between the links; strong nonlinear coupling can make the detailed motion sensitive to initial conditions.',
  sample: (t, p) => {
    const initial = [p.angle, 0, 0.5, 0]
    const [a1, w1, a2, w2] = doublePendulumStateAt(p, t)
    const x1 = p.length1 * Math.sin(a1)
    const y1 = -p.length1 * Math.cos(a1)
    const x2 = x1 + p.length2 * Math.sin(a2)
    const y2 = y1 - p.length2 * Math.cos(a2)
    const energy = doublePendulumEnergy([a1, w1, a2, w2], p.mass1, p.mass2, p.length1, p.length2, STANDARD_GRAVITY)
    const initialEnergy = doublePendulumEnergy(initial, p.mass1, p.mass2, p.length1, p.length2, STANDARD_GRAVITY)
    return sample(
      a1, [x2, y2, 0], 'Upper angle', `${numberForMath(a1)} rad`,
      doublePendulum.equation,
      String.raw`\theta_1=${numberForMath(a1)},\quad\theta_2=${numberForMath(a2)}`,
      [{ label: 'Lower bob x', value: numberForMath(x2), unit: 'm' }, { label: 'Lower bob y', value: numberForMath(y2), unit: 'm' }],
      undefined,
      [w1, 0, 0],
      { label: 'Mechanical energy', value: energy, initial: initialEnergy, relativeDrift: Math.abs(energy - initialEnergy) / Math.max(Math.abs(initialEnergy), 1e-12) },
    )
  },
})

const maxwellWave = defineSimulation({
  id: 'maxwell-wave',
  title: 'Electromagnetic wave',
  topic: 'Electromagnetism',
  levels: ['Y1', 'Y2'],
  description: 'See perpendicular electric and magnetic fields propagate together.',
  scene: 'wave',
  params: [
    parameter('electricAmplitude', 'Electric amplitude', 'E₀', 'V/m', 0.1, 1000, 1, 100),
    parameter('wavelength', 'Wavelength', 'λ', 'm', 0.1, 5, 0.01, 1),
    parameter('position', 'Position', 'x', 'm', 0, 5, 0.01, 0.25),
  ],
  domain: () => timeDomain(2e-8, 1e-11),
  equation: String.raw`E=E_0\sin(kx-\omega t),\qquad B=E/c`,
  vectors: [
    { key: 'electric', label: 'Electric field', color: '#FBBF24' },
    { key: 'magnetic', label: 'Magnetic field', color: '#A78BFA' },
  ],
  predictionPrompts: [{ question: 'In a vacuum electromagnetic wave, how are E and B related?', options: ['E=cB', 'B=cE', 'E and B are parallel'], answer: 0, explanation: 'The field magnitudes satisfy E=cB, and the fields are perpendicular to each other and the propagation direction.' }],
  depthLevels,
  presets: [{ id: 'short-wave', label: 'Short wavelength', description: 'Shorter wavelength means a higher frequency.', values: { wavelength: 0.5 } }],
  challenge: { title: 'Set the field scale', description: 'Use an electric amplitude of at least 500 V/m.', complete: (p) => p.electricAmplitude >= 500 },
  assumptions: 'Plane sinusoidal wave in vacuum; no material medium, sources, or dispersion.',
  whatToNotice: 'Electric field, magnetic field, and propagation direction are mutually perpendicular; E=cB.',
  sample: (t, p) => {
    const omega = (2 * Math.PI * SPEED_OF_LIGHT) / p.wavelength
    const phase = ((2 * Math.PI) / p.wavelength) * p.position - omega * t
    const electric = p.electricAmplitude * Math.sin(phase)
    const magnetic = electric / SPEED_OF_LIGHT
    return sample(
      electric, [p.position, electric / Math.max(p.electricAmplitude, 1), 0], 'Electric field', `${numberForMath(electric)} V/m`,
      maxwellWave.equation,
      String.raw`B=E/c=${numberForMath(magnetic)}\ \mathrm{T},\quad f=c/\lambda=${numberForMath(SPEED_OF_LIGHT / p.wavelength)}\ \mathrm{Hz}`,
      [{ label: 'Magnetic field', value: numberForMath(magnetic), unit: 'T' }, { label: 'Frequency', value: numberForMath(SPEED_OF_LIGHT / p.wavelength), unit: 'Hz' }],
      [vector('electric', 'Electric field', '#FBBF24', [0, electric, 0]), vector('magnetic', 'Magnetic field', '#A78BFA', [0, 0, magnetic * 1e8])],
    )
  },
})

const quantumWell = defineSimulation({
  id: 'quantum-well',
  title: 'Quantum well',
  topic: 'Modern Physics',
  levels: ['Y2', 'Y3'],
  description: 'Explore stationary states in a one-dimensional infinite well.',
  scene: 'quantum',
  params: [
    parameter('width', 'Well width', 'L', 'nm', 0.1, 5, 0.05, 1),
    parameter('level', 'Energy level', 'n', '1', 1, 8, 1, 1),
  ],
  domain: (p) => ({ variable: 'x', unit: 'nm', min: 0, max: p.width, step: p.width / 200 }),
  equation: String.raw`|\psi_n(x)|^2=\frac{2}{L}\sin^2\left(\frac{n\pi x}{L}\right),\quad E_n=\frac{n^2h^2}{8mL^2}`,
  vectors: [],
  predictionPrompts: [{ question: 'If well width doubles, how does the ground-state energy change?', options: ['It doubles', 'It halves', 'It falls to one quarter'], answer: 2, explanation: 'Energy scales as 1/L², so doubling L reduces the energy by a factor of four.' }],
  depthLevels,
  presets: [{ id: 'first-excited', label: 'First excited state', description: 'The first excited state has one interior node.', values: { level: 2 } }, { id: 'narrow-well', label: 'Narrow well', description: 'Confinement energy rises as the well narrows.', values: { width: 0.5 } }],
  challenge: { title: 'Find an interior node', description: 'Choose the first excited state, which has a node at the center.', complete: (p) => p.level === 2 },
  assumptions: 'Nonrelativistic electron in a one-dimensional infinite square well; displayed probability density is normalized.',
  whatToNotice: 'Higher states have more nodes, and a narrower well raises the allowed energies.',
  sample: (coordinate, p) => {
    const width = p.width * 1e-9
    const x = Math.max(0, Math.min(coordinate, p.width)) * 1e-9
    const n = Math.round(p.level)
    const density = (2 / width) * Math.sin((n * Math.PI * x) / width) ** 2
    const energyEv = (n ** 2 * PLANCK_CONSTANT ** 2 / (8 * ELECTRON_MASS * width ** 2)) / EV
    return sample(
      density, [coordinate, density / 1e9, 0], 'Probability density', `${numberForMath(density * 1e-9)} nm⁻¹`,
      quantumWell.equation,
      String.raw`E_n=${numberForMath(energyEv)}\ \mathrm{eV},\quad n=${n}`,
      [{ label: 'Energy', value: numberForMath(energyEv), unit: 'eV' }, { label: 'Wavelength', value: numberForMath((2 * width) / n * 1e9), unit: 'nm' }],
    )
  },
})

const quantumTunneling = defineSimulation({
  id: 'quantum-tunneling',
  title: 'Quantum tunneling',
  topic: 'Modern Physics',
  levels: ['Y3', 'Y4'],
  description: 'Estimate transmission through a finite rectangular barrier.',
  scene: 'quantum',
  params: [
    parameter('energy', 'Particle energy', 'E', 'eV', 0.05, 2, 0.01, 0.5),
    parameter('barrier', 'Barrier height', 'V₀', 'eV', 0.1, 3, 0.01, 1),
    parameter('width', 'Barrier width', 'a', 'nm', 0.1, 2, 0.01, 0.5),
  ],
  domain: (p) => ({ variable: 'x', unit: 'nm', min: 0, max: p.width, step: p.width / 200 }),
  equation: String.raw`T=\left[1+\frac{V_0^2\mathcal{S}^2(ka)}{4E|V_0-E|}\right]^{-1},\quad \mathcal{S}(z)=\begin{cases}\sinh z&E<V_0\\\sin z&E>V_0\end{cases}`,
  vectors: [],
  predictionPrompts: [{ question: 'What happens to transmission when a barrier gets wider?', options: ['It decreases exponentially', 'It increases linearly', 'It is unchanged'], answer: 0, explanation: 'For E<V₀, the wavefunction decays exponentially inside the barrier, so transmission falls rapidly with width.' }],
  depthLevels,
  presets: [{ id: 'thin-barrier', label: 'Thin barrier', description: 'A thinner barrier increases transmission.', values: { width: 0.2 } }],
  challenge: { title: 'Increase transmission', description: 'Make the barrier thinner than 0.3 nm.', complete: (p) => p.width < 0.3 },
  assumptions: 'One-dimensional rectangular barrier and an electron of mass mₑ. The plotted interior amplitude is a relative profile, not a boundary-matched normalized wavefunction. Transmission uses the exact stationary rectangular-barrier formula, with a continuous threshold limit.',
  whatToNotice: 'Below the barrier, the interior amplitude decays while the exact transmission remains nonzero.',
  sample: (coordinate, p) => {
    const energy = p.energy * EV
    const barrier = p.barrier * EV
    const width = p.width * 1e-9
    const hbar = REDUCED_PLANCK_CONSTANT
    const difference = barrier - energy
    const kappa = Math.sqrt(2 * ELECTRON_MASS * Math.abs(difference)) / hbar
    const z = Math.min(kappa * width, 350)
    const barrierEv = barrier / EV
    const energyEv = energy / EV
    const term = Math.abs(difference) < 1e-30
      ? barrierEv * EV * ELECTRON_MASS * width ** 2 / (2 * hbar ** 2)
      : difference > 0
        ? barrierEv ** 2 * Math.sinh(z) ** 2 / (4 * energyEv * (barrierEv - energyEv))
        : barrierEv ** 2 * Math.sin(z) ** 2 / (4 * energyEv * (energyEv - barrierEv))
    const transmission = 1 / (1 + term)
    const xNm = Math.max(0, Math.min(coordinate, p.width))
    const x = xNm * 1e-9
    const amplitude = difference > 0 ? Math.exp(-kappa * x) : Math.cos(kappa * x)
    return sample(
      amplitude ** 2, [xNm, amplitude, 0], 'Relative barrier intensity', numberForMath(amplitude ** 2),
      quantumTunneling.equation,
      String.raw`\kappa=${numberForMath(kappa)}\ \mathrm{m^{-1}},\quad T=${numberForMath(transmission)}`,
      [{ label: 'Transmission probability', value: numberForMath(transmission * 100), unit: '%' }, { label: 'Decay/oscillation constant', value: numberForMath(kappa * 1e-9), unit: 'nm⁻¹' }],
    )
  },
})

const doublePendulumEnergy = (state: readonly number[], m1: number, m2: number, l1: number, l2: number, g: number) => {
  const [theta1, omega1, theta2, omega2] = state
  const delta = theta1 - theta2
  const kinetic = 0.5 * (m1 + m2) * l1 ** 2 * omega1 ** 2
    + 0.5 * m2 * l2 ** 2 * omega2 ** 2
    + m2 * l1 * l2 * omega1 * omega2 * Math.cos(delta)
  const potential = -(m1 + m2) * g * l1 * Math.cos(theta1) - m2 * g * l2 * Math.cos(theta2)
  return kinetic + potential
}

export const advancedSimulations: readonly SimulationDefinition[] = [
  lagrangianPendulum,
  hamiltonianOscillator,
  lorenz,
  doublePendulum,
  maxwellWave,
  quantumWell,
  quantumTunneling,
]

export const advancedPhysics = { doublePendulumEnergy }
