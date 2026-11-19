import { Canvas } from '@react-three/fiber'
import { Grid, Line, OrbitControls, Text } from '@react-three/drei'
import { useMemo, useState } from 'react'
import * as THREE from 'three'
import { commutatorCurrentDirection, motorSideForce, motorTorque, sampleMotorTrajectory, type MotorSettings, type MotorState } from '../../sims/labs/motor-physics'
import { LabLayout, LabRange, LabToggle, type LearningMode } from './LabLayout'
import { useLabPlayback } from './useLabPlayback'

const duration = 2
const initialSettings: MotorSettings = {
  currentA: 1.5,
  magneticFieldT: 0.3,
  turns: 20,
  coilAreaM2: 0.28,
  coilHeightM: 0.8,
  inertiaKgM2: 0.6,
}
const initialMotorState: MotorState = { angleRad: Math.PI / 2, angularVelocityRadS: 1.5 }

export default function MotorLab() {
  const [settings, setSettings] = useState(initialSettings)
  const [initialSpeed, setInitialSpeed] = useState(initialMotorState.angularVelocityRadS)
  const [forceOn, setForceOn] = useState(true)
  const [torqueOn, setTorqueOn] = useState(true)
  const [currentOn, setCurrentOn] = useState(true)
  const [fieldOn, setFieldOn] = useState(true)
  const [mode, setMode] = useState<LearningMode>('Explore')
  const [answer, setAnswer] = useState<number | null>(null)
  const trajectory = useMemo(() => sampleMotorTrajectory(settings, { angleRad: initialMotorState.angleRad, angularVelocityRadS: initialSpeed }, duration), [initialSpeed, settings])
  const clock = useLabPlayback(duration)
  const index = Math.min(trajectory.length - 1, Math.floor(clock.time * 120))
  const current = trajectory[index] ?? initialMotorState
  const torque = motorTorque(settings, current.angleRad)
  const sideForce = motorSideForce(settings, current.angleRad)
  const effectiveDirection = commutatorCurrentDirection(current.angleRad) * Math.sign(settings.currentA)
  const coilWidth = settings.coilAreaM2 / settings.coilHeightM
  const reset = () => {
    setSettings(initialSettings)
    setInitialSpeed(initialMotorState.angularVelocityRadS)
    setForceOn(true)
    setTorqueOn(true)
    setCurrentOn(true)
    setFieldOn(true)
    setAnswer(null)
    clock.reset()
  }
  const update = (key: keyof MotorSettings, value: number) => setSettings((previous) => ({ ...previous, [key]: value }))

  return (
    <LabLayout
      id="dc-motor-lab"
      category="Electromagnetic devices"
      title="DC motor and magnetic torque"
      description="Change coil current, field, turns, and area. Follow the commutator as it keeps the motor turning."
      controls={
        <>
          <div className="lab-control-group">
            <h2>Magnetic drive</h2>
            <LabRange label="Current" value={settings.currentA} min={-3} max={3} step={0.05} unit="A" onChange={(value) => update('currentA', value)} />
            <LabRange label="Magnetic field" value={settings.magneticFieldT} min={0} max={1} step={0.01} unit="T" onChange={(value) => update('magneticFieldT', value)} />
          </div>
          <div className="lab-control-group">
            <h2>Armature coil</h2>
            <LabRange label="Coil turns" value={settings.turns} min={1} max={50} step={1} onChange={(value) => update('turns', Math.round(value))} />
            <LabRange label="Coil area" value={settings.coilAreaM2} min={0.04} max={0.5} step={0.005} unit="m²" onChange={(value) => update('coilAreaM2', value)} />
            <LabRange label="Starting rotation speed" value={initialSpeed} min={0} max={10} step={0.1} unit="rad/s" onChange={setInitialSpeed} />
          </div>
        </>
      }
      sceneControls={
        <>
          <LabToggle label="Force vectors" pressed={forceOn} onClick={() => setForceOn(!forceOn)} />
          <LabToggle label="Torque" pressed={torqueOn} onClick={() => setTorqueOn(!torqueOn)} />
          <LabToggle label="Current" pressed={currentOn} onClick={() => setCurrentOn(!currentOn)} />
          <LabToggle label="Magnetic field" pressed={fieldOn} onClick={() => setFieldOn(!fieldOn)} />
        </>
      }
      scene={
        <Canvas role="img" aria-label="Interactive DC motor with north and south magnets, a rotating rectangular coil, split-ring commutator, and brushes" camera={{ position: [4.1, 3.2, 6], fov: 42, near: 0.1, far: 100 }} dpr={[1, 1.5]} gl={{ antialias: true, alpha: true }}>
          <color attach="background" args={['#080E19']} />
          <ambientLight intensity={0.75} />
          <directionalLight position={[4, 5, 6]} intensity={1.3} />
          <MotorScene settings={settings} state={current} angle={current.angleRad} coilWidth={coilWidth} torque={torque} sideForce={sideForce} effectiveDirection={effectiveDirection} forceOn={forceOn} torqueOn={torqueOn} currentOn={currentOn} fieldOn={fieldOn} />
        </Canvas>
      }
      equation={String.raw`F=BIL\sin\theta,\qquad \tau=N I A B\sin\theta,\qquad J\frac{d\omega}{dt}=\tau`}
      equationLabel="Motor magnetic force and torque equations"
      measurements={[
        { label: 'Coil angle', value: `${formatSI(angleDegrees(current.angleRad))}°` },
        { label: 'Torque', value: formatSI(torque), unit: 'N·m' },
        { label: 'Force per active side', value: formatSI(Math.abs(sideForce)), unit: 'N' },
        { label: 'Angular speed', value: formatSI(current.angularVelocityRadS), unit: 'rad/s' },
        { label: 'Commutated current', value: `${effectiveDirection >= 0 ? '+' : '−'}${formatSI(Math.abs(settings.currentA))}`, unit: 'A' },
      ]}
      mode={mode}
      onModeChange={setMode}
      learningContent={<LearningContent mode={mode} answer={answer} setAnswer={setAnswer} torque={torque} />}
      assumptions="The coil is rigid and rotates in a uniform magnetic field. Its rotational inertia is fixed at 0.6 kg·m², and losses, back EMF, inductance, brush arcing, and load torque are omitted. An ideal split-ring commutator reverses armature current every half-turn so electromagnetic torque keeps the same sign for a given current polarity."
      time={clock.time}
      duration={duration}
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

function MotorScene({ settings, state, angle, coilWidth, torque, sideForce, effectiveDirection, forceOn, torqueOn, currentOn, fieldOn }: {
  settings: MotorSettings
  state: MotorState
  angle: number
  coilWidth: number
  torque: number
  sideForce: number
  effectiveDirection: number
  forceOn: boolean
  torqueOn: boolean
  currentOn: boolean
  fieldOn: boolean
}) {
  const coilLoops = Array.from({ length: Math.min(settings.turns, 24) }, (_, index) => {
    const z = settings.turns <= 1 ? 0 : (index / (Math.min(settings.turns, 24) - 1) - 0.5) * 0.34
    const halfWidth = coilWidth / 2 + Math.abs(z) * 0.25
    const halfHeight = settings.coilHeightM / 2 + Math.abs(z) * 0.25
    return [[-halfWidth, -halfHeight, z], [halfWidth, -halfHeight, z], [halfWidth, halfHeight, z], [-halfWidth, halfHeight, z], [-halfWidth, -halfHeight, z]] as [number, number, number][]
  })
  const forceLength = Math.min(0.9, Math.max(0.25, Math.abs(sideForce) * 0.45))
  const forceSign = Math.sign(torque)
  const commutatorPath = Array.from({ length: 25 }, (_, index) => {
    const phase = (index / 24) * Math.PI
    return [0.17 * Math.cos(phase), 0, 0.17 * Math.sin(phase)] as [number, number, number]
  })

  return (
    <>
      <Grid args={[8, 8]} position={[0, -1.15, 0]} cellSize={0.5} cellColor="#26384c" sectionSize={2} sectionColor="#41566e" fadeDistance={12} infiniteGrid={false} />
      {fieldOn && Array.from({ length: 6 }, (_, index) => {
        const y = -0.65 + index * 0.26
        return <group key={index}><Line points={[[-0.93, y, -0.5], [0.93, y, -0.5]]} color="#A78BFA" transparent opacity={0.32} lineWidth={1} /><FieldArrow position={[-0.45, y, -0.49]} direction={1} /></group>
      })}
      <mesh position={[-1.28, 0, 0]}>
        <boxGeometry args={[0.42, 1.55, 1.2]} />
        <meshStandardMaterial color="#C95055" metalness={0.35} roughness={0.3} />
      </mesh>
      <mesh position={[1.28, 0, 0]}>
        <boxGeometry args={[0.42, 1.55, 1.2]} />
        <meshStandardMaterial color="#4E82B5" metalness={0.38} roughness={0.3} />
      </mesh>
      <Text position={[-1.28, 0, 0.64]} fontSize={0.38} color="#FFFFFF">N</Text>
      <Text position={[1.28, 0, 0.64]} fontSize={0.38} color="#FFFFFF">S</Text>
      <mesh rotation={[0, 0, 0]} position={[0, 0, 0]}>
        <cylinderGeometry args={[0.08, 0.08, 2.35, 20]} />
        <meshStandardMaterial color="#AEBAC8" metalness={0.86} roughness={0.22} />
      </mesh>
      <group rotation={[0, Math.PI / 2 - angle, 0]}>
        {coilLoops.map((points, index) => <Line key={index} points={points} color="#D1814F" lineWidth={3} />)}
        {currentOn && settings.currentA !== 0 && (
          <>
            <mesh position={[0, settings.coilHeightM / 2, 0]}>
              <sphereGeometry args={[0.055, 12, 12]} />
              <meshStandardMaterial color="#FBBF24" emissive="#FBBF24" emissiveIntensity={1.4} />
            </mesh>
            <Text position={[0.03, settings.coilHeightM / 2 + 0.13, 0]} fontSize={0.12} color="#FBBF24">I {effectiveDirection > 0 ? '→' : '←'}</Text>
          </>
        )}
      </group>
      <group position={[0, -0.93, 0]} rotation={[0, Math.PI / 2 - angle, 0]}>
        <Line points={commutatorPath} color={effectiveDirection >= 0 ? '#D1814F' : '#8EA0B8'} lineWidth={4} />
        <Line points={commutatorPath.map(([x, y, z]) => [-x, y, -z])} color={effectiveDirection < 0 ? '#D1814F' : '#8EA0B8'} lineWidth={4} />
        <mesh position={[0, 0, 0]}>
          <cylinderGeometry args={[0.06, 0.06, 0.3, 16]} />
          <meshStandardMaterial color="#536173" metalness={0.72} roughness={0.3} />
        </mesh>
      </group>
      <mesh position={[-0.27, -0.93, 0.22]}>
        <boxGeometry args={[0.16, 0.2, 0.2]} />
        <meshStandardMaterial color="#374151" roughness={0.85} />
      </mesh>
      <mesh position={[0.27, -0.93, -0.22]}>
        <boxGeometry args={[0.16, 0.2, 0.2]} />
        <meshStandardMaterial color="#374151" roughness={0.85} />
      </mesh>
      <Text position={[0, -1.35, 0.3]} fontSize={0.1} color="#8EA0B8" anchorX="center">split-ring commutator + brushes</Text>
      {forceOn && forceSign !== 0 && (
        <>
          <ForceArrow origin={[-coilWidth / 2, 0, 0.3]} direction={[0, 0, forceSign]} length={forceLength} />
          <ForceArrow origin={[coilWidth / 2, 0, -0.3]} direction={[0, 0, -forceSign]} length={forceLength} />
          <Text position={[-coilWidth / 2 - 0.08, 0.18, 0.45]} fontSize={0.1} color="#FF6B6B">F</Text>
          <Text position={[coilWidth / 2 + 0.08, -0.18, -0.45]} fontSize={0.1} color="#FF6B6B">F</Text>
        </>
      )}
      {torqueOn && forceSign !== 0 && <ForceArrow origin={[0, 0.75, 0]} direction={[0, forceSign, 0]} length={0.55} color="#34D399" label="τ" />}
      <Text position={[0, 1.15, 0]} fontSize={0.11} color="#8EA0B8" anchorX="center">θ = {formatSI(angleDegrees(state.angleRad))}°</Text>
      <OrbitControls makeDefault enableDamping dampingFactor={0.08} />
    </>
  )
}

function FieldArrow({ position, direction }: { position: [number, number, number]; direction: number }) {
  return <group position={position}><Line points={[[0, 0, 0], [direction * 0.28, 0, 0]]} color="#A78BFA" lineWidth={1.5} /><mesh position={[direction * 0.28, 0, 0]} rotation={[0, 0, direction > 0 ? -Math.PI / 2 : Math.PI / 2]}><coneGeometry args={[0.05, 0.1, 7]} /><meshBasicMaterial color="#A78BFA" /></mesh></group>
}

function ForceArrow({ origin, direction, length, color = '#FF6B6B', label }: {
  origin: [number, number, number]
  direction: [number, number, number]
  length: number
  color?: string
  label?: string
}) {
  const vector = new THREE.Vector3(...direction).normalize()
  const end = new THREE.Vector3(...origin).addScaledVector(vector, length)
  const rotation = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), vector)
  return <group><Line points={[origin, end.toArray() as [number, number, number]]} color={color} lineWidth={2} /><mesh position={end} quaternion={rotation}><coneGeometry args={[0.055, 0.14, 8]} /><meshBasicMaterial color={color} /></mesh>{label && <Text position={[end.x + 0.08, end.y + 0.08, end.z]} fontSize={0.13} color={color}>{label}</Text>}</group>
}

