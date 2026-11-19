import { numberForMath } from '../core/model-math'
import { COULOMB_CONSTANT, VACUUM_PERMITTIVITY, VACUUM_PERMEABILITY } from '../core/constants'
import { defineSimulation, parameter, sample, timeDomain, vector } from './model-utils'
import type { SimulationDefinition } from './types'

const depthLevels = {
  Intuition: 'Change one physical quantity and watch the field or circuit response.',
  Equation: 'The displayed equation is evaluated with the current parameter values.',
  Derivation: 'Compare how geometry and boundary conditions shape the result.',
  Advanced: 'SI units are used throughout; idealizations are listed below.',
} as const

const electricField = defineSimulation({
  id: 'electric-field',
  title: 'Electric field and equipotentials',
  topic: 'Electromagnetism',
  levels: ['G12', 'Y1'],
  description: 'Map the field and potential around a point charge.',
  scene: 'field',
  params: [
    parameter('charge', 'Source charge', 'q', 'μC', -10, 10, 0.1, 1),
  ],
  domain: () => ({ variable: 'r', unit: 'm', min: 0.1, max: 3, step: 0.01 }),
  equation: String.raw`E=\frac{k|q|}{r^2},\qquad V=\frac{kq}{r}`,
  vectors: [{ key: 'electric', label: 'Electric field', color: '#FBBF24' }],
  predictionPrompts: [{ question: 'If distance from a point charge doubles, what happens to field magnitude?', options: ['It halves', 'It falls to one quarter', 'It doubles'], answer: 1, explanation: 'Point-charge field strength is proportional to 1/r².' }],
  depthLevels,
  presets: [{ id: 'negative-charge', label: 'Negative source', description: 'Reverse the field direction and potential sign.', values: { charge: -1 } }],
  challenge: { title: 'Increase source charge', description: 'Raise the source charge magnitude above 5 μC.', complete: (p) => Math.abs(p.charge) >= 5 },
  assumptions: 'An isolated point charge in vacuum; no polarization or nearby boundaries.',
  whatToNotice: 'Field arrows point away from positive charge and toward negative charge; equipotential surfaces are concentric spheres.',
  sample: (coordinate, p) => {
    const r = Math.max(coordinate, 0.1)
    const q = p.charge * 1e-6
    const field = COULOMB_CONSTANT * Math.abs(q) / r ** 2
    const potential = COULOMB_CONSTANT * q / r
    const direction = Math.sign(q) || 1
    return sample(
      field, [r, 0, 0], 'Field magnitude', `${numberForMath(field)} N/C`,
      electricField.equation,
      String.raw`E=\frac{(8.99\times10^9)|${numberForMath(q)}|}{(${numberForMath(r)})^2}=${numberForMath(field)}\ \mathrm{N/C}`,
      [{ label: 'Electric potential', value: numberForMath(potential), unit: 'V' }],
      [vector('electric', 'Electric field', '#FBBF24', [direction * field, 0, 0], [r, 0, 0])],
    )
  },
})

const faraday = defineSimulation({
  id: 'faraday-lenz',
  title: 'Faraday-Lenz induction',
  topic: 'Electromagnetism',
  levels: ['G12', 'Y1'],
  description: 'Follow induced emf as magnetic flux changes through a coil.',
  scene: 'coil',
  params: [
    parameter('turns', 'Coil turns', 'N', '1', 1, 500, 1, 100),
    parameter('radius', 'Coil radius', 'r', 'm', 0.01, 0.5, 0.005, 0.1),
    parameter('field', 'Field amplitude', 'B₀', 'T', 0, 1, 0.01, 0.2),
    parameter('frequency', 'Field frequency', 'f', 'Hz', 0.1, 10, 0.1, 1),
  ],
  domain: (p) => timeDomain(2 / p.frequency),
  equation: String.raw`\mathcal{E}=-N\frac{d\Phi_B}{dt},\qquad \Phi_B=BA`,
  vectors: [{ key: 'induced-emf', label: 'Induced emf', color: '#FF6B6B' }],
  predictionPrompts: [{ question: 'What does the minus sign in Faraday-Lenz law express?', options: ['Resistance', 'The induced effect opposes the change in flux', 'The field is always negative'], answer: 1, explanation: 'The induced current creates a magnetic field opposing the change in magnetic flux.' }],
  depthLevels,
  presets: [{ id: 'fast-change', label: 'Faster change', description: 'A faster changing field increases induced emf.', values: { frequency: 3 } }],
  challenge: { title: 'Increase the emf', description: 'Raise frequency to at least 3 Hz.', complete: (p) => p.frequency >= 3 },
  assumptions: 'A uniform field perpendicular to a circular N-turn coil, with B(t)=B₀ cos(2πft). Coil resistance is not modeled.',
  whatToNotice: 'Induced emf is largest when the flux is changing fastest and reverses sign as the flux change reverses.',
  sample: (t, p) => {
    const omega = 2 * Math.PI * p.frequency
    const area = Math.PI * p.radius ** 2
    const flux = p.field * area * Math.cos(omega * t)
    const emf = p.turns * p.field * area * omega * Math.sin(omega * t)
    return sample(
      emf, [Math.cos(omega * t), Math.sin(omega * t), 0], 'Induced emf', `${numberForMath(emf)} V`,
      faraday.equation,
      String.raw`\mathcal{E}=N B_0 A\omega\sin(\omega t),\quad A=${numberForMath(area)}\ \mathrm{m^2}`,
      [{ label: 'Magnetic flux per turn', value: numberForMath(flux), unit: 'Wb' }, { label: 'Peak emf', value: numberForMath(p.turns * p.field * area * omega), unit: 'V' }],
      [vector('induced-emf', 'Induced emf', '#FF6B6B', [0, 0, emf])],
    )
  },
})

