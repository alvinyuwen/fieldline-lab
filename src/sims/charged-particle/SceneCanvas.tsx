import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Grid, Line, OrbitControls } from '@react-three/drei'
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import * as THREE from 'three'
import { advanceFixed } from '../../core/integrator'
import { DEFAULT_TIME_STEP } from '../../core/constants'
import { add, cross, magnitude, normalize, scale, type Vec3 } from '../../core/vector'
import { selectParameters, useSimStore } from '../../core/store'
import { useSiteStore } from '../../core/site-store'

const viewPositions = {
  Top: new THREE.Vector3(0, 0, 6),
  Side: new THREE.Vector3(0, -6, 0),
  Front: new THREE.Vector3(6, 0, 0),
  Isometric: new THREE.Vector3(4.5, -4.5, 4.5),
} as const

function CameraPreset() {
  const view = useSimStore((state) => state.view)
  const { camera } = useThree()
  useEffect(() => {
    camera.position.copy(viewPositions[view])
    if (view === 'Top') camera.up.set(0, 1, 0)
    else camera.up.set(0, 0, 1)
    camera.lookAt(0, 0, 0)
    camera.updateProjectionMatrix()
  }, [camera, view])
  return null
}

function VectorArrow({ vector, origin, color, lengthScale = 1 }: {
  vector: Vec3
  origin: Vec3
  color: string
  lengthScale?: number
}) {
  const geometry = useMemo(() => {
    const direction = normalize(vector)
    if (magnitude(direction) === 0) return null
    const length = Math.max(0.35, Math.min(1.7, magnitude(vector) * lengthScale))
    const tip = add(origin, scale(direction, length))
    const reference: Vec3 = Math.abs(direction[2]) < 0.9 ? [0, 0, 1] : [0, 1, 0]
    const side = normalize(cross(direction, reference))
    const base = add(tip, scale(direction, -0.15))
    return {
      shaft: [origin, tip],
      headLeft: [tip, add(base, scale(side, 0.075))],
      headRight: [tip, add(base, scale(side, -0.075))],
    }
  }, [color, lengthScale, origin, vector])
  if (!geometry) return null
  return (
    <group>
      <Line points={geometry.shaft} color={color} lineWidth={2} />
      <Line points={geometry.headLeft} color={color} lineWidth={2} />
      <Line points={geometry.headRight} color={color} lineWidth={2} />
    </group>
  )
}

function FieldLines() {
  const visible = useSimStore((state) => state.showField)
  const field = useSimStore((state) => state.controls.field)
  if (!visible || field === 0) return null
  const lines: ReactNode[] = []
  for (let x = -2; x <= 2; x += 1) {
    for (let y = -2; y <= 2; y += 1) {
      if (x === 0 && y === 0) continue
      lines.push(
        <Line key={`${x}-${y}`} points={[[x, y, -2.7], [x, y, 2.7]]} color="#A78BFA" transparent opacity={0.28} lineWidth={1} />,
      )
      if (x % 2 === 0 && y % 2 === 0) {
        lines.push(
          <VectorArrow
            key={`arrow-${x}-${y}`}
            vector={[0, 0, 1]}
            origin={[x, y, 1.9]}
            color="#A78BFA"
            lengthScale={0.55}
          />,
        )
      }
    }
  }
  return <group>{lines}</group>
}

