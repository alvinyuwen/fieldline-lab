import { Canvas } from '@react-three/fiber'
import { Grid, Line, OrbitControls, Text } from '@react-three/drei'
import { useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import {
  electricFieldAt,
  electricForce,
  sampleElectricTrajectory,
  traceElectricFieldLines,
  type ElectricParticleSettings,
  type ElectricParticleState,
  type PointCharge,
} from '../../sims/labs/electric-field-physics'
import { LabLayout, LabRange, LabToggle, type LearningMode } from './LabLayout'
import { useLabPlayback } from './useLabPlayback'

const duration = 5
const initialCharges: readonly PointCharge[] = [
  { id: 'q1', x: -0.75, y: 0.15, chargeMicroC: 1 },
  { id: 'q2', x: 0.75, y: 0.15, chargeMicroC: -1 },
]
const modes = [
  { label: 'Point charges', value: 'charges' },
  { label: 'Parallel plates', value: 'plates' },
]

export default function ElectricFieldsLab() {
  const [configuration, setConfiguration] = useState<'charges' | 'plates'>('charges')
  const [charges, setCharges] = useState<readonly PointCharge[]>(initialCharges)
  const [selectedId, setSelectedId] = useState('q1')
  const [plateVoltage, setPlateVoltage] = useState(1000)
  const [plateGap, setPlateGap] = useState(1.4)
  const [particleChargeNanoC, setParticleChargeNanoC] = useState(1)
  const [particleMassMg, setParticleMassMg] = useState(1)
  const [initial, setInitial] = useState<ElectricParticleState>({ x: -0.1, y: -1.35, vx: 0.45, vy: 0.1 })
  const [fieldLinesOn, setFieldLinesOn] = useState(true)
  const [forceOn, setForceOn] = useState(true)
  const [velocityOn, setVelocityOn] = useState(true)
  const [trajectoryOn, setTrajectoryOn] = useState(true)
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const [mode, setMode] = useState<LearningMode>('Explore')
  const [answer, setAnswer] = useState<number | null>(null)
  const nextId = useRef(3)
  const clock = useLabPlayback(duration)
  const selectedCharge = charges.find((charge) => charge.id === selectedId)
  const settings: ElectricParticleSettings = useMemo(() => ({
    mode: configuration,
    charges,
    plateVoltage,
    plateGap,
    particleChargeNanoC,
    particleMassMg,
  }), [charges, configuration, particleChargeNanoC, particleMassMg, plateGap, plateVoltage])
  const trajectory = useMemo(() => sampleElectricTrajectory(initial, settings, duration), [initial, settings])
  const sampleIndex = Math.min(trajectory.length - 1, Math.floor(clock.time * 120))
  const particle = trajectory[sampleIndex] ?? initial
  const field = electricFieldAt(particle, settings)
  const force = electricForce(particleChargeNanoC, field)
  const fieldMagnitude = Math.hypot(field.x, field.y)
  const forceMagnitude = Math.hypot(force.x, force.y)
  const speed = Math.hypot(particle.vx, particle.vy)
  const kineticEnergy = 0.5 * (particleMassMg * 1e-6) * speed ** 2
  const equation = configuration === 'plates'
    ? String.raw`\vec{E}=\frac{\Delta V}{d}\hat{x},\qquad \vec{F}=q\vec{E}=m\vec{a}`
    : String.raw`\vec{E}=\sum_i\frac{kq_i(\vec{r}-\vec{r}_i)}{|\vec{r}-\vec{r}_i|^3},\qquad \vec{F}=q\vec{E}=m\vec{a}`
  const measurements = [
    { label: 'Electric field', value: formatSI(fieldMagnitude), unit: 'N/C' },
    { label: 'Force on test particle', value: formatSI(forceMagnitude), unit: 'N' },
    { label: 'Particle speed', value: formatSI(speed), unit: 'm/s' },
    { label: 'Kinetic energy', value: formatSI(kineticEnergy), unit: 'J' },
  ]

  const updateCharge = (id: string, key: 'x' | 'y' | 'chargeMicroC', value: number) => {
    setCharges((current) => current.map((charge) => charge.id === id ? { ...charge, [key]: value } : charge))
  }
  const addCharge = () => {
    const id = `q${nextId.current++}`
    setCharges((current) => [...current, { id, x: 0, y: 0.8, chargeMicroC: 1 }])
    setSelectedId(id)
  }
  const removeCharge = (id: string) => {
    setCharges((current) => current.filter((charge) => charge.id !== id))
    if (selectedId === id) setSelectedId(charges.find((charge) => charge.id !== id)?.id ?? '')
  }
  const reset = () => {
    clock.reset()
    setConfiguration('charges')
    setCharges(initialCharges)
    setSelectedId('q1')
    setPlateVoltage(1000)
    setPlateGap(1.4)
    setParticleChargeNanoC(1)
    setParticleMassMg(1)
    setInitial({ x: -0.1, y: -1.35, vx: 0.45, vy: 0.1 })
    setAnswer(null)
  }

  return (
    <LabLayout
      id="electric-fields-lab"
      category="Electric fields"
      title="Electric fields and charges"
      description="Arrange charges or plates, then release a test particle to see how electric fields guide its motion."
      controls={
        <>
          <div className="lab-control-group">
            <h2>Field source</h2>
            <div className="lab-button-row">
              {modes.map((item) => <button key={item.value} type="button" className={`lab-button ${configuration === item.value ? 'is-selected' : ''}`} onClick={() => setConfiguration(item.value as 'charges' | 'plates')}>{item.label}</button>)}
            </div>
            {configuration === 'charges' ? (
              <>
                <div className="lab-button-row" aria-label="Select charge to edit">
                  {charges.map((charge) => <button type="button" key={charge.id} className={`lab-button ${selectedId === charge.id ? 'is-selected' : ''}`} onClick={() => setSelectedId(charge.id)}>{charge.id} {charge.chargeMicroC >= 0 ? '+' : '−'}</button>)}
                  <button type="button" className="lab-button" onClick={addCharge} disabled={charges.length >= 6}>Add charge</button>
                </div>
                {selectedCharge && (
                  <div className="lab-charge-row">
                    <div className="lab-charge-row__header">
                      <strong>Edit {selectedCharge.id}</strong>
                      <button type="button" onClick={() => removeCharge(selectedCharge.id)} disabled={charges.length < 2}>Remove</button>
                    </div>
                    <LabRange label="Charge magnitude and sign" value={selectedCharge.chargeMicroC} min={-5} max={5} step={0.1} unit="μC" onChange={(value) => updateCharge(selectedCharge.id, 'chargeMicroC', value)} />
                    <LabRange label="Charge position x" value={selectedCharge.x} min={-2.5} max={2.5} step={0.05} unit="m" onChange={(value) => updateCharge(selectedCharge.id, 'x', value)} />
                    <LabRange label="Charge position y" value={selectedCharge.y} min={-1.8} max={1.8} step={0.05} unit="m" onChange={(value) => updateCharge(selectedCharge.id, 'y', value)} />
                  </div>
                )}
              </>
            ) : (
              <>
                <LabRange label="Plate voltage" value={plateVoltage} min={0} max={2000} step={10} unit="V" onChange={setPlateVoltage} />
                <LabRange label="Plate separation" value={plateGap} min={0.6} max={2.2} step={0.05} unit="m" onChange={setPlateGap} />
              </>
            )}
          </div>
          <div className="lab-control-group">
            <h2>Test particle</h2>
            <LabRange label="Particle charge" value={particleChargeNanoC} min={-10} max={10} step={0.1} unit="nC" onChange={setParticleChargeNanoC} />
            <LabRange label="Particle mass" value={particleMassMg} min={0.1} max={10} step={0.1} unit="mg" onChange={setParticleMassMg} />
            <LabRange label="Initial x position" value={initial.x} min={-2.5} max={2.5} step={0.05} unit="m" onChange={(x) => setInitial((previous) => ({ ...previous, x }))} />
            <LabRange label="Initial y position" value={initial.y} min={-1.8} max={1.8} step={0.05} unit="m" onChange={(y) => setInitial((previous) => ({ ...previous, y }))} />
            <LabRange label="Initial horizontal velocity" value={initial.vx} min={-3} max={3} step={0.05} unit="m/s" onChange={(vx) => setInitial((previous) => ({ ...previous, vx }))} />
            <LabRange label="Initial vertical velocity" value={initial.vy} min={-3} max={3} step={0.05} unit="m/s" onChange={(vy) => setInitial((previous) => ({ ...previous, vy }))} />
          </div>
        </>
      }
      sceneControls={
        <>
          <LabToggle label="Field lines" pressed={fieldLinesOn} onClick={() => setFieldLinesOn(!fieldLinesOn)} />
          <LabToggle label="Force vector" pressed={forceOn} onClick={() => setForceOn(!forceOn)} />
          <LabToggle label="Velocity vector" pressed={velocityOn} onClick={() => setVelocityOn(!velocityOn)} />
          <LabToggle label="Trajectory" pressed={trajectoryOn} onClick={() => setTrajectoryOn(!trajectoryOn)} />
        </>
      }
      scene={
        <Canvas role="img" aria-label="Interactive electric field laboratory. Drag source charges to reposition them." camera={{ position: [0, 0, 8], fov: 42, near: 0.1, far: 100 }} dpr={[1, 1.5]} gl={{ antialias: true, alpha: true }}>
          <color attach="background" args={['#080E19']} />
          <ambientLight intensity={0.8} />
          <directionalLight position={[3, 5, 6]} intensity={1.2} />
          <ElectricScene
            configuration={configuration}
            charges={charges}
            plateGap={plateGap}
            particle={particle}
            trajectory={trajectory}
            sampleIndex={sampleIndex}
            draggingId={draggingId}
            onSelect={setSelectedId}
            onDragStart={setDraggingId}
            onDragEnd={() => setDraggingId(null)}
            onMove={updateCharge}
            showFieldLines={fieldLinesOn}
            showForce={forceOn}
            showVelocity={velocityOn}
            showTrajectory={trajectoryOn}
            force={force}
          />
        </Canvas>
      }
      equation={equation}
      equationLabel={configuration === 'plates' ? 'Uniform electric field and force equations' : 'Coulomb superposition and force equations'}
      measurements={measurements}
      mode={mode}
      onModeChange={setMode}
      learningContent={(
        <LearningContent mode={mode} answer={answer} setAnswer={setAnswer} configuration={configuration} />
      )}
      assumptions={configuration === 'plates'
        ? 'The plates are ideal parallel conductors with a uniform field between their inner faces. Edge fringing and plate charge redistribution are omitted. The particle is treated as a point mass and charge.'
        : 'Point charges are fixed sources in a two-dimensional view. The field is Coulomb-superposed in vacuum; charge singularities are excluded from particle integration. The particle is a point charge and does not alter the source field.'}
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

function ElectricScene({ configuration, charges, plateGap, particle, trajectory, sampleIndex, draggingId, onSelect, onDragStart, onDragEnd, onMove, showFieldLines, showForce, showVelocity, showTrajectory, force }: {
  configuration: 'charges' | 'plates'
  charges: readonly PointCharge[]
  plateGap: number
  particle: ElectricParticleState
  trajectory: readonly ElectricParticleState[]
  sampleIndex: number
  draggingId: string | null
  onSelect: (id: string) => void
  onDragStart: (id: string) => void
  onDragEnd: () => void
  onMove: (id: string, key: 'x' | 'y', value: number) => void
  showFieldLines: boolean
  showForce: boolean
  showVelocity: boolean
  showTrajectory: boolean
  force: { x: number; y: number }
}) {
  const fieldLines = useMemo(() => traceElectricFieldLines(charges), [charges])
  const path = useMemo(() => trajectory.slice(0, sampleIndex + 1).map((state) => [state.x, state.y, 0.02] as [number, number, number]), [sampleIndex, trajectory])
  return (
    <>
      <Grid args={[9, 6]} position={[0, 0, -0.24]} rotation={[Math.PI / 2, 0, 0]} cellSize={0.5} cellColor="#26384c" sectionSize={2} sectionColor="#41566e" fadeDistance={12} infiniteGrid={false} />
      {configuration === 'charges' ? (
        <>
          {showFieldLines && fieldLines.map((points, index) => {
            const linePoints = points.map((point) => [point.x, point.y, -0.08] as [number, number, number])
            const middle = Math.floor(linePoints.length * 0.58)
            const before = linePoints[Math.max(0, middle - 1)]
            const after = linePoints[Math.min(linePoints.length - 1, middle + 1)]
            return <group key={`field-${index}`}><Line points={linePoints} color="#FBBF24" transparent opacity={0.55} lineWidth={1.1} /><FieldArrow position={linePoints[middle]} direction={[after[0] - before[0], after[1] - before[1], 0]} /></group>
          })}
          {charges.map((charge) => (
            <ChargeMarker key={charge.id} charge={charge} onSelect={onSelect} onDragStart={onDragStart} onDragEnd={onDragEnd} />
          ))}
          {draggingId && (
            <mesh
              position={[0, 0, -0.2]}
              onPointerMove={(event) => {
                onMove(draggingId, 'x', clamp(event.point.x, -2.5, 2.5))
                onMove(draggingId, 'y', clamp(event.point.y, -1.8, 1.8))
              }}
              onPointerUp={onDragEnd}
            >
              <planeGeometry args={[9, 6]} />
              <meshBasicMaterial transparent opacity={0} depthWrite={false} />
            </mesh>
          )}
        </>
      ) : (
        <>
          <mesh position={[-plateGap / 2, 0, 0]}>
            <boxGeometry args={[0.12, 3.2, 0.28]} />
            <meshStandardMaterial color="#D9E2EC" metalness={0.78} roughness={0.27} />
          </mesh>
          <mesh position={[plateGap / 2, 0, 0]}>
            <boxGeometry args={[0.12, 3.2, 0.28]} />
            <meshStandardMaterial color="#D9E2EC" metalness={0.78} roughness={0.27} />
          </mesh>
          <Text position={[-plateGap / 2, 1.85, 0]} fontSize={0.25} color="#FF6B6B" anchorX="center">+</Text>
          <Text position={[plateGap / 2, 1.85, 0]} fontSize={0.25} color="#60A5FA" anchorX="center">−</Text>
          {showFieldLines && Array.from({ length: 9 }, (_, index) => {
            const y = -1.35 + index * 0.34
            return <group key={`plate-field-${index}`}><Line points={[[-plateGap / 2 + 0.1, y, -0.07], [plateGap / 2 - 0.1, y, -0.07]]} color="#FBBF24" transparent opacity={0.55} lineWidth={1.2} /><FieldArrow position={[0, y, -0.06]} direction={[1, 0, 0]} /></group>
          })}
        </>
      )}
      {showTrajectory && path.length > 1 && <Line points={path} color="#22D3EE" transparent opacity={0.75} lineWidth={2} />}
      <mesh position={[particle.x, particle.y, 0.15]}>
        <sphereGeometry args={[0.105, 24, 24]} />
        <meshStandardMaterial color="#E6EDF7" emissive="#22D3EE" emissiveIntensity={1.4} roughness={0.25} />
      </mesh>
      <Text position={[particle.x + 0.16, particle.y + 0.18, 0.18]} fontSize={0.12} color="#E6EDF7" anchorX="left">test particle</Text>
      {showForce && <VectorOverlay origin={[particle.x, particle.y, 0.2]} vector={[force.x, force.y, 0]} color="#FF6B6B" label="F" />}
      {showVelocity && <VectorOverlay origin={[particle.x, particle.y, 0.22]} vector={[particle.vx, particle.vy, 0]} color="#22D3EE" label="v" />}
      <OrbitControls makeDefault enabled={!draggingId} enableDamping dampingFactor={0.08} />
    </>
  )
}

function ChargeMarker({ charge, onSelect, onDragStart, onDragEnd }: {
  charge: PointCharge
  onSelect: (id: string) => void
  onDragStart: (id: string) => void
  onDragEnd: () => void
}) {
  const color = charge.chargeMicroC >= 0 ? '#FB7185' : '#60A5FA'
  return (
    <group position={[charge.x, charge.y, 0]}>
      <mesh
        onPointerDown={(event) => { event.stopPropagation(); onSelect(charge.id); onDragStart(charge.id) }}
        onPointerUp={(event) => { event.stopPropagation(); onDragEnd() }}
      >
        <sphereGeometry args={[0.17, 28, 28]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.18} metalness={0.32} roughness={0.3} />
      </mesh>
      <Text position={[0, 0, 0.19]} fontSize={0.18} color="#FFFFFF" anchorX="center" anchorY="middle" depthOffset={-2}>{charge.chargeMicroC >= 0 ? '+' : '−'}</Text>
      <Text position={[0, -0.28, 0.18]} fontSize={0.1} color="#CAD5E3" anchorX="center">{formatSI(charge.chargeMicroC)} μC</Text>
    </group>
  )
}

function FieldArrow({ position, direction }: { position: [number, number, number]; direction: [number, number, number] }) {
  const rotation = useMemo(() => {
    const vector = new THREE.Vector3(...direction).normalize()
    return new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), vector)
  }, [direction])
  return <mesh position={position} quaternion={rotation}><coneGeometry args={[0.055, 0.13, 8]} /><meshBasicMaterial color="#FBBF24" /></mesh>
}

function VectorOverlay({ origin, vector, color, label }: {
  origin: [number, number, number]
  vector: [number, number, number]
  color: string
  label: string
}) {
  const magnitude = Math.hypot(...vector)
  if (magnitude < 1e-14) return null
  const end = [origin[0] + (vector[0] / magnitude) * 0.62, origin[1] + (vector[1] / magnitude) * 0.62, origin[2]] as [number, number, number]
  const left = [end[0] - (vector[0] / magnitude) * 0.14 - (vector[1] / magnitude) * 0.06, end[1] - (vector[1] / magnitude) * 0.14 + (vector[0] / magnitude) * 0.06, end[2]] as [number, number, number]
  const right = [end[0] - (vector[0] / magnitude) * 0.14 + (vector[1] / magnitude) * 0.06, end[1] - (vector[1] / magnitude) * 0.14 - (vector[0] / magnitude) * 0.06, end[2]] as [number, number, number]
  return <group><Line points={[origin, end]} color={color} lineWidth={2} /><Line points={[end, left]} color={color} lineWidth={2} /><Line points={[end, right]} color={color} lineWidth={2} /><Text position={[end[0] + 0.08, end[1] + 0.08, end[2]]} fontSize={0.13} color={color}>{label}</Text></group>
}

function LearningContent({ mode, answer, setAnswer, configuration }: {
  mode: LearningMode
  answer: number | null
  setAnswer: (answer: number) => void
  configuration: 'charges' | 'plates'
}) {
  if (mode === 'Explore') {
    return <><span className="lab-section-label">Explore</span><h2>Move the sources</h2><p>Drag a charge in the scene or adjust its position. The field lines, test particle, and measurements update from the same charge configuration.</p></>
  }
  if (mode === 'Learn') {
    return <><span className="lab-section-label">Learn</span><h2>{configuration === 'plates' ? 'A uniform field' : 'Fields add as vectors'}</h2><p>{configuration === 'plates' ? 'Between ideal plates, the field points from positive to negative and has magnitude ΔV/d. Edge effects are omitted.' : 'At each location, add the electric-field contributions from every source charge. Positive sources point outward; negative sources point inward.'}</p><p>The force reverses when the test-particle charge changes sign. Its acceleration follows F = ma.</p></>
  }
  const options = ['The field becomes one quarter as strong', 'The field becomes half as strong', 'The field doubles']
  return (
    <>
      <span className="lab-section-label">Challenge</span>
      <h2>Predict the distance effect</h2>
      <p>For a single point source, what happens to field magnitude when you double the distance?</p>
      <div className="lab-info-choice">
        {options.map((option, index) => <button type="button" key={option} className={answer === index ? (index === 0 ? 'is-correct' : 'is-wrong') : ''} onClick={() => setAnswer(index)}>{option}</button>)}
      </div>
      {answer !== null && <p role="status">{answer === 0 ? 'Correct. Coulomb field magnitude scales as 1/r².' : 'Not quite. The inverse-square dependence means doubling r divides the field by four.'}</p>}
    </>
  )
}

function formatSI(value: number): string {
  if (!Number.isFinite(value)) return 'undefined'
  if (value === 0) return '0'
  const magnitude = Math.abs(value)
  if (magnitude >= 0.01 && magnitude < 1000) return Number(value.toPrecision(3)).toString()
  return value.toExponential(2)
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}
