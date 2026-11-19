import { integrateRK4, numberForMath } from '../core/model-math'
import { cross, magnitude } from '../core/vector'
import { defineSimulation, parameter, sample, timeDomain, vector } from './model-utils'
import type { SimulationDefinition } from './types'

const deg = (angle: number) => (angle * Math.PI) / 180
const levels = ['G12', 'Y1'] as const
const coreDepth = {
  Intuition: 'Change one physical quantity and watch the motion or force respond.',
  Equation: 'The displayed equation is evaluated with the current parameter values.',
  Derivation: 'Compare how geometry, inertia, and initial conditions determine the result.',
  Advanced: 'The model uses SI units and states its idealizations below.',
} as const

const torque = defineSimulation({
  id: 'torque-lever',
  title: 'Torque on a lever',
  topic: 'Mechanics',
  levels,
  description: 'Explore how force, lever arm, and angle set rotational effect.',
  scene: 'lever',
  params: [
    parameter('arm', 'Lever arm', 'r', 'm', 0.1, 2, 0.01, 0.8),
    parameter('force', 'Applied force', 'F', 'N', 0, 40, 0.1, 10),
    parameter('angle', 'Force angle', 'θ', 'deg', 0, 180, 1, 60),
  ],
  domain: () => timeDomain(1),
  equation: String.raw`\vec{\tau}=\vec{r}\times\vec{F}`,
  vectors: [
    { key: 'force', label: 'Force', color: '#FF6B6B' },
    { key: 'torque', label: 'Torque', color: '#34D399' },
  ],
  predictionPrompts: [{
    question: 'For the same force and arm, when is the torque largest?',
    options: ['When force is parallel to the arm', 'When force is perpendicular to the arm', 'The angle does not matter'],
    answer: 1,
    explanation: 'τ = rF sin θ, which is largest at 90 degrees.',
  }],
  depthLevels: coreDepth,
  presets: [
    { id: 'right-angle', label: 'Right angle', description: 'Maximum torque for this force and arm.', values: { angle: 90 } },
    { id: 'parallel', label: 'Parallel force', description: 'A force along the lever produces no torque.', values: { angle: 0 } },
  ],
  challenge: { title: 'Maximize the turn', description: 'Set the force perpendicular to the arm.', complete: (p) => Math.abs(p.angle - 90) < 1 },
  assumptions: 'The lever is rigid and massless; the pivot is frictionless. The torque magnitude is rF sin θ.',
  whatToNotice: 'Only the component of force perpendicular to the lever turns it.',
  sample: (_time, p) => {
    const theta = deg(p.angle)
    const tau = p.arm * p.force * Math.sin(theta)
    const forceVector: [number, number, number] = [p.force * Math.cos(theta), p.force * Math.sin(theta), 0]
    return sample(
      tau, [p.arm, 0, 0], 'Torque magnitude', `${numberForMath(tau)} N·m`,
      torque.equation,
      String.raw`\tau=${numberForMath(p.arm)}\times${numberForMath(p.force)}\times\sin(${numberForMath(p.angle)}^\circ)=${numberForMath(tau)}\ \mathrm{N\,m}`,
      [{ label: 'Lever arm', value: numberForMath(p.arm), unit: 'm' }, { label: 'Force component', value: numberForMath(p.force * Math.sin(theta)), unit: 'N' }],
      [vector('force', 'Force', '#FF6B6B', forceVector, [p.arm, 0, 0]), vector('torque', 'Torque', '#34D399', [0, 0, tau], [p.arm, 0, 0])],
    )
  },
})

