import { Canvas } from '@react-three/fiber'
import { Grid, Line, OrbitControls, Text } from '@react-three/drei'
import { useMemo, useState } from 'react'
import { inductionReadings } from '../../sims/labs/induction-physics'
import { LabLayout, LabRange, LabToggle, type LearningMode } from './LabLayout'
import { useLabPlayback } from './useLabPlayback'

const duration = 4
const minimumDistanceM = 0.8
const initialDistanceM = 1.6
const magnetMomentMagnitudeAm2 = 1.2
const coilResistanceOhm = 4

export default function InductionLab() {
  const [initialDistance, setInitialDistance] = useState(initialDistanceM)
  const [approachSpeed, setApproachSpeed] = useState(0.2)
  const [turns, setTurns] = useState(120)
  const [coilRadius, setCoilRadius] = useState(0.3)
  const [northFacesCoil, setNorthFacesCoil] = useState(true)
  const [fieldLinesOn, setFieldLinesOn] = useState(true)
  const [polarityLabelsOn, setPolarityLabelsOn] = useState(true)
  const [mode, setMode] = useState<LearningMode>('Explore')
  const [answer, setAnswer] = useState<number | null>(null)
  const clock = useLabPlayback(duration)
  const requestedDistance = initialDistance - approachSpeed * clock.time
  const separation = Math.max(minimumDistanceM, requestedDistance)
  const effectiveSpeed = requestedDistance <= minimumDistanceM && approachSpeed > 0 ? 0 : approachSpeed
  const readings = inductionReadings({
    magnetMomentAm2: northFacesCoil ? -magnetMomentMagnitudeAm2 : magnetMomentMagnitudeAm2,
    coilRadiusM: coilRadius,
    turns,
    resistanceOhm: coilResistanceOhm,
    separationM: separation,
    approachSpeedMPerS: effectiveSpeed,
  })

  const reset = () => {
    setInitialDistance(initialDistanceM)
    setApproachSpeed(0.2)
    setTurns(120)
    setCoilRadius(0.3)
    setNorthFacesCoil(true)
    setFieldLinesOn(true)
    setPolarityLabelsOn(true)
    setAnswer(null)
    clock.reset()
  }

  return (
    <LabLayout
      id="induction-lab"
      category="Electromagnetic induction"
      title="Faraday and Lenz's law"
      description="Move a bar magnet past a coil. Track flux, induced voltage, and the current that opposes the change."
      controls={
        <div className="lab-control-group">
          <h2>Magnet motion</h2>
          <LabRange label="Starting distance" value={initialDistance} min={minimumDistanceM} max={3} step={0.01} unit=" m" onChange={setInitialDistance} />
          <LabRange label="Speed toward coil" value={approachSpeed} min={-0.5} max={0.5} step={0.01} unit=" m/s" onChange={setApproachSpeed} />
          <div className="lab-button-row">
            <button type="button" className={`lab-button ${northFacesCoil ? 'is-selected' : ''}`} aria-pressed={northFacesCoil} onClick={() => setNorthFacesCoil(!northFacesCoil)}>
              {northFacesCoil ? 'North pole faces coil' : 'South pole faces coil'}
            </button>
          </div>
          <p className="lab-control-note">Positive speed moves the magnet toward the coil. Negative speed moves it away.</p>
        </div>
      }
      sceneControls={
        <>
          <LabToggle label="Magnetic field" pressed={fieldLinesOn} onClick={() => setFieldLinesOn(!fieldLinesOn)} />
          <LabToggle label="Pole labels" pressed={polarityLabelsOn} onClick={() => setPolarityLabelsOn(!polarityLabelsOn)} />
        </>
      }
      scene={
        <Canvas role="img" aria-label="Interactive bar magnet moving toward a multi-turn coil connected to a galvanometer" camera={{ position: [0.8, 1.9, 6.5], fov: 42, near: 0.1, far: 100 }} dpr={[1, 1.5]} gl={{ antialias: true, alpha: true }}>
          <color attach="background" args={['#080E19']} />
          <ambientLight intensity={0.75} />
          <directionalLight position={[4, 4, 5]} intensity={1.3} />
          <InductionScene
            separation={separation}
            coilRadius={coilRadius}
            currentA={readings.currentA}
            northFacesCoil={northFacesCoil}
            fieldLinesOn={fieldLinesOn}
            polarityLabelsOn={polarityLabelsOn}
          />
        </Canvas>
      }
      equation={String.raw`\Phi_B=\frac{\mu_0 m a^2}{2(a^2+z^2)^{3/2}},\qquad \mathcal{E}=-N\frac{d\Phi_B}{dt}`}
      equationLabel="Magnetic flux through a circular coil and Faraday's law"
      measurements={[
        { label: 'Magnet distance', value: `${formatSI(separation)} m` },
        { label: 'Flux per turn', value: `${formatSI(readings.fluxPerTurnWb)} Wb` },
        { label: 'Induced emf', value: `${formatSI(readings.emfV)} V` },
        { label: 'Galvanometer current', value: `${formatSI(readings.currentA * 1e6)} μA` },
        { label: 'Current direction', value: directionLabel(readings.currentA) },
      ]}
      mode={mode}
      onModeChange={setMode}
      learningContent={<LearningContent mode={mode} answer={answer} setAnswer={setAnswer} />}
      assumptions="The magnet is modeled as an axial magnetic dipole and the coil as a thin circular loop. The flux formula integrates the ideal dipole field over the coil disk; a point-dipole approximation is less accurate close to a real bar magnet. The galvanometer is idealized, with a fixed 4 Ω circuit resistance and a display sensitivity chosen for visibility. Coil self-inductance, resistance variation, and magnet motion caused by the induced force are omitted."
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

function InductionScene({ separation, coilRadius, currentA, northFacesCoil, fieldLinesOn, polarityLabelsOn }: {
  separation: number
  coilRadius: number
  currentA: number
  northFacesCoil: boolean
  fieldLinesOn: boolean
  polarityLabelsOn: boolean
}) {
  const fieldLoops = useMemo(() => Array.from({ length: 5 }, (_, index) => {
    const radius = 0.42 + index * 0.14
    const points: [number, number, number][] = []
    for (let point = 0; point <= 64; point += 1) {
      const angle = (2 * Math.PI * point) / 64
      points.push([radius * Math.sin(angle), 0.02 * (index - 2), separation + radius * Math.cos(angle)])
    }
    return points
  }), [separation])
  const needleAngle = Math.max(-1, Math.min(1, currentA / 5e-7)) * 0.78
  const nearPole = northFacesCoil ? 'N' : 'S'

  return (
    <>
      <Grid args={[6, 6]} position={[0, 0, -0.75]} rotation={[Math.PI / 2, 0, 0]} cellSize={0.5} cellColor="#26384c" sectionSize={2} sectionColor="#41566e" fadeDistance={10} infiniteGrid={false} />
      <mesh position={[0, 0, separation]} castShadow>
        <boxGeometry args={[0.34, 0.34, 0.72]} />
        <meshStandardMaterial color="#9E2439" metalness={0.22} roughness={0.42} />
      </mesh>
      <mesh position={[0, 0, separation + 0.19]} castShadow>
        <boxGeometry args={[0.345, 0.345, 0.36]} />
        <meshStandardMaterial color="#17527E" metalness={0.24} roughness={0.4} />
      </mesh>
      <mesh position={[0, 0, separation - 0.19]} castShadow>
        <boxGeometry args={[0.348, 0.348, 0.36]} />
        <meshStandardMaterial color="#9E2439" metalness={0.24} roughness={0.4} />
      </mesh>
      {polarityLabelsOn && (
        <>
          <Text position={[0, 0, separation - 0.19]} fontSize={0.14} color={nearPole === 'N' ? '#FDE7EA' : '#D9EDFF'} anchorX="center" anchorY="middle">{nearPole}</Text>
          <Text position={[0, 0, separation + 0.19]} fontSize={0.14} color={nearPole === 'N' ? '#D9EDFF' : '#FDE7EA'} anchorX="center" anchorY="middle">{nearPole === 'N' ? 'S' : 'N'}</Text>
        </>
      )}
      {Array.from({ length: 4 }, (_, index) => (
        <mesh key={index} position={[0, 0, 0.035 * (index - 1.5)]} rotation={[0, 0, 0]}>
          <torusGeometry args={[coilRadius, 0.016, 8, 64]} />
          <meshStandardMaterial color="#D18A55" metalness={0.78} roughness={0.22} />
        </mesh>
      ))}
      {fieldLinesOn && fieldLoops.map((points, index) => <Line key={index} points={points} color="#A78BFA" transparent opacity={0.55} lineWidth={1.3} />)}
      <Line points={[[-1.1, 0, 0.08], [-0.8, 0, 0.08], [-0.8, -0.55, 0.08], [0, -0.55, 0.08]]} color="#C87948" lineWidth={2} />
      <Line points={[[0, 0.55, 0.08], [-0.8, 0.55, 0.08], [-0.8, 0.15, 0.08], [-1.1, 0.15, 0.08]]} color="#C87948" lineWidth={2} />
      <mesh position={[-1.34, 0.08, 0.02]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.38, 0.38, 0.08, 48]} />
        <meshStandardMaterial color="#152236" metalness={0.28} roughness={0.38} />
      </mesh>
      <mesh position={[-1.34, 0.08, 0.075]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.32, 0.32, 0.025, 48]} />
        <meshStandardMaterial color="#26384c" roughness={0.7} />
      </mesh>
      <group position={[-1.34, 0.08, 0.1]} rotation={[0, 0, needleAngle]}>
        <Line points={[[0, -0.2, 0], [0, 0.24, 0]]} color={currentA === 0 ? '#8EA0B8' : '#FB7185'} lineWidth={3} />
        <mesh position={[0, 0, 0.005]}>
          <sphereGeometry args={[0.035, 12, 12]} />
          <meshStandardMaterial color="#E6EDF7" />
        </mesh>
      </group>
      <Text position={[-1.34, 0.58, 0.06]} fontSize={0.12} color="#E6EDF7" anchorX="center">GALVANOMETER</Text>
      <Text position={[0.9, -0.5, 0.05]} fontSize={0.12} color="#8EA0B8" anchorX="center">{currentA > 0 ? 'induced current: +' : currentA < 0 ? 'induced current: −' : 'no induced current'}</Text>
      <OrbitControls makeDefault enableDamping dampingFactor={0.08} />
    </>
  )
}