function ParticleScene() {
  const particleRef = useRef<THREE.Mesh>(null)
  const trail = useRef<Vec3[]>([])
  const frameAccumulator = useRef(0)
  const publishAccumulator = useRef(0)
  const [trailResetRevision, setTrailResetRevision] = useState(0)
  const lastSignature = useRef('')
  const currentState = useRef(useSimStore.getState().particle)
  const currentElapsed = useRef(useSimStore.getState().elapsed)
  const lastPublishedElapsed = useRef(useSimStore.getState().elapsed)
  const visibleTrail = useSimStore((state) => state.showTrail)
  const showAxes = useSimStore((state) => state.showAxes)
  const showGrid = useSimStore((state) => state.showGrid)
  const showVelocity = useSimStore((state) => state.showVelocity)
  const showForce = useSimStore((state) => state.showForce)
  const clearTrailSignal = useSimStore((state) => state.clearTrailSignal)

  useEffect(() => {
    trail.current = []
    setTrailResetRevision((revision) => revision + 1)
  }, [clearTrailSignal])

  useFrame((_, delta) => {
    const state = useSimStore.getState()
    const { controls } = state
    const signature = `${controls.charge}:${controls.mass}:${controls.field}:${controls.speed}:${controls.pitch}`
    if (lastSignature.current !== signature) {
      lastSignature.current = signature
      currentState.current = state.particle
      currentElapsed.current = state.elapsed
      lastPublishedElapsed.current = state.elapsed
      trail.current = []
      frameAccumulator.current = 0
    }

    if (state.playing) {
      if (state.elapsed !== lastPublishedElapsed.current) {
        currentElapsed.current = state.elapsed
        lastPublishedElapsed.current = state.elapsed
        currentState.current = state.particle
        frameAccumulator.current = 0
        trail.current = []
      }
      const parameters = selectParameters(controls)
      const result = advanceFixed(
        currentState.current,
        parameters,
        delta * state.playbackSpeed,
        frameAccumulator.current,
        DEFAULT_TIME_STEP,
      )
      currentState.current = result.state
      frameAccumulator.current = result.accumulator
      if (result.steps > 0) {
        currentElapsed.current += result.elapsed
        const nextElapsed = currentElapsed.current
        trail.current.push(result.state.position)
        while (trail.current.length > 360) trail.current.shift()
        publishAccumulator.current += delta
        if (publishAccumulator.current >= 1 / 20) {
          publishAccumulator.current = 0
          useSimStore.setState({ elapsed: nextElapsed, particle: result.state })
          lastPublishedElapsed.current = nextElapsed
        }
      }
    } else {
      currentState.current = state.particle
      currentElapsed.current = state.elapsed
      lastPublishedElapsed.current = state.elapsed
    }

    if (particleRef.current) {
      const position = currentState.current.position
      particleRef.current.position.set(position[0], position[1], position[2])
    }
  })

  const controls = useSimStore((state) => state.controls)
  const parameters = selectParameters(controls)
  const elapsed = useSimStore((state) => state.elapsed)
  const liveParticle = useSimStore((state) => state.particle)
  const particle = liveParticle
  const velocity = particle.velocity
  const forceComponents = cross(velocity, parameters.magneticField)
  const force: Vec3 = [
    forceComponents[0] * controls.charge,
    forceComponents[1] * controls.charge,
    forceComponents[2] * controls.charge,
  ]

  const trailPoints = useMemo(() => {
    if (!visibleTrail || trail.current.length < 2) return []
    return trail.current.map((point) => [point[0], point[1], point[2]] as [number, number, number])
  }, [elapsed, trailResetRevision, visibleTrail])

  return (
    <>
      <ambientLight intensity={0.75} />
      <directionalLight position={[4, 3, 5]} intensity={1.2} />
      {showGrid && (
        <Grid
          args={[10, 10]}
          position={[0, 0, -0.02]}
          rotation={[-Math.PI / 2, 0, 0]}
          cellSize={0.5}
          cellThickness={0.6}
          cellColor="#27364B"
          sectionSize={2}
          sectionThickness={1}
          sectionColor="#41566E"
          fadeDistance={16}
          infiniteGrid={false}
        />
      )}
      {showAxes && (
        <group>
          <Line points={[[-3, 0, 0], [3, 0, 0]]} color="#5B6B82" transparent opacity={0.5} lineWidth={1} />
          <Line points={[[0, -3, 0], [0, 3, 0]]} color="#5B6B82" transparent opacity={0.5} lineWidth={1} />
          <Line points={[[0, 0, -3], [0, 0, 3]]} color="#5B6B82" transparent opacity={0.5} lineWidth={1} />
        </group>
      )}
      <FieldLines />
      {visibleTrail && trailPoints.length > 1 && <Line points={trailPoints} color="#22D3EE" transparent opacity={0.42} lineWidth={1.5} />}
      <mesh position={liveParticle.position as [number, number, number]}>
        <sphereGeometry args={[0.14, 24, 24]} />
        <meshBasicMaterial color="#22D3EE" transparent opacity={0.16} depthWrite={false} />
      </mesh>
      <mesh ref={particleRef} position={liveParticle.position as [number, number, number]}>
        <sphereGeometry args={[0.085, 24, 24]} />
        <meshStandardMaterial color="#F6FCFF" emissive="#22D3EE" emissiveIntensity={2.8} roughness={0.24} />
      </mesh>
      {showVelocity && <VectorArrow vector={velocity} origin={particle.position} color="#22D3EE" lengthScale={0.75} />}
      {showForce && <VectorArrow vector={force} origin={particle.position} color="#FF6B6B" lengthScale={0.55} />}
      <OrbitControls makeDefault enableDamping dampingFactor={0.08} />
      <CameraPreset />
    </>
  )
}

export function SceneCanvas() {
  const quality = useSiteStore((state) => state.quality)
  const orthographic = useSimStore((state) => state.orthographic)
  const toggle = useSimStore((state) => state.toggle)
  const showVelocity = useSimStore((state) => state.showVelocity)
  const showForce = useSimStore((state) => state.showForce)
  const showField = useSimStore((state) => state.showField)
  const showTrail = useSimStore((state) => state.showTrail)
  const showAxes = useSimStore((state) => state.showAxes)
  const showGrid = useSimStore((state) => state.showGrid)
  const clearTrail = useSimStore((state) => state.clearTrail)

  return (
    <div className="scene-wrap" role="img" aria-label="Interactive three-dimensional charged-particle path in a uniform magnetic field">
      <Canvas
        orthographic={orthographic}
        camera={{ position: [4.5, -4.5, 4.5], fov: 42, near: 0.01, far: 100 }}
        dpr={[1, quality === 'low' ? 1 : quality === 'medium' ? 1.35 : 1.75]}
        gl={{ antialias: quality !== 'low', alpha: true }}
      >
        <color attach="background" args={['#080E19']} />
        <ParticleScene />
      </Canvas>
      <div className="scene-legend">
        <button type="button" className={showVelocity ? 'is-visible' : ''} onClick={() => toggle('showVelocity')} aria-pressed={showVelocity}>
          <i className="legend-swatch legend-swatch--velocity" />Velocity
        </button>
        <button type="button" className={showForce ? 'is-visible' : ''} onClick={() => toggle('showForce')} aria-pressed={showForce}>
          <i className="legend-swatch legend-swatch--force" />Force
        </button>
        <button type="button" className={showField ? 'is-visible' : ''} onClick={() => toggle('showField')} aria-pressed={showField}>
          <i className="legend-swatch legend-swatch--field" />Field
        </button>
        <button type="button" className={showTrail ? 'is-visible' : ''} onClick={() => toggle('showTrail')} aria-pressed={showTrail}>Trail</button>
        <button type="button" className={showAxes ? 'is-visible' : ''} onClick={() => toggle('showAxes')} aria-pressed={showAxes}>Axes</button>
        <button type="button" className={showGrid ? 'is-visible' : ''} onClick={() => toggle('showGrid')} aria-pressed={showGrid}>Grid</button>
      </div>
      <button type="button" className="scene-clear" onClick={clearTrail}>
        Clear trail
      </button>
    </div>
  )
}