const projectile = defineSimulation({
  id: 'projectile-motion',
  title: 'Projectile motion',
  topic: 'Mechanics',
  levels,
  description: 'Separate horizontal and vertical motion under gravity.',
  scene: 'trajectory',
  params: [
    parameter('speed', 'Launch speed', 'v₀', 'm/s', 0, 40, 0.1, 14),
    parameter('angle', 'Launch angle', 'θ', 'deg', 0, 90, 1, 50),
    parameter('height', 'Launch height', 'y₀', 'm', 0, 10, 0.1, 1),
    parameter('gravity', 'Gravity', 'g', 'm/s²', 1, 20, 0.01, 9.81),
  ],
  domain: (p) => {
    const vertical = p.speed * Math.sin(deg(p.angle))
    return timeDomain((vertical + Math.sqrt(vertical ** 2 + 2 * p.gravity * p.height)) / p.gravity)
  },
  equation: String.raw`x=v_0\cos\theta\,t,\qquad y=y_0+v_0\sin\theta\,t-\frac12gt^2`,
  vectors: [
    { key: 'velocity', label: 'Velocity', color: '#22D3EE' },
    { key: 'gravity', label: 'Gravity', color: '#F472B6' },
  ],
  predictionPrompts: [{
    question: 'At the highest point (without air resistance), what is the vertical velocity?',
    options: ['Zero', 'Equal to launch speed', 'Still increasing'],
    answer: 0,
    explanation: 'Gravity reduces the vertical component to zero at the apex; horizontal velocity stays constant.',
  }],
  depthLevels: coreDepth,
  presets: [
    { id: 'forty-five', label: '45° launch', description: 'A useful reference angle for equal launch and landing height.', values: { angle: 45, height: 0 } },
    { id: 'high-launch', label: 'Elevated launch', description: 'Launch from a platform.', values: { height: 5 } },
  ],
  challenge: { title: 'Reach the target range', description: 'Make the range at least 30 m.', complete: (p) => p.speed ** 2 * Math.sin(2 * deg(p.angle)) / p.gravity >= 30 },
  assumptions: 'Uniform gravitational field; air resistance and Earth curvature are neglected.',
  whatToNotice: 'Horizontal speed is constant while vertical speed changes at −g.',
  sample: (t, p) => {
    const theta = deg(p.angle)
    const vx = p.speed * Math.cos(theta)
    const vy = p.speed * Math.sin(theta) - p.gravity * t
    const x = vx * t
    const y = Math.max(0, p.height + p.speed * Math.sin(theta) * t - 0.5 * p.gravity * t * t)
    const flight = projectile.domain(p).max
    const range = vx * flight
    return sample(
      y, [x, y, 0], 'Height', `${numberForMath(y)} m`,
      projectile.equation,
      String.raw`x(${numberForMath(t)})=${numberForMath(vx)}t,\quad y(${numberForMath(t)})=${numberForMath(p.height)}+${numberForMath(p.speed * Math.sin(theta))}t-\frac12(${numberForMath(p.gravity)})t^2`,
      [{ label: 'Height', value: numberForMath(y), unit: 'm' }, { label: 'Flight time', value: numberForMath(flight), unit: 's' }, { label: 'Range', value: numberForMath(range), unit: 'm' }],
      [vector('gravity', 'Gravity', '#F472B6', [0, -p.gravity, 0], [x, y, 0])],
      [vx, vy, 0],
    )
  },
})

const springMass = defineSimulation({
  id: 'spring-mass',
  title: 'Spring-mass SHM',
  topic: 'Mechanics',
  levels,
  description: 'Track displacement, speed, and conserved mechanical energy.',
  scene: 'trajectory',
  params: [
    parameter('mass', 'Mass', 'm', 'kg', 0.1, 5, 0.01, 1),
    parameter('stiffness', 'Spring constant', 'k', 'N/m', 1, 100, 0.1, 20),
    parameter('amplitude', 'Amplitude', 'A', 'm', 0.01, 1, 0.01, 0.25),
    parameter('phase', 'Initial phase', 'φ', 'rad', 0, 6.28, 0.01, 0),
  ],
  domain: (p) => timeDomain(4 * 2 * Math.PI * Math.sqrt(p.mass / p.stiffness)),
  equation: String.raw`x=A\cos(\omega t+\phi),\qquad \omega=\sqrt{k/m}`,
  vectors: [{ key: 'restoring-force', label: 'Restoring force', color: '#FF6B6B' }],
  predictionPrompts: [{
    question: 'At maximum displacement, how fast is the mass moving?',
    options: ['At maximum speed', 'Instantaneously at rest', 'At half its maximum speed'],
    answer: 1,
    explanation: 'The mass reverses direction at each turning point, so its instantaneous speed is zero.',
  }],
  depthLevels: coreDepth,
  presets: [{ id: 'soft-spring', label: 'Soft spring', description: 'A lower stiffness increases the period.', values: { stiffness: 8 } }],
  challenge: { title: 'Try a softer spring', description: 'Reduce the spring constant below 10 N/m and compare the longer period.', complete: (p) => p.stiffness < 10 },
  assumptions: 'Ideal linear spring, no damping, and one-dimensional motion about equilibrium.',
  whatToNotice: 'Kinetic and spring potential energy trade off while their sum stays constant.',
  sample: (t, p) => {
    const omega = Math.sqrt(p.stiffness / p.mass)
    const phase = omega * t + p.phase
    const x = p.amplitude * Math.cos(phase)
    const v = -p.amplitude * omega * Math.sin(phase)
    const kinetic = 0.5 * p.mass * v * v
    const potential = 0.5 * p.stiffness * x * x
    const energy = 0.5 * p.stiffness * p.amplitude * p.amplitude
    return sample(
      x, [x, 0, 0], 'Displacement', `${numberForMath(x)} m`,
      springMass.equation,
      String.raw`x=${numberForMath(p.amplitude)}\cos(${numberForMath(omega)}t+${numberForMath(p.phase)})`,
      [{ label: 'Kinetic energy', value: numberForMath(kinetic), unit: 'J' }, { label: 'Spring energy', value: numberForMath(potential), unit: 'J' }, { label: 'Total energy', value: numberForMath(energy), unit: 'J' }],
      [vector('restoring-force', 'Restoring force', '#FF6B6B', [-p.stiffness * x, 0, 0], [x, 0, 0])],
      [v, 0, 0],
      { label: 'Mechanical energy', value: kinetic + potential, initial: energy, relativeDrift: Math.abs(kinetic + potential - energy) / Math.max(energy, 1e-12) },
    )
  },
})