function LearningContent({ mode, answer, setAnswer }: {
  mode: LearningMode
  answer: number | null
  setAnswer: (answer: number) => void
}) {
  if (mode === 'Explore') return <><span className="lab-section-label">Explore</span><h2>Track a changing flux</h2><p>Move the magnet toward or away from the coil. Reverse its pole to compare the direction of the induced current.</p></>
  if (mode === 'Learn') return <><span className="lab-section-label">Learn</span><h2>Induced current opposes change</h2><p>Faraday's law relates emf to the rate of change of magnetic flux linkage. Lenz's law sets the current direction so its field opposes that change.</p><p>A stationary magnet produces no induced emf, even when magnetic flux through the coil is nonzero.</p></>
  const options = ['It doubles', 'It stays the same', 'It becomes zero']
  return (
    <>
      <span className="lab-section-label">Challenge</span><h2>Change the magnet speed</h2><p>At the same position and coil settings, what happens to induced emf if the magnet's speed doubles?</p>
      <div className="lab-info-choice">{options.map((option, index) => <button type="button" key={option} className={answer === index ? (index === 0 ? 'is-correct' : 'is-wrong') : ''} onClick={() => setAnswer(index)}>{option}</button>)}</div>
      {answer !== null && <p role="status">{answer === 0 ? 'Correct. At a fixed position, the rate of flux change and emf are proportional to speed.' : 'At a fixed position, doubling speed doubles the rate of flux change, so the emf doubles.'}</p>}
    </>
  )
}

function directionLabel(currentA: number): string {
  if (Math.abs(currentA) < 1e-14) return 'none'
  return currentA > 0 ? 'CCW viewed from +z' : 'CW viewed from +z'
}

function formatSI(value: number): string {
  if (!Number.isFinite(value)) return 'undefined'
  if (value === 0) return '0'
  if (Math.abs(value) >= 0.01 && Math.abs(value) < 1000) return Number(value.toPrecision(3)).toString()
  return value.toExponential(2)
}
