import { Canvas } from '@react-three/fiber'
import { Grid, Line, OrbitControls, Text } from '@react-three/drei'
import { useMemo, useState } from 'react'
import * as THREE from 'three'
import {
  cyclotronElectricFieldDirection,
  cyclotronPeriod,
  cyclotronStateAt,
  sampleCyclotronTrajectory,
  type CyclotronSettings,
} from '../../sims/labs/cyclotron-physics'
import { LabLayout, LabRange, LabToggle, type LearningMode } from './LabLayout'
import { useLabPlayback } from './useLabPlayback'

const initialSettings: CyclotronSettings = {
  chargeE: 1,
  massAmu: 1,
  magneticFieldT: 1.2,
  acceleratingVoltageV: 5000,
  initialEnergyEv: 5000,
}
const worldScale = 35

export default function CyclotronLab() {
  const [settings, setSettings] = useState(initialSettings)
  const [trajectoryOn, setTrajectoryOn] = useState(true)
  const [fieldIndicatorsOn, setFieldIndicatorsOn] = useState(true)
  const [gapFieldOn, setGapFieldOn] = useState(true)
  const [velocityOn, setVelocityOn] = useState(true)
  const [magneticForceOn, setMagneticForceOn] = useState(true)
  const [mode, setMode] = useState<LearningMode>('Explore')
  const [answer, setAnswer] = useState<number | null>(null)
  const period = cyclotronPeriod(settings)
  const halfPeriod = Number.isFinite(period) ? period / 2 : 5e-8
  const duration = halfPeriod * 10
  const clock = useLabPlayback(duration, duration / 300, halfPeriod)
  const current = cyclotronStateAt(clock.time, settings)
  const trajectory = useMemo(() => sampleCyclotronTrajectory(settings, clock.time), [clock.time, settings])
  const frequency = Number.isFinite(period) ? 1 / period : 0
  const reset = () => {
    setSettings(initialSettings)
    setTrajectoryOn(true)
    setFieldIndicatorsOn(true)
    setGapFieldOn(true)
    setVelocityOn(true)
    setMagneticForceOn(true)
    setAnswer(null)
    clock.reset()
  }
  const update = (key: keyof CyclotronSettings, value: number) => setSettings((previous) => ({ ...previous, [key]: value }))

  return (
    <LabLayout
      id="cyclotron-lab"
      category="Particle acceleration"
      title="Cyclotron particle accelerator"
      description="Inspect a synchronized accelerating gap, then follow how each crossing increases particle energy and orbit radius."
      controls={
        <>
          <div className="lab-control-group">
            <h2>Accelerator</h2>
            <LabRange label="Accelerating voltage" value={settings.acceleratingVoltageV} min={0} max={10000} step={100} unit="V" onChange={(value) => update('acceleratingVoltageV', value)} />
            <LabRange label="Magnetic field" value={settings.magneticFieldT} min={0} max={2} step={0.02} unit="T" onChange={(value) => update('magneticFieldT', value)} />
          </div>
          <div className="lab-control-group">
            <h2>Particle</h2>
            <LabRange label="Charge" value={settings.chargeE} min={-2} max={2} step={0.05} unit="e" onChange={(value) => update('chargeE', value)} />
            <LabRange label="Mass" value={settings.massAmu} min={0.5} max={4} step={0.05} unit="u" onChange={(value) => update('massAmu', value)} />
            <LabRange label="Initial kinetic energy" value={settings.initialEnergyEv} min={100} max={20000} step={100} unit="eV" onChange={(value) => update('initialEnergyEv', value)} />
            <p className="lab-control-note">Changing the sign of charge reverses the magnetic force and orbit curvature. Its magnitude scales with |q|.</p>
          </div>
          <div className="lab-control-group">
            <h2>RF synchronization</h2>
            <p className="lab-control-note">The voltage alternates at the non-relativistic cyclotron frequency. Adjusting charge, mass, or field retunes it automatically. If charge or field is zero, RF synchronization is disabled.</p>
            <p className="lab-control-note">f = {formatSI(frequency)} Hz</p>
          </div>
        </>
      }
      sceneControls={
        <>
          <LabToggle label="Particle path" pressed={trajectoryOn} onClick={() => setTrajectoryOn(!trajectoryOn)} />
          <LabToggle label="B indicators" pressed={fieldIndicatorsOn} onClick={() => setFieldIndicatorsOn(!fieldIndicatorsOn)} />
          <LabToggle label="Gap E field" pressed={gapFieldOn} onClick={() => setGapFieldOn(!gapFieldOn)} />
          <LabToggle label="Velocity" pressed={velocityOn} onClick={() => setVelocityOn(!velocityOn)} />
          <LabToggle label="Magnetic force Fₘ" pressed={magneticForceOn} onClick={() => setMagneticForceOn(!magneticForceOn)} />
        </>
      }
      scene={
        <Canvas role="img" aria-label="Cyclotron with two D-shaped electrodes, synchronized accelerating gap, perpendicular magnetic field, and particle orbit" camera={{ position: [4.1, 3.2, 6.5], fov: 42, near: 0.1, far: 100 }} dpr={[1, 1.5]} gl={{ antialias: true, alpha: true }}>
          <color attach="background" args={['#080E19']} />
          <ambientLight intensity={0.72} />
          <directionalLight position={[4, 5, 6]} intensity={1.3} />
          <CyclotronScene settings={settings} state={current} trajectory={trajectory} time={clock.time} trajectoryOn={trajectoryOn} fieldIndicatorsOn={fieldIndicatorsOn} gapFieldOn={gapFieldOn} velocityOn={velocityOn} magneticForceOn={magneticForceOn} />
        </Canvas>
      }
      equation={String.raw`\vec{F}_m=q\vec{v}\times\vec{B},\qquad r=\frac{mv}{|q|B},\qquad T=\frac{2\pi m}{|q|B},\qquad \Delta K_{\mathrm{cross}}\approx |q|V`}
      equationLabel="Cyclotron orbit, period, and energy gain equations"
      measurements={[
        { label: 'Velocity', value: formatSI(Math.hypot(current.vx, current.vy)), unit: 'm/s' },
        { label: 'Magnetic force Fₘ', value: formatSI(Math.hypot(...current.magneticForceN)), unit: 'N' },
        { label: 'Kinetic energy', value: formatSI(current.kineticEnergyEv), unit: 'eV' },
        { label: 'Orbit radius', value: Number.isFinite(current.radiusM) ? formatSI(current.radiusM) : 'undefined', unit: Number.isFinite(current.radiusM) ? 'm' : undefined },
        { label: 'Gap crossings', value: `${current.gapCrossings}` },
        { label: 'Energy gain per crossing', value: formatSI(Math.abs(settings.chargeE) * Math.abs(settings.acceleratingVoltageV)), unit: 'eV' },
        { label: 'Cyclotron period', value: Number.isFinite(period) ? formatSI(period * 1e9) : 'undefined', unit: Number.isFinite(period) ? 'ns' : undefined },
      ]}
      mode={mode}
      onModeChange={setMode}
      learningContent={<LearningContent mode={mode} answer={answer} setAnswer={setAnswer} settings={settings} current={current} period={period} />}
      assumptions="This is an ideal non-relativistic cyclotron. Positive magnetic-field values point into the screen (×); negative values point out (·). The RF field direction accounts for charge sign and is phased to add approximately |q|V at each gap crossing. Fringe fields, finite dee dimensions, space charge, and relativistic frequency shift are omitted. The magnetic-force arrow is length-scaled for visibility; its measured magnitude is in newtons. If charge or field is zero, synchronized RF is disabled and the particle drifts at its initial speed."
      time={clock.time}
      duration={duration}
      timeLabel={`t = ${formatSI(clock.time * 1e9)} ns`}
      playing={clock.playing}
      speed={clock.speed}
      onPlayPause={clock.playPause}
      onStep={clock.step}
      onReset={reset}
      onScrub={clock.scrub}
      onSpeedChange={clock.setSpeed}
    />
  )
}