const circularMotion = defineSimulation({
  id: 'circular-motion',
  title: 'Uniform circular motion',
  topic: 'Mechanics',
  levels,
  description: 'See how a perpendicular force changes velocity direction.',
  scene: 'rotation',
  params: [
    parameter('mass', 'Mass', 'm', 'kg', 0.1, 10, 0.1, 1),
    parameter('radius', 'Orbit radius', 'r', 'm', 0.1, 4, 0.01, 1),
    parameter('speed', 'Tangential speed', 'v', 'm/s', 0, 12, 0.1, 4),
  ],
  domain: (p) => timeDomain(2 * Math.PI * p.radius / Math.max(p.speed, 0.1)),
  equation: String.raw`a_c=\frac{v^2}{r},\qquad F_c=ma_c`,
  vectors: [
    { key: 'velocity', label: 'Velocity', color: '#22D3EE' },
    { key: 'centripetal', label: 'Centripetal force', color: '#FF6B6B' },
  ],
  predictionPrompts: [{
    question: 'At constant speed, what happens to centripetal acceleration if radius halves?',
    options: ['It doubles', 'It quadruples', 'It halves'],
    answer: 0,
    explanation: 'At fixed speed, a_c = v²/r, so halving r doubles the acceleration.',
  }],
  depthLevels: coreDepth,
  presets: [{ id: 'slow-turn', label: 'Slow turn', description: 'Reduce speed while holding radius fixed.', values: { speed: 2 } }],
  challenge: { title: 'Double the centripetal force', description: 'Double the speed from its default while keeping radius fixed.', complete: (p) => p.speed >= 8 && p.radius === 1 },
  assumptions: 'Speed and radius are constant; the inward net force is the centripetal force.',
  whatToNotice: 'The inward acceleration is perpendicular to velocity, changing direction without changing speed.',
  sample: (t, p) => {
    const omega = p.speed / p.radius
    const angle = omega * t
    const position: [number, number, number] = [p.radius * Math.cos(angle), p.radius * Math.sin(angle), 0]
    const velocity: [number, number, number] = [-p.speed * Math.sin(angle), p.speed * Math.cos(angle), 0]
    const force: [number, number, number] = [-p.mass * omega * omega * position[0], -p.mass * omega * omega * position[1], 0]
    return sample(
      position[0], position, 'Horizontal position', `${numberForMath(position[0])} m`,
      circularMotion.equation,
      String.raw`a_c=\frac{(${numberForMath(p.speed)})^2}{${numberForMath(p.radius)}}=${numberForMath(p.speed ** 2 / p.radius)}\ \mathrm{m/s^2}`,
      [{ label: 'Angular speed', value: numberForMath(omega), unit: 'rad/s' }, { label: 'Centripetal force', value: numberForMath(p.mass * p.speed ** 2 / p.radius), unit: 'N' }, { label: 'Period', value: omega === 0 ? 'undefined at zero speed' : numberForMath(2 * Math.PI / omega), ...(omega === 0 ? {} : { unit: 's' }) }],
      [vector('centripetal', 'Centripetal force', '#FF6B6B', force, position)],
      velocity,
    )
  },
})