const biotSavart = defineSimulation({
  id: 'biot-savart-coil',
  title: 'Biot-Savart coil',
  topic: 'Electromagnetism',
  levels: ['Y1', 'Y2'],
  description: 'Explore the axial magnetic field of a circular current loop.',
  scene: 'coil',
  params: [
    parameter('turns', 'Coil turns', 'N', '1', 1, 500, 1, 80),
    parameter('current', 'Current', 'I', 'A', 0, 10, 0.05, 2),
    parameter('radius', 'Coil radius', 'R', 'm', 0.02, 0.5, 0.005, 0.12),
  ],
  domain: () => ({ variable: 'x', unit: 'm', min: -0.5, max: 0.5, step: 0.005 }),
  equation: String.raw`B_x(x)=\frac{\mu_0NIR^2}{2(R^2+x^2)^{3/2}}`,
  vectors: [{ key: 'magnetic', label: 'Magnetic field', color: '#A78BFA' }],
  predictionPrompts: [{ question: 'At the center of the coil, how does B change if current doubles?', options: ['It halves', 'It doubles', 'It is unchanged'], answer: 1, explanation: 'The field is proportional to current.' }],
  depthLevels,
  presets: [{ id: 'two-coils', label: 'More turns', description: 'A larger turn count strengthens the field.', values: { turns: 200 } }],
  challenge: { title: 'Strengthen the field', description: 'Raise the coil current above 3 A.', complete: (p) => p.current >= 3 },
  assumptions: 'Thin circular coil with tightly wound identical turns; the displayed field is on the coil axis in vacuum.',
  whatToNotice: 'The axial field is strongest at the center and falls as the probe moves away.',
  sample: (x, p) => {
    const radius = p.radius
    const field = (VACUUM_PERMEABILITY * p.turns * p.current * radius ** 2)
      / (2 * (radius ** 2 + x ** 2) ** 1.5)
    return sample(
      field, [x, 0, 0], 'Axial magnetic field', `${numberForMath(field)} T`,
      biotSavart.equation,
      String.raw`B_x=${numberForMath(field)}\ \mathrm{T}`,
      [{ label: 'On-axis field', value: numberForMath(field), unit: 'T' }],
      [vector('magnetic', 'Magnetic field', '#A78BFA', [0, 0, field], [x, 0, 0])],
    )
  },
})