function CyclotronScene({ settings, state, trajectory, time, trajectoryOn, fieldIndicatorsOn, gapFieldOn, velocityOn, magneticForceOn }: {
  settings: CyclotronSettings
  state: ReturnType<typeof cyclotronStateAt>
  trajectory: ReturnType<typeof sampleCyclotronTrajectory>
  time: number
  trajectoryOn: boolean
  fieldIndicatorsOn: boolean
  gapFieldOn: boolean
  velocityOn: boolean
  magneticForceOn: boolean
}) {
  const deeShapes = useMemo(() => {
    const radius = 2.35
    const gap = 0.1
    const right = new THREE.Shape()
    right.moveTo(gap, -radius)
    right.lineTo(gap, radius)
    right.absarc(0, 0, radius, Math.PI / 2, -Math.PI / 2, true)
    right.closePath()
    const left = new THREE.Shape()
    left.moveTo(-gap, radius)
    left.lineTo(-gap, -radius)
    left.absarc(0, 0, radius, -Math.PI / 2, Math.PI / 2, true)
    left.closePath()
    return { right, left }
  }, [])
  const path = trajectory.map((point) => [point.x * worldScale, point.y * worldScale, 0.15] as [number, number, number])
  const position: [number, number, number] = [state.x * worldScale, state.y * worldScale, 0.22]
  const velocityMagnitude = Math.hypot(state.vx, state.vy)
  const velocityEnd: [number, number, number] = velocityMagnitude > 0
    ? [position[0] + (state.vx / velocityMagnitude) * 0.65, position[1] + (state.vy / velocityMagnitude) * 0.65, position[2]]
    : position
  const forceMagnitude = Math.hypot(...state.magneticForceN)
  const forceArrowLength = Math.max(0.15, Math.min(0.65, (forceMagnitude / 8e-15) * 0.25))
  const forceDirection = forceMagnitude > 0
    ? new THREE.Vector3(state.magneticForceN[0] / forceMagnitude, state.magneticForceN[1] / forceMagnitude, 0)
    : new THREE.Vector3()
  const forceEnd: [number, number, number] = forceMagnitude > 0
    ? [position[0] + forceDirection.x * forceArrowLength, position[1] + forceDirection.y * forceArrowLength, position[2]]
    : position
  const forceRotation = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), forceDirection)
  const electricFieldDirection = cyclotronElectricFieldDirection(settings.chargeE, state.rfVoltageV)

  return (
    <>
      <Grid args={[8, 8]} position={[0, 0, -0.18]} cellSize={0.5} cellColor="#26384c" sectionSize={2} sectionColor="#41566e" fadeDistance={12} infiniteGrid={false} />
      {fieldIndicatorsOn && settings.magneticFieldT !== 0 && Array.from({ length: 16 }, (_, index) => {
        const x = (index % 4) * 0.72 - 1.08
        const y = Math.floor(index / 4) * 0.72 - 1.08
        return <Text key={index} position={[x, y, -0.12]} fontSize={0.19} color="#A78BFA">{settings.magneticFieldT >= 0 ? '×' : '·'}</Text>
      })}
      <mesh position={[0, 0, -0.08]}>
        <extrudeGeometry args={[deeShapes.right, { depth: 0.12, bevelEnabled: false }]} />
        <meshStandardMaterial color="#7C8998" metalness={0.7} roughness={0.34} transparent opacity={0.62} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0, 0, -0.08]}>
        <extrudeGeometry args={[deeShapes.left, { depth: 0.12, bevelEnabled: false }]} />
        <meshStandardMaterial color="#657486" metalness={0.72} roughness={0.34} transparent opacity={0.62} side={THREE.DoubleSide} />
      </mesh>
      <Text position={[1.15, 0, 0.1]} fontSize={0.3} color="#DCE6F2">D₁</Text>
      <Text position={[-1.45, 0, 0.1]} fontSize={0.3} color="#DCE6F2">D₂</Text>
      <Line points={[[0.1, -2.35, 0.1], [0.1, 2.35, 0.1]]} color="#C87948" transparent opacity={0.75} lineWidth={2} />
      <Line points={[[-0.1, -2.35, 0.1], [-0.1, 2.35, 0.1]]} color="#C87948" transparent opacity={0.75} lineWidth={2} />
      <mesh position={[0, 0, 0.12]}>
        <sphereGeometry args={[0.13, 20, 20]} />
        <meshStandardMaterial color="#FB923C" emissive="#FB923C" emissiveIntensity={0.75} />
      </mesh>
      <Text position={[0.18, 0.18, 0.16]} fontSize={0.11} color="#F6C28B" anchorX="left">source</Text>
      {gapFieldOn && Number.isFinite(cyclotronPeriod(settings)) && electricFieldDirection !== 0 && (
        <GapFieldArrows y={state.y * worldScale} direction={electricFieldDirection} />
      )}
      {trajectoryOn && path.length > 1 && <Line points={path} color="#22D3EE" transparent opacity={0.8} lineWidth={2} />}
      <mesh position={position}>
        <sphereGeometry args={[0.085, 20, 20]} />
        <meshStandardMaterial color="#F8FAFC" emissive="#22D3EE" emissiveIntensity={2.2} />
      </mesh>
      {velocityOn && velocityMagnitude > 0 && (
        <group>
          <Line points={[position, velocityEnd]} color="#22D3EE" lineWidth={2} />
          <Text position={[velocityEnd[0] + 0.08, velocityEnd[1] + 0.08, velocityEnd[2]]} fontSize={0.13} color="#22D3EE">v</Text>
        </group>
      )}
      {magneticForceOn && forceMagnitude > 0 && (
        <group>
          <Line points={[position, forceEnd]} color="#FB7185" lineWidth={2} />
          <mesh position={[position[0] + forceDirection.x * (forceArrowLength - 0.06), position[1] + forceDirection.y * (forceArrowLength - 0.06), position[2]]} quaternion={forceRotation}>
            <coneGeometry args={[0.055, 0.12, 8]} />
            <meshBasicMaterial color="#FB7185" />
          </mesh>
          <Text position={[forceEnd[0] + 0.08, forceEnd[1] + 0.08, forceEnd[2]]} fontSize={0.13} color="#FB7185">Fₘ</Text>
        </group>
      )}
      <Text position={[0, -2.7, 0.1]} fontSize={0.12} color="#8EA0B8" anchorX="center">RF phase: {formatSI((((time / (cyclotronPeriod(settings) || 1)) * 360) % 360 + 360) % 360)}°</Text>
      <OrbitControls makeDefault enableDamping dampingFactor={0.08} />
    </>
  )
}