const collisions = defineSimulation({
  id: 'collisions',
  title: '1D and 2D collisions',
  topic: 'Mechanics',
  levels,
  description: 'Compare momentum and energy before and after impact.',
  scene: 'collision',
  params: [
    parameter('mass1', 'Mass 1', 'm₁', 'kg', 0.2, 5, 0.1, 1),
    parameter('mass2', 'Mass 2', 'm₂', 'kg', 0.2, 5, 0.1, 1),
    parameter('speed1', 'Incoming speed', 'u₁', 'm/s', 1, 8, 0.1, 2.5),
    parameter('speed2', 'Second speed', 'u₂', 'm/s', 0, 0.5, 0.01, 0),
    parameter('restitution', 'Restitution', 'e', '1', 0, 1, 0.01, 1),
    parameter('angle', 'Approach angle', 'θ', 'deg', 0, 45, 1, 20),
  ],
  domain: (p) => {
    const relative = p.speed1 * Math.cos(deg(p.angle)) - p.speed2
    const impact = relative > 0 ? 0.8 / relative : 0.8
    return timeDomain(impact + 1)
  },
  equation: String.raw`v_{1x}=\frac{(m_1-em_2)u_{1x}+(1+e)m_2u_{2x}}{m_1+m_2}`,
  vectors: [
    { key: 'velocity-1', label: 'Velocity 1', color: '#22D3EE' },
    { key: 'velocity-2', label: 'Velocity 2', color: '#FB923C' },
  ],
  predictionPrompts: [{
    question: 'In a perfectly elastic collision, what is conserved?',
    options: ['Momentum only', 'Kinetic energy only', 'Momentum and kinetic energy'],
    answer: 2,
    explanation: 'An ideal elastic collision conserves both total momentum and total kinetic energy.',
  }],
  depthLevels: coreDepth,
  presets: [{ id: 'equal-elastic', label: 'Equal elastic masses', description: 'For equal masses, the first ball transfers its normal velocity.', values: { mass1: 1, mass2: 1, restitution: 1, angle: 0, speed2: 0 } }],
  challenge: { title: 'Transfer the motion', description: 'Set equal masses and a perfectly elastic, head-on impact.', complete: (p) => Math.abs(p.mass1 - p.mass2) < 0.05 && p.restitution > 0.99 && p.angle < 1 },
  assumptions: 'Smooth spheres, a central collision normal, and a user-set coefficient of restitution; tangential velocity is unchanged.',
  whatToNotice: 'Momentum is conserved for all restitution values; kinetic energy is conserved only when e = 1.',
  sample: (t, p) => {
    const theta = deg(p.angle)
    const u1x = p.speed1 * Math.cos(theta)
    const u1y = p.speed1 * Math.sin(theta)
    const v1x = ((p.mass1 - p.restitution * p.mass2) * u1x + (1 + p.restitution) * p.mass2 * p.speed2) / (p.mass1 + p.mass2)
    const v2x = ((p.mass2 - p.restitution * p.mass1) * p.speed2 + (1 + p.restitution) * p.mass1 * u1x) / (p.mass1 + p.mass2)
    const impactTime = collisions.domain(p).max - 1
    const before = t < impactTime
    const x1 = before ? -0.5 + u1x * t : -0.5 + u1x * impactTime + v1x * (t - impactTime)
    const x2 = before ? 0.5 + p.speed2 * t : 0.5 + p.speed2 * impactTime + v2x * (t - impactTime)
    const y1 = before ? u1y * t : u1y * impactTime + u1y * (t - impactTime)
    const momentumBefore = p.mass1 * u1x + p.mass2 * p.speed2
    const momentumAfter = p.mass1 * v1x + p.mass2 * v2x
    const energyBefore = 0.5 * p.mass1 * p.speed1 ** 2 + 0.5 * p.mass2 * p.speed2 ** 2
    const energyAfter = 0.5 * p.mass1 * (v1x ** 2 + u1y ** 2) + 0.5 * p.mass2 * v2x ** 2
    return sample(
      x1, [x1, y1, 0], 'Position of mass 1', `${numberForMath(x1)} m`,
      collisions.equation,
      String.raw`v_{1x}=${numberForMath(v1x)}\ \mathrm{m/s},\quad v_{2x}=${numberForMath(v2x)}\ \mathrm{m/s}`,
      [{ label: 'Mass 1 velocity after impact', value: numberForMath(v1x), unit: 'm/s' }, { label: 'Mass 2 velocity after impact', value: numberForMath(v2x), unit: 'm/s' }, { label: 'Momentum before', value: numberForMath(momentumBefore), unit: 'kg·m/s' }, { label: 'Momentum after', value: numberForMath(momentumAfter), unit: 'kg·m/s' }, { label: 'Kinetic energy before', value: numberForMath(energyBefore), unit: 'J' }, { label: 'Kinetic energy after', value: numberForMath(energyAfter), unit: 'J' }],
      [vector('velocity-1', 'Velocity 1', '#22D3EE', [before ? u1x : v1x, u1y, 0], [x1, y1, 0]), vector('velocity-2', 'Velocity 2', '#FB923C', [before ? p.speed2 : v2x, 0, 0], [x2, 0, 0])],
      [before ? u1x : v1x, u1y, 0],
      { label: 'Momentum', value: momentumAfter, initial: momentumBefore, relativeDrift: Math.abs(momentumAfter - momentumBefore) / Math.max(Math.abs(momentumBefore), 1e-12) },
    )
  },
})

