import { Canvas } from '@react-three/fiber'
import { Grid, Line, OrbitControls, Text } from '@react-three/drei'
import { useMemo, useState } from 'react'
import * as THREE from 'three'
import { longWireMagneticField, magneticFieldMagnitude } from '../../sims/labs/magnetic-wire-physics'
import { LabLayout, LabRange, LabToggle, type LearningMode } from './LabLayout'
import { useLabPlayback } from './useLabPlayback'

const duration = 6

export default function MagneticWireLab() {
  const [currentA, setCurrentA] = useState(5)
  const [probeRadius, setProbeRadius] = useState(0.65)
  const [probeAngle, setProbeAngle] = useState(30)
  const [fieldLinesOn, setFieldLinesOn] = useState(true)
  const [rightHandRuleOn, setRightHandRuleOn] = useState(true)
  const [measurementOn, setMeasurementOn] = useState(true)
  const [mode, setMode] = useState<LearningMode>('Explore')
  const [answer, setAnswer] = useState<number | null>(null)
  const clock = useLabPlayback(duration)
  const radians = (probeAngle * Math.PI) / 180
  const probe = { x: probeRadius * Math.cos(radians), y: probeRadius * Math.sin(radians) }
  const field = longWireMagneticField(currentA, probe.x, probe.y)
  const fieldMagnitude = magneticFieldMagnitude(currentA, probeRadius)
  const fieldAngle = Math.atan2(field.y, field.x)

  const reset = () => {
    setCurrentA(5)
    setProbeRadius(0.65)
    setProbeAngle(30)
    setFieldLinesOn(true)
    setRightHandRuleOn(true)
    setMeasurementOn(true)
    setAnswer(null)
    clock.reset()
  }

  return (
    <LabLayout
      id="magnetic-wire-lab"
      category="Magnetic fields"
      title="Magnetic field around a wire"
      description="Reverse the current and move a compass probe to explore the circular magnetic field around a straight conductor."
      controls={
        <>
          <div className="lab-control-group">
            <h2>Conductor</h2>
            <LabRange label="Current" value={currentA} min={-10} max={10} step={0.1} unit="A" onChange={setCurrentA} />
            <p className="lab-control-note">Positive current runs along +z. Negative current reverses the wire current and field circulation.</p>
          </div>
          <div className="lab-control-group">
            <h2>Compass probe</h2>
            <LabRange label="Distance from wire" value={probeRadius} min={0.2} max={2.5} step={0.01} unit="m" onChange={setProbeRadius} />
            <LabRange label="Probe angle" value={probeAngle} min={0} max={360} step={1} unit="°" onChange={setProbeAngle} />
          </div>
        </>
      }
      sceneControls={
        <>
          <LabToggle label="Field lines" pressed={fieldLinesOn} onClick={() => setFieldLinesOn(!fieldLinesOn)} />
          <LabToggle label="Right-hand rule" pressed={rightHandRuleOn} onClick={() => setRightHandRuleOn(!rightHandRuleOn)} />
          <LabToggle label="Probe indicator" pressed={measurementOn} onClick={() => setMeasurementOn(!measurementOn)} />
        </>
      }
      scene={
        <Canvas role="img" aria-label="Three-dimensional current-carrying conductor with circular magnetic field lines and a compass probe" camera={{ position: [4.5, 4.5, 6], fov: 42, near: 0.1, far: 100 }} dpr={[1, 1.5]} gl={{ antialias: true, alpha: true }}>
          <color attach="background" args={['#080E19']} />
          <ambientLight intensity={0.75} />
          <directionalLight position={[4, 5, 5]} intensity={1.2} />
          <MagneticWireScene currentA={currentA} probe={probe} fieldAngle={fieldAngle} time={clock.time} fieldLinesOn={fieldLinesOn} rightHandRuleOn={rightHandRuleOn} measurementOn={measurementOn} />
        </Canvas>
      }
      equation={String.raw`B(r)=\frac{\mu_0 I}{2\pi r},\qquad \vec{B}\ \text{circulates by the right-hand rule}`}
      equationLabel="Magnetic field around a long straight wire"
      measurements={[
        { label: 'Current direction', value: currentA >= 0 ? '+z' : '−z' },
        { label: 'Probe distance', value: formatSI(probeRadius), unit: 'm' },
        { label: 'Field at probe', value: formatSI(fieldMagnitude), unit: 'T' },
        { label: 'Field angle', value: `${Math.round((fieldAngle * 180) / Math.PI)}°` },
      ]}
      mode={mode}
      onModeChange={setMode}
      learningContent={<LearningContent mode={mode} answer={answer} setAnswer={setAnswer} currentA={currentA} />}
      assumptions="The conductor is modeled as an infinitely long, thin wire in vacuum. The ideal field is undefined on the wire axis. End effects, conductor thickness, and nearby magnetic materials are omitted."
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

function MagneticWireScene({ currentA, probe, fieldAngle, time, fieldLinesOn, rightHandRuleOn, measurementOn }: {
  currentA: number
  probe: { x: number; y: number }
  fieldAngle: number
  time: number
  fieldLinesOn: boolean
  rightHandRuleOn: boolean
  measurementOn: boolean
}) {
  const rings = useMemo(() => Array.from({ length: 7 }, (_, index) => 0.38 + index * 0.31), [])
  const currentDirection = Math.sign(currentA)
  const currentDots = Array.from({ length: 7 }, (_, index) => {
    const raw = time * 0.9 * currentDirection + index * 0.62 + 2.4
    return ((raw % 4.8) + 4.8) % 4.8 - 2.4
  })
  return (
    <>
      <Grid args={[8, 8]} position={[0, 0, -0.02]} cellSize={0.5} cellColor="#26384c" sectionSize={2} sectionColor="#41566e" fadeDistance={12} infiniteGrid={false} />
      {fieldLinesOn && rings.map((radius) => (
        <group key={radius}>
          <mesh><torusGeometry args={[radius, 0.006, 7, 100]} /><meshBasicMaterial color="#A78BFA" transparent opacity={0.22 + Math.min(Math.abs(currentA) / 25, 0.5)} /></mesh>
          {currentA !== 0 && <MagneticArrow radius={radius} currentDirection={currentDirection} />}
        </group>
      ))}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
        <cylinderGeometry args={[0.105, 0.105, 5, 32]} />
        <meshStandardMaterial color="#BA6B3D" metalness={0.78} roughness={0.25} />
      </mesh>
      {currentA !== 0 && currentDots.map((z, index) => (
        <mesh key={index} position={[0, 0, z]}>
          <sphereGeometry args={[0.055, 14, 14]} />
          <meshStandardMaterial color="#FBBF24" emissive="#FBBF24" emissiveIntensity={1.4} />
        </mesh>
      ))}
      <Text position={[0.22, 0.14, 2.45]} fontSize={0.16} color={currentA >= 0 ? '#22D3EE' : '#FB7185'} anchorX="left">I {currentA >= 0 ? '↑' : '↓'}</Text>
      {measurementOn && <Line points={[[0, 0, 0.18], [probe.x, probe.y, 0.18]]} color="#8EA0B8" transparent opacity={0.65} lineWidth={1} />}
      <mesh position={[probe.x, probe.y, 0.15]}>
        <cylinderGeometry args={[0.18, 0.18, 0.07, 32]} />
        <meshStandardMaterial color="#56677E" metalness={0.55} roughness={0.3} />
      </mesh>
      <group position={[probe.x, probe.y, 0.22]} rotation={[0, 0, fieldAngle]}>
        <mesh position={[0.13, 0, 0]}>
          <boxGeometry args={[0.24, 0.035, 0.035]} />
          <meshStandardMaterial color="#FB7185" metalness={0.45} roughness={0.28} />
        </mesh>
        <mesh position={[-0.13, 0, 0]}>
          <boxGeometry args={[0.24, 0.035, 0.035]} />
          <meshStandardMaterial color="#60A5FA" metalness={0.45} roughness={0.28} />
        </mesh>
        <Text position={[0.21, 0.09, 0.02]} fontSize={0.1} color="#FB7185">N</Text>
        <Text position={[-0.21, 0.09, 0.02]} fontSize={0.1} color="#60A5FA">S</Text>
      </group>
      <Text position={[probe.x + 0.25, probe.y + 0.24, 0.16]} fontSize={0.1} color="#CBD5E1" anchorX="left">compass probe</Text>
      {rightHandRuleOn && (
        <group>
          <Line points={currentA >= 0 ? [[0, 0, -0.5], [0, 0, 0.85]] : [[0, 0, 0.85], [0, 0, -0.5]]} color="#22D3EE" lineWidth={2} />
          <Text position={[0.2, 0.2, 0.8]} fontSize={0.1} color="#22D3EE" anchorX="left">current sets field circulation</Text>
        </group>
      )}
      <OrbitControls makeDefault enableDamping dampingFactor={0.08} />
    </>
  )
}

function MagneticArrow({ radius, currentDirection }: { radius: number; currentDirection: number }) {
  const angle = 0.55
  const point: [number, number, number] = [radius * Math.cos(angle), radius * Math.sin(angle), 0.02]
  const direction = currentDirection > 0
    ? [-Math.sin(angle), Math.cos(angle), 0] as [number, number, number]
    : [Math.sin(angle), -Math.cos(angle), 0] as [number, number, number]
  const rotation = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(...direction).normalize())
  return <mesh position={point} quaternion={rotation}><coneGeometry args={[0.04, 0.1, 7]} /><meshBasicMaterial color="#A78BFA" /></mesh>
}

function LearningContent({ mode, answer, setAnswer, currentA }: {
  mode: LearningMode
  answer: number | null
  setAnswer: (answer: number) => void
  currentA: number
}) {
  if (mode === 'Explore') return <><span className="lab-section-label">Explore</span><h2>Follow the wire</h2><p>Change the current or move the compass. The needle follows the local magnetic field, which circles the conductor.</p></>
  if (mode === 'Learn') return <><span className="lab-section-label">Learn</span><h2>Current sets direction</h2><p>Point your right thumb along conventional current. Your curled fingers show the magnetic-field direction. Reversing current reverses the field.</p><p>For a long straight conductor, field magnitude falls as 1/r.</p></>
  const options = ['The field direction reverses', 'The field direction stays the same', 'The field becomes zero']
  return (
    <>
      <span className="lab-section-label">Challenge</span><h2>Reverse the current</h2><p>If current changes from +z to −z, what happens to the compass direction?</p>
      <div className="lab-info-choice">{options.map((option, index) => <button type="button" key={option} className={answer === index ? (index === 0 ? 'is-correct' : 'is-wrong') : ''} onClick={() => setAnswer(index)}>{option}</button>)}</div>
      {answer !== null && <p role="status">{answer === 0 ? 'Correct. Reversing current reverses the magnetic field and the compass needle.' : 'The field direction reverses when current reverses.'} Current is now {currentA >= 0 ? 'along +z' : 'along −z'}.</p>}
    </>
  )
}

function formatSI(value: number): string {
  if (!Number.isFinite(value)) return 'undefined'
  if (value === 0) return '0'
  if (Math.abs(value) >= 0.01 && Math.abs(value) < 1000) return Number(value.toPrecision(3)).toString()
  return value.toExponential(2)
}