function GapFieldArrows({ y, direction }: { y: number; direction: -1 | 1 }) {
  const ys = [y - 0.12, y, y + 0.12]
  return (
    <group>
      {ys.map((positionY, index) => {
        const startX = direction > 0 ? -0.08 : 0.08
        const endX = -startX
        const centerX = 0
        return <group key={index}>
          <Line points={[[startX, positionY, 0.24], [endX, positionY, 0.24]]} color="#FB7185" lineWidth={1.5} />
          <mesh position={[centerX + direction * 0.04, positionY, 0.25]} rotation={[0, 0, direction > 0 ? -Math.PI / 2 : Math.PI / 2]}>
            <coneGeometry args={[0.04, 0.08, 7]} />
            <meshBasicMaterial color="#FB7185" />
          </mesh>
        </group>
      })}
    </group>
  )
}

function LearningContent({ mode, answer, setAnswer, settings, current, period }: {
  mode: LearningMode
  answer: number | null
  setAnswer: (answer: number) => void
  settings: CyclotronSettings
  current: ReturnType<typeof cyclotronStateAt>
  period: number
}) {
  if (mode === 'Explore') return <><span className="lab-section-label">Explore</span><h2>Watch energy build</h2><p>Each synchronized gap crossing adds energy. The magnetic field bends the particle between crossings but does no work.</p></>
  if (mode === 'Learn') return <><span className="lab-section-label">Learn</span><h2>Two fields, two jobs</h2><p>The electric field does work in the gap, adding about |q|V per crossing. Inside each dee, Fₘ = qv × B is perpendicular to velocity, changing its direction but not its kinetic energy. Reversing charge reverses Fₘ and the orbit curvature.</p><p>The RF frequency is set to {Number.isFinite(period) ? `${formatSI(1 / period)} Hz` : 'zero'} to stay synchronized in this non-relativistic model. The force arrow is length-scaled for visibility; the measurement gives its magnitude.</p></>
  const options = ['Approximately |q|V', 'Approximately 2|q|V', 'No energy change']
  return (
    <>
      <span className="lab-section-label">Challenge</span><h2>Energy per crossing</h2><p>How much kinetic energy does the particle gain each time it crosses the accelerating gap?</p>
      <div className="lab-info-choice">{options.map((option, index) => <button type="button" key={option} className={answer === index ? (index === 0 ? 'is-correct' : 'is-wrong') : ''} onClick={() => setAnswer(index)}>{option}</button>)}</div>
      {answer !== null && <p role="status">{answer === 0 ? 'Correct. Each gap crossing adds approximately |q|V. Two crossings per full revolution add about 2|q|V.' : 'The voltage contributes approximately |q|V at each gap crossing. A full revolution has two crossings.'} Current energy is {formatSI(current.kineticEnergyEv)} eV for charge {settings.chargeE}e.</p>}
    </>
  )
}

function formatSI(value: number): string {
  if (!Number.isFinite(value)) return 'undefined'
  if (value === 0) return '0'
  if (Math.abs(value) >= 0.01 && Math.abs(value) < 1000) return Number(value.toPrecision(3)).toString()
  return value.toExponential(2)
}
