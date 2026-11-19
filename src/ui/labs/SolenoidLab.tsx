import { Canvas } from '@react-three/fiber'
import { Grid, Line, OrbitControls, Text } from '@react-three/drei'
import { useMemo, useState } from 'react'
import * as THREE from 'three'
import { solenoidField } from '../../sims/labs/solenoid-physics'
import { LabLayout, LabRange, LabToggle, type LearningMode } from './LabLayout'
import { useLabPlayback } from './useLabPlayback'

const duration = 6
const coilLength = 2
const coreRelativePermeability = 200

export default function SolenoidLab() {
  const [currentA, setCurrentA] = useState(2)
  const [turns, setTurns] = useState(48)
  const [hasCore, setHasCore] = useState(false)
  const [fieldLinesOn, setFieldLinesOn] = useState(true)
  const [currentOn, setCurrentOn] = useState(true)
  const [directionOn, setDirectionOn] = useState(true)
  const [mode, setMode] = useState<LearningMode>('Explore')
  const [answer, setAnswer] = useState<number | null>(null)
  const clock = useLabPlayback(duration)
  const field = solenoidField(currentA, turns, coilLength, hasCore, coreRelativePermeability)
  const reset = () => {
    setCurrentA(2)
    setTurns(48)
    setHasCore(false)
    setFieldLinesOn(true)
    setCurrentOn(true)
    setDirectionOn(true)
    setAnswer(null)
    clock.reset()
  }

  return (
    <LabLayout
      id="solenoid-lab"
      category="Electromagnetic devices"
      title="Solenoids and electromagnets"
      description="Change coil current and turns, then compare the magnetic field with and without a soft-iron core."
      controls={
        <>
          <div className="lab-control-group">
            <h2>Coil</h2>
            <LabRange label="Current" value={currentA} min={-5} max={5} step={0.05} unit="A" onChange={setCurrentA} />
            <LabRange label="Coil turns" value={turns} min={12} max={160} step={1} onChange={(value) => setTurns(Math.round(value))} />
            <div className="lab-button-row"><button type="button" className={`lab-button ${hasCore ? 'is-selected' : ''}`} aria-pressed={hasCore} onClick={() => setHasCore(!hasCore)}>{hasCore ? 'Remove iron core' : 'Insert iron core'}</button></div>
            <p className="lab-control-note">The core uses a simplified effective relative permeability of {coreRelativePermeability}; saturation is modeled.</p>
          </div>
        </>
      }
      sceneControls={
        <>
          <LabToggle label="Field lines" pressed={fieldLinesOn} onClick={() => setFieldLinesOn(!fieldLinesOn)} />
          <LabToggle label="Current flow" pressed={currentOn} onClick={() => setCurrentOn(!currentOn)} />
          <LabToggle label="Direction labels" pressed={directionOn} onClick={() => setDirectionOn(!directionOn)} />
        </>
      }
      scene={
        <Canvas role="img" aria-label="Interactive solenoid with individual copper windings, optional iron core, current flow, and magnetic field loops" camera={{ position: [3.3, 2.8, 4.7], fov: 42, near: 0.1, far: 100 }} dpr={[1, 1.5]} gl={{ antialias: true, alpha: true }}>
          <color attach="background" args={['#080E19']} />
          <ambientLight intensity={0.75} />
          <directionalLight position={[4, 4, 5]} intensity={1.3} />
          <SolenoidScene currentA={currentA} turns={turns} time={clock.time} hasCore={hasCore} fieldLinesOn={fieldLinesOn} currentOn={currentOn} directionOn={directionOn} />
        </Canvas>
      }
      equation={String.raw`B_{\mathrm{inside}}\approx\mu_0\mu_r nI,\qquad n=\frac{N}{L}`}
      equationLabel="Ideal solenoid magnetic field"
      measurements={[
        { label: 'Inside field', value: formatSI(field.insideTesla), unit: 'T' },
        { label: 'Outside field estimate', value: formatSI(field.outsideTesla), unit: 'T' },
        { label: 'Turn density', value: formatSI(field.turnDensityPerM), unit: 'm⁻¹' },
        { label: 'North pole', value: field.northPole === 'none' ? 'none at zero current' : field.northPole },
      ]}
      mode={mode}
      onModeChange={setMode}
      learningContent={<LearningContent mode={mode} answer={answer} setAnswer={setAnswer} hasCore={hasCore} />}
      assumptions={`The coil is represented as tightly spaced circular turns of fixed length ${coilLength} m. The air-core model uses B=μ₀nI. The optional core uses an effective relative permeability ${coreRelativePermeability} and a 1.6 T saturation limit; real permeability depends on material, geometry, and magnetic history. The outside field shown is a small idealized return-field estimate.`}
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

function SolenoidScene({ currentA, turns, time, hasCore, fieldLinesOn, currentOn, directionOn }: {
  currentA: number
  turns: number
  time: number
  hasCore: boolean
  fieldLinesOn: boolean
  currentOn: boolean
  directionOn: boolean
}) {
  const windingPositions = useMemo(() => Array.from({ length: turns }, (_, index) => -1 + (2 * index) / Math.max(1, turns - 1)), [turns])
  const fieldPaths = useMemo(() => {
    return Array.from({ length: 5 }, (_, index) => {
      const z = -0.26 + index * 0.13
      const y = -0.18 + index * 0.09
      const points: [number, number, number][] = []
      for (let point = 0; point <= 24; point += 1) points.push([-1.12 + (2.24 * point) / 24, y, z])
      for (let point = 1; point <= 12; point += 1) {
        const angle = (Math.PI * point) / 12
        points.push([1.12 + 0.22 * Math.sin(angle), y + 0.38 * (1 - Math.cos(angle)), z])
      }
      for (let point = 1; point <= 24; point += 1) points.push([1.12 - (2.24 * point) / 24, y + 0.76, z])
      for (let point = 1; point <= 12; point += 1) {
        const angle = (Math.PI * point) / 12
        points.push([-1.12 - 0.22 * Math.sin(angle), y + 0.38 * (1 + Math.cos(angle)), z])
      }
      return points
    })
  }, [])
  const currentDots = Array.from({ length: 9 }, (_, index) => {
    const winding = Math.round((index / 8) * (turns - 1))
    const x = turns <= 1 ? 0 : -1 + (2 * winding) / (turns - 1)
    const angle = time * (currentA < 0 ? -1 : 1) * 2.1 + index * 0.72
    return { x, y: 0.59 * Math.cos(angle), z: 0.59 * Math.sin(angle) }
  })
  const north = currentA >= 0 ? 1 : -1

  return (
    <>
      <Grid args={[8, 8]} position={[0, -0.85, 0]} cellSize={0.5} cellColor="#26384c" sectionSize={2} sectionColor="#41566e" fadeDistance={12} infiniteGrid={false} />
      {hasCore && (
        <mesh rotation={[0, 0, -Math.PI / 2]}>
          <cylinderGeometry args={[0.19, 0.19, 2.35, 40]} />
          <meshStandardMaterial color="#68788B" metalness={0.82} roughness={0.28} />
        </mesh>
      )}
      {windingPositions.map((x) => (
        <mesh key={x} position={[x, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
          <torusGeometry args={[0.62, 0.025, 8, 24]} />
          <meshStandardMaterial color="#C87948" metalness={0.76} roughness={0.23} />
        </mesh>
      ))}
      {fieldLinesOn && fieldPaths.map((points, index) => (
        <group key={index}>
          <Line points={points} color="#A78BFA" transparent opacity={0.52} lineWidth={1.4} />
          {currentA !== 0 && <AxisArrow points={points} reverse={currentA < 0} />}
        </group>
      ))}
      {currentOn && currentA !== 0 && currentDots.map((dot, index) => (
        <mesh key={index} position={[dot.x, dot.y, dot.z]}>
          <sphereGeometry args={[0.045, 12, 12]} />
          <meshStandardMaterial color="#FBBF24" emissive="#FBBF24" emissiveIntensity={1.7} />
        </mesh>
      ))}
      {directionOn && currentA !== 0 && (
        <>
          <Text position={[-1.32, 0, 0.72]} fontSize={0.22} color={north < 0 ? '#60A5FA' : '#A78BFA'} anchorX="center">S</Text>
          <Text position={[1.32, 0, 0.72]} fontSize={0.22} color={north > 0 ? '#FB7185' : '#A78BFA'} anchorX="center">N</Text>
          <Text position={[0, 0.95, 0.05]} fontSize={0.12} color="#FBBF24" anchorX="center">I {currentA > 0 ? '→' : '←'}</Text>
        </>
      )}
      {currentA === 0 && <Text position={[0, 1.15, 0]} fontSize={0.14} color="#8EA0B8" anchorX="center">No current. No solenoid field.</Text>}
      <OrbitControls makeDefault enableDamping dampingFactor={0.08} />
    </>
  )
}

function AxisArrow({ points, reverse }: { points: [number, number, number][]; reverse: boolean }) {
  const index = Math.floor(points.length * 0.42)
  const from = new THREE.Vector3(...points[Math.max(0, index - 1)])
  const to = new THREE.Vector3(...points[Math.min(points.length - 1, index + 1)])
  const direction = to.sub(from).normalize().multiplyScalar(reverse ? -1 : 1)
  const rotation = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction)
  return <mesh position={points[index]} quaternion={rotation}><coneGeometry args={[0.055, 0.13, 8]} /><meshBasicMaterial color="#A78BFA" /></mesh>
}

function LearningContent({ mode, answer, setAnswer, hasCore }: {
  mode: LearningMode
  answer: number | null
  setAnswer: (answer: number) => void
  hasCore: boolean
}) {
  if (mode === 'Explore') return <><span className="lab-section-label">Explore</span><h2>Build an electromagnet</h2><p>Change turns and current, then insert the core. Reverse the current to switch which end acts as the north pole.</p></>
  if (mode === 'Learn') return <><span className="lab-section-label">Learn</span><h2>Turns and current add up</h2><p>For a long air-core solenoid, B is approximately μ₀nI. More turns per metre or more current strengthens the internal field.</p><p>{hasCore ? 'A ferromagnetic core can strengthen the field; its response is nonlinear and eventually saturates.' : 'The air-core model uses vacuum permeability. A magnetic core changes the material response.'}</p></>
  const options = ['The field approximately doubles', 'The field is halved', 'The field is unchanged']
  return (
    <>
      <span className="lab-section-label">Challenge</span><h2>Double the winding density</h2><p>At fixed current and core state, what happens to the ideal internal field if the number of turns doubles?</p>
      <div className="lab-info-choice">{options.map((option, index) => <button type="button" key={option} className={answer === index ? (index === 0 ? 'is-correct' : 'is-wrong') : ''} onClick={() => setAnswer(index)}>{option}</button>)}</div>
      {answer !== null && <p role="status">{answer === 0 ? 'Correct for an unsaturated solenoid: B is proportional to nI.' : 'For the ideal model, doubling turns per unit length doubles B until material saturation matters.'}</p>}
    </>
  )
}

function formatSI(value: number): string {
  if (!Number.isFinite(value)) return 'undefined'
  if (value === 0) return '0'
  if (Math.abs(value) >= 0.01 && Math.abs(value) < 1000) return Number(value.toPrecision(3)).toString()
  return value.toExponential(2)
}