const rotationalDynamics = defineSimulation({
  id: 'rotational-dynamics',
  title: 'Rotational dynamics',
  topic: 'Mechanics',
  levels: ['Y1', 'Y2'],
  description: 'Apply a net torque and follow angular motion.',
  scene: 'rotation',
  params: [
    parameter('inertia', 'Moment of inertia', 'I', 'kg·m²', 0.1, 10, 0.1, 2),
    parameter('torque', 'Net torque', 'τ', 'N·m', -10, 10, 0.1, 3),
    parameter('omega0', 'Initial angular speed', 'ω₀', 'rad/s', -8, 8, 0.1, 0.5),
  ],
  domain: () => timeDomain(6),
  equation: String.raw`\alpha=\frac{\tau}{I},\qquad \omega=\omega_0+\alpha t`,
  vectors: [{ key: 'torque', label: 'Torque', color: '#34D399' }],
  predictionPrompts: [{
    question: 'For the same torque, what happens to angular acceleration if I doubles?',
    options: ['It doubles', 'It halves', 'It stays the same'],
    answer: 1,
    explanation: 'α = τ/I, so doubling rotational inertia halves angular acceleration.',
  }],
  depthLevels: coreDepth,
  presets: [{ id: 'constant-speed', label: 'Constant speed', description: 'Zero net torque keeps angular speed fixed.', values: { torque: 0 } }],
  challenge: { title: 'Reverse the spin', description: 'Use a braking torque to make angular speed negative within six seconds.', complete: (p) => p.torque < 0 && p.omega0 > 0 && p.omega0 + (p.torque / p.inertia) * 6 < 0 },
  assumptions: 'Rigid body about a fixed axis with constant moment of inertia and applied torque.',
  whatToNotice: 'Angular acceleration increases with torque and decreases with rotational inertia.',
  sample: (t, p) => {
    const alpha = p.torque / p.inertia
    const omega = p.omega0 + alpha * t
    const angle = p.omega0 * t + 0.5 * alpha * t * t
    const energy = 0.5 * p.inertia * omega * omega
    return sample(
      omega, [Math.cos(angle), Math.sin(angle), 0], 'Angular speed', `${numberForMath(omega)} rad/s`,
      rotationalDynamics.equation,
      String.raw`\alpha=${numberForMath(p.torque)}/${numberForMath(p.inertia)}=${numberForMath(alpha)}\ \mathrm{rad/s^2}`,
      [{ label: 'Angular displacement', value: numberForMath(angle), unit: 'rad' }, { label: 'Rotational kinetic energy', value: numberForMath(energy), unit: 'J' }],
      [vector('torque', 'Torque', '#34D399', [0, 0, p.torque])],
    )
  },
})