const gaussLaw = defineSimulation({
  id: 'gauss-flux',
  title: 'Gauss law and flux',
  topic: 'Electromagnetism',
  levels: ['G12', 'Y1'],
  description: 'Relate enclosed charge to electric flux through a closed surface.',
  scene: 'gauss',
  params: [
    parameter('charge', 'Enclosed charge', 'Q', 'nC', -100, 100, 1, 10),
    parameter('enclosedFraction', 'Charge enclosed', 'f', '1', 0, 1, 0.01, 1),
  ],
  domain: () => ({ variable: 'r', unit: 'm', min: 0.1, max: 3, step: 0.01 }),
  equation: String.raw`\oint_S\vec{E}\cdot d\vec{A}=\frac{Q_\mathrm{enc}}{\epsilon_0}`,
  vectors: [{ key: 'electric', label: 'Electric field', color: '#FBBF24' }],
  predictionPrompts: [{ question: 'For a centered point charge, does changing Gaussian sphere radius change total flux?', options: ['Yes, flux decreases', 'No, flux is unchanged', 'Yes, flux increases'], answer: 1, explanation: 'Gauss law fixes total flux by enclosed charge, independent of surface radius.' }],
  depthLevels,
  presets: [{ id: 'outside-charge', label: 'Charge outside', description: 'A charge outside the Gaussian surface contributes zero enclosed charge.', values: { enclosedFraction: 0 } }],
  challenge: { title: 'No enclosed charge', description: 'Move the source outside the Gaussian surface.', complete: (p) => p.enclosedFraction < 0.01 },
  assumptions: 'Spherical symmetry is used for the displayed local field. The flux relation holds for any closed surface.',
  whatToNotice: 'Surface size changes local field strength, but total flux depends only on enclosed charge.',
  sample: (radius, p) => {
    const charge = p.charge * 1e-9 * p.enclosedFraction
    const flux = charge / VACUUM_PERMITTIVITY
    const field = flux / (4 * Math.PI * radius ** 2)
    return sample(
      flux, [radius, 0, 0], 'Electric flux', `${numberForMath(flux)} N·m²/C`,
      gaussLaw.equation,
      String.raw`\Phi_E=\frac{(${numberForMath(charge)}\ \mathrm{C})}{8.854\times10^{-12}\ \mathrm{C^2/(N\,m^2)}}=${numberForMath(flux)}\ \mathrm{N\,m^2/C}`,
      [{ label: 'Spherical field', value: numberForMath(field), unit: 'N/C' }, { label: 'Enclosed charge', value: numberForMath(charge), unit: 'C' }],
      [vector('electric', 'Electric field', '#FBBF24', [field, 0, 0], [p.radius, 0, 0])],
    )
  },
})

const rcCircuit = defineSimulation({
  id: 'rc-circuit',
  title: 'RC circuit',
  topic: 'Electromagnetism',
  levels: ['G12', 'Y1'],
  description: 'Watch capacitor charge and current during an ideal RC transient.',
  scene: 'circuit',
  params: [
    parameter('resistance', 'Resistance', 'R', 'kΩ', 0.1, 100, 0.1, 10),
    parameter('capacitance', 'Capacitance', 'C', 'μF', 0.1, 1000, 0.1, 100),
    parameter('voltage', 'Supply voltage', 'V₀', 'V', 0, 24, 0.1, 5),
  ],
  domain: (p) => timeDomain(5 * p.resistance * 1e3 * p.capacitance * 1e-6),
  equation: String.raw`q(t)=CV_0\left(1-e^{-t/RC}\right),\qquad i(t)=\frac{V_0}{R}e^{-t/RC}`,
  vectors: [{ key: 'current', label: 'Current', color: '#22D3EE' }],
  predictionPrompts: [{ question: 'What is the capacitor current after many time constants?', options: ['It approaches zero', 'It stays at V₀/R', 'It grows without bound'], answer: 0, explanation: 'The capacitor approaches the supply voltage, so the charging current decays toward zero.' }],
  depthLevels,
  presets: [{ id: 'fast-charge', label: 'Fast charge', description: 'Lower resistance and capacitance shorten the time constant.', values: { resistance: 1, capacitance: 10 } }],
  challenge: { title: 'Raise the supply', description: 'Set the supply voltage to at least 10 V.', complete: (p) => p.voltage >= 10 },
  assumptions: 'Ideal voltage source and capacitor, zero initial capacitor voltage, and no parasitic resistance or leakage.',
  whatToNotice: 'The time constant τ=RC sets how quickly voltage approaches its final value.',
  sample: (t, p) => {
    const resistance = p.resistance * 1e3
    const capacitance = p.capacitance * 1e-6
    const tau = resistance * capacitance
    const voltage = p.voltage * (1 - Math.exp(-t / tau))
    const current = (p.voltage / resistance) * Math.exp(-t / tau)
    const charge = capacitance * voltage
    return sample(
      voltage, [t, voltage, 0], 'Capacitor voltage', `${numberForMath(voltage)} V`,
      rcCircuit.equation,
      String.raw`\tau=RC=${numberForMath(tau)}\ \mathrm{s},\quad V_C=V_0(1-e^{-t/\tau})`,
      [{ label: 'Time constant', value: numberForMath(tau), unit: 's' }, { label: 'Capacitor charge', value: numberForMath(charge), unit: 'C' }, { label: 'Circuit current', value: numberForMath(current), unit: 'A' }],
      [vector('current', 'Current', '#22D3EE', [current * 1e3, 0, 0], [t, voltage, 0])],
    )
  },
})

export const electromagnetismSimulations: readonly SimulationDefinition[] = [
  electricField,
  faraday,
  biotSavart,
  gaussLaw,
  rcCircuit,
]