function LearningContent({ mode, answer, setAnswer, torque }: {
  mode: LearningMode
  answer: number | null
  setAnswer: (answer: number) => void
  torque: number
}) {
  if (mode === 'Explore') return <><span className="lab-section-label">Explore</span><h2>Watch torque turn the coil</h2><p>Pause at any angle. Force arrows act on opposite coil sides, producing a torque around the shaft.</p></>
  if (mode === 'Learn') return <><span className="lab-section-label">Learn</span><h2>Keep torque turning</h2><p>For a coil, τ = N I A B sinθ. The split-ring commutator reverses armature current every half-turn so the torque keeps its direction.</p><p>At the current angle, the signed torque is {formatSI(torque)} N·m.</p></>
  const options = ['Reverse armature current every half-turn', 'Keep current direction fixed', 'Remove the magnetic field each half-turn']
  return (
    <>
      <span className="lab-section-label">Challenge</span><h2>What does the commutator do?</h2><p>How does a DC motor keep rotating through a full turn?</p>
      <div className="lab-info-choice">{options.map((option, index) => <button type="button" key={option} className={answer === index ? (index === 0 ? 'is-correct' : 'is-wrong') : ''} onClick={() => setAnswer(index)}>{option}</button>)}</div>
      {answer !== null && <p role="status">{answer === 0 ? 'Correct. Reversing the coil current at each half-turn keeps the torque in the same rotational direction.' : 'The split-ring commutator reverses the coil current every half-turn.'}</p>}
    </>
  )
}

function formatSI(value: number): string {
  if (!Number.isFinite(value)) return 'undefined'
  if (value === 0) return '0'
  if (Math.abs(value) >= 0.01 && Math.abs(value) < 1000) return Number(value.toPrecision(3)).toString()
  return value.toExponential(2)
}

function angleDegrees(angleRad: number): number {
  const angle = ((angleRad % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI)
  return (angle * 180) / Math.PI
}