const momentOfInertia = defineSimulation({
  id: 'moment-of-inertia',
  title: 'Moment of inertia',
  topic: 'Mechanics',
  levels: ['G12', 'Y1'],
  description: 'Compare rotational inertia for familiar mass distributions.',
  scene: 'rotation',
  params: [
    parameter('mass', 'Mass', 'm', 'kg', 0.1, 20, 0.1, 2),
    parameter('radius', 'Radius or length', 'R', 'm', 0.1, 2, 0.01, 0.5),
    parameter('shapeFactor', 'Shape factor', 'c', '1', 0.08, 1, 0.001, 0.5),
    parameter('omega', 'Angular speed', 'ω', 'rad/s', 0, 10, 0.1, 3),
  ],
  domain: () => timeDomain(4),
  equation: String.raw`I=c\,mR^2,\qquad K_\mathrm{rot}=\frac12I\omega^2`,
  vectors: [{ key: 'angular-momentum', label: 'Angular momentum', color: '#FB923C' }],
  predictionPrompts: [{
    question: 'If all mass moves twice as far from the axis, how does I change?',
    options: ['It doubles', 'It quadruples', 'It is unchanged'],
    answer: 1,
    explanation: 'For a fixed shape, I is proportional to R².',
  }],
  depthLevels: coreDepth,
  presets: [
    { id: 'disk', label: 'Solid disk', description: 'I = 1/2 mR².', values: { shapeFactor: 0.5 } },
    { id: 'sphere', label: 'Solid sphere', description: 'I = 2/5 mR².', values: { shapeFactor: 0.4 } },
    { id: 'ring', label: 'Thin ring', description: 'I = mR².', values: { shapeFactor: 1 } },
    { id: 'rod', label: 'Thin rod', description: 'I = 1/12 mL² about its center.', values: { shapeFactor: 1 / 12 } },
  ],
  challenge: { title: 'Compare shapes', description: 'Choose a thin ring and observe its larger inertia at the same mass and radius.', complete: (p) => p.shapeFactor > 0.95 },
  assumptions: 'The shape factor c uses the standard axis specified in each preset: disk, sphere, ring, or rod through its center.',
  whatToNotice: 'Mass farther from the axis contributes more strongly to rotational inertia.',
  sample: (_t, p) => {
    const inertia = p.shapeFactor * p.mass * p.radius ** 2
    const energy = 0.5 * inertia * p.omega ** 2
    const shape = p.shapeFactor > 0.95 ? 'thin ring' : p.shapeFactor < 0.15 ? 'thin rod' : Math.abs(p.shapeFactor - 0.4) < 0.03 ? 'solid sphere' : 'solid disk'
    return sample(
      inertia, [p.radius, 0, 0], 'Moment of inertia', `${numberForMath(inertia)} kg·m²`,
      momentOfInertia.equation,
      String.raw`I=${numberForMath(p.shapeFactor)}\times${numberForMath(p.mass)}\times(${numberForMath(p.radius)})^2=${numberForMath(inertia)}\ \mathrm{kg\,m^2}`,
      [{ label: 'Shape', value: shape }, { label: 'Rotational energy', value: numberForMath(energy), unit: 'J' }, { label: 'Angular momentum', value: numberForMath(inertia * p.omega), unit: 'kg·m²/s' }],
      [vector('angular-momentum', 'Angular momentum', '#FB923C', [0, 0, inertia * p.omega])],
    )
  },
})

export const mechanicsSimulations: readonly SimulationDefinition[] = [
  torque,
  projectile,
  springMass,
  circularMotion,
  collisions,
  rotationalDynamics,
  momentOfInertia,
]

export const mechanicsPhysics = {
  projectileRange: (speed: number, angle: number, gravity: number) => speed ** 2 * Math.sin(2 * deg(angle)) / gravity,
  collisionVelocities: (m1: number, m2: number, u1: number, u2: number, restitution: number) => [
    ((m1 - restitution * m2) * u1 + (1 + restitution) * m2 * u2) / (m1 + m2),
    ((m2 - restitution * m1) * u2 + (1 + restitution) * m1 * u1) / (m1 + m2),
  ] as const,
  doublePendulumEnergy: (state: readonly number[], m1: number, m2: number, l1: number, l2: number, g: number) => {
    const [theta1, omega1, theta2, omega2] = state
    const delta = theta1 - theta2
    const kinetic = 0.5 * (m1 + m2) * l1 ** 2 * omega1 ** 2
      + 0.5 * m2 * l2 ** 2 * omega2 ** 2
      + m2 * l1 * l2 * omega1 * omega2 * Math.cos(delta)
    const potential = -(m1 + m2) * g * l1 * Math.cos(theta1) - m2 * g * l2 * Math.cos(theta2)
    return kinetic + potential
  },
  integrateRK4,
  vectorMagnitude: magnitude,
  cross,
}
