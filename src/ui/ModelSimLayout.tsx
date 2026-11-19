import { ArrowLeft, ArrowCounterClockwise, ArrowsOut, Eye, EyeSlash, Pause, Play, ShareNetwork, SkipForward } from '@phosphor-icons/react'
import katex from 'katex'
import { Canvas } from '@react-three/fiber'
import { Grid, Line, OrbitControls } from '@react-three/drei'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import uPlot from 'uplot'
import 'uplot/dist/uPlot.min.css'
import { useSiteStore } from '../core/site-store'
import type { ParameterValues, SimulationDefinition, SimulationSample, SimulationVector } from '../sims/types'
import { SliderField } from './SliderField'

const depthNames = ['Intuition', 'Equation', 'Derivation', 'Advanced'] as const
type DepthName = (typeof depthNames)[number]
type CameraView = 'Top' | 'Side' | 'Front' | 'Isometric'

const initialParams = (definition: SimulationDefinition): Record<string, number> =>
  Object.fromEntries(definition.params.map((parameter) => [parameter.key, parameter.defaultValue]))

const paramsFromUrl = (definition: SimulationDefinition): Record<string, number> => {
  const defaults = initialParams(definition)
  const encoded = new URLSearchParams(window.location.search).get('p')
  if (!encoded) return defaults
  try {
    const restored = JSON.parse(encoded) as Record<string, unknown>
    for (const parameter of definition.params) {
      const value = restored[parameter.key]
      if (typeof value === 'number' && Number.isFinite(value)) {
        defaults[parameter.key] = Math.max(parameter.min, Math.min(parameter.max, value))
      }
    }
  } catch {
    return defaults
  }
  return defaults
}

export function ModelSimLayout({ definition }: { definition: SimulationDefinition }) {
  const [params, setParams] = useState(() => paramsFromUrl(definition))
  const [coordinate, setCoordinate] = useState(() => definition.domain(paramsFromUrl(definition)).min)
  const [playing, setPlaying] = useState(true)
  const [speed, setSpeed] = useState(1)
  const [depth, setDepth] = useState<DepthName>('Intuition')
  const [answer, setAnswer] = useState<number | null>(null)
  const [cameraView, setCameraView] = useState<CameraView>('Isometric')
  const [showVectors, setShowVectors] = useState(true)
  const [showAxes, setShowAxes] = useState(true)
  const [showGrid, setShowGrid] = useState(true)
  const [showPath, setShowPath] = useState(true)
  const [orthographic, setOrthographic] = useState(false)
  const [uiHidden, setUiHidden] = useState(false)
  const [shareMessage, setShareMessage] = useState('')
  const markVisited = useSiteStore((state) => state.markVisited)
  const markCompleted = useSiteStore((state) => state.markCompleted)
  const quality = useSiteStore((state) => state.quality)
  const reduceEffects = useSiteStore((state) => state.reduceEffects)
  const setReduceEffects = useSiteStore((state) => state.setReduceEffects)
  const domain = definition.domain(params)
  const current: SimulationSample = useMemo(() => definition.sample(coordinate, params), [coordinate, definition, params])
  const challengeComplete = definition.challenge.complete(params)

  useEffect(() => {
    markVisited(definition.id)
  }, [definition.id, markVisited])

  useEffect(() => {
    document.documentElement.dataset.reduceEffects = String(reduceEffects)
    return () => { delete document.documentElement.dataset.reduceEffects }
  }, [reduceEffects])

  useEffect(() => {
    if (challengeComplete) markCompleted(definition.id)
  }, [challengeComplete, definition.id, markCompleted])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null
      if (target?.matches('input, textarea, select, button, [contenteditable="true"]')) return
      if (event.key.toLowerCase() === 'h') setUiHidden((hidden) => !hidden)
      if (event.code === 'Space') {
        event.preventDefault()
        setPlaying((isPlaying) => !isPlaying)
      }
      if (event.key.toLowerCase() === 'r') {
        const next = initialParams(definition)
        setParams(next)
        setCoordinate(definition.domain(next).min)
        setPlaying(false)
        setAnswer(null)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [definition])

  useEffect(() => {
    if (!playing) return
    const interval = window.setInterval(() => {
      setCoordinate((value) => {
        return definition.step({ coordinate: value }, params, domain.step * 8 * speed).coordinate
      })
    }, 1000 / 30)
    return () => window.clearInterval(interval)
  }, [definition, domain.step, params, playing, speed])

  useEffect(() => {
    const url = new URL(window.location.href)
    url.searchParams.set('sim', definition.id)
    url.searchParams.set('p', JSON.stringify(params))
    window.history.replaceState(null, '', url)
  }, [definition.id, params])

  const updateParameter = useCallback((key: string, value: number) => {
    setParams((previous) => ({ ...previous, [key]: value }))
    setCoordinate(definition.domain({ ...params, [key]: value }).min)
  }, [definition, params])

  const reset = () => {
    const next = initialParams(definition)
    setParams(next)
    setCoordinate(definition.domain(next).min)
    setPlaying(false)
    setAnswer(null)
  }

  const step = () => {
    setPlaying(false)
    setCoordinate((value) => definition.step({ coordinate: value }, params, domain.step).coordinate)
  }

  const share = async () => {
    const url = new URL(window.location.href)
    url.searchParams.set('sim', definition.id)
    url.searchParams.set('p', JSON.stringify(params))
    try {
      await navigator.clipboard.writeText(url.toString())
      setShareMessage('Link copied')
    } catch {
      setShareMessage(url.toString())
    }
    window.setTimeout(() => setShareMessage(''), 3500)
  }

  return (
    <main className={`model-app ${uiHidden ? 'model-ui-hidden' : ''}`}>
      <header className="model-topbar">
        <a className="brand-lockup" href="/" aria-label="Return to Fieldline Lab catalog">
          <span className="brand-mark" aria-hidden="true"><i /><i /><i /></span>
          <span>fieldline<span className="brand-lockup__lab">lab</span></span>
        </a>
        <div className="model-breadcrumb">
          <a href="/"><ArrowLeft size={15} aria-hidden="true" /> Catalog</a>
          <span aria-hidden="true">/</span>
          <strong>{definition.title}</strong>
        </div>
        <div className="model-topbar__actions">
          <button type="button" className={`icon-button ${reduceEffects ? 'is-active' : ''}`} onClick={() => setReduceEffects(!reduceEffects)} aria-label={reduceEffects ? 'Turn effects on' : 'Reduce visual effects'} aria-pressed={reduceEffects}>
            {reduceEffects ? <EyeSlash size={17} /> : <Eye size={17} />}
          </button>
          <label className="model-depth">
            <span className="sr-only">Explanation depth</span>
            <select value={depth} onChange={(event) => setDepth(event.target.value as DepthName)}>
              {depthNames.map((name) => <option key={name}>{name}</option>)}
            </select>
          </label>
          <button type="button" className="icon-button" onClick={() => void share()} aria-label="Copy shareable simulation link" title="Copy shareable link">
            <ShareNetwork size={17} />
          </button>
          <button type="button" className="icon-button" onClick={() => {
            if (document.fullscreenElement) void document.exitFullscreen()
            else void document.documentElement.requestFullscreen?.()
          }} aria-label="Toggle fullscreen">
            <ArrowsOut size={17} />
          </button>
        </div>
      </header>

      <div className="model-workspace">
        <aside className="model-controls" aria-label="Simulation controls">
          <div className="model-section-title">
            <div>
              <span className="catalog-kicker">{definition.topic} · {definition.levels.join(', ')}</span>
              <h1>{definition.title}</h1>
            </div>
            <button type="button" className="icon-button" onClick={reset} aria-label="Reset all simulation parameters">
              <ArrowCounterClockwise size={17} />
            </button>
          </div>
          <p className="model-description">{definition.description}</p>
          <div className="model-parameters">
            {definition.params.map((parameter) => (
              <SliderField
                key={parameter.key}
                label={parameter.name}
                variable={`${parameter.symbol}-${definition.id}`}
                unit={parameter.unit}
                value={params[parameter.key]}
                min={parameter.min}
                max={parameter.max}
                step={parameter.step}
                resetValue={parameter.defaultValue}
                onChange={(value) => updateParameter(parameter.key, value)}
              />
            ))}
          </div>
          <div className="model-presets">
            <h2>Starting points</h2>
            {definition.presets.map((preset) => (
              <button
                type="button"
                key={preset.id}
                title={preset.description}
                onClick={() => {
                  const next = { ...params }
                  for (const [key, value] of Object.entries(preset.values)) {
                    if (typeof value === 'number') next[key] = value
                  }
                  setParams(next)
                  setCoordinate(definition.domain(next).min)
                  setAnswer(null)
                }}
              >
                {preset.label}
              </button>
            ))}
          </div>
          <div className={`model-challenge ${challengeComplete ? 'is-complete' : ''}`}>
            <span>{challengeComplete ? 'Challenge complete' : 'Try this'}</span>
            <strong>{definition.challenge.title}</strong>
            <p>{definition.challenge.description}</p>
          </div>
        </aside>

        <section className="model-scene-column" aria-label="Interactive simulation scene">
          <div className="model-scene-toolbar">
            <div className="view-tabs" role="group" aria-label="Camera view">
              {(['Top', 'Side', 'Front', 'Isometric'] as const).map((view) => (
                <button type="button" key={view} className={cameraView === view ? 'is-selected' : ''} onClick={() => setCameraView(view)}>{view}</button>
              ))}
            </div>
            <div className="model-scene-toolbar__toggles">
              <button type="button" className={`model-toggle ${orthographic ? 'is-selected' : ''}`} onClick={() => setOrthographic(!orthographic)} aria-pressed={orthographic}>Orthographic</button>
              <button type="button" className={`model-toggle ${showVectors ? 'is-selected' : ''}`} onClick={() => setShowVectors(!showVectors)} aria-pressed={showVectors}>Vectors</button>
              <button type="button" className={`model-toggle ${showPath ? 'is-selected' : ''}`} onClick={() => setShowPath(!showPath)} aria-pressed={showPath}>Path</button>
              <button type="button" className={`model-toggle ${showAxes ? 'is-selected' : ''}`} onClick={() => setShowAxes(!showAxes)} aria-pressed={showAxes}>Axes</button>
              <button type="button" className={`model-toggle ${showGrid ? 'is-selected' : ''}`} onClick={() => setShowGrid(!showGrid)} aria-pressed={showGrid}>Grid</button>
              <button type="button" className="model-toggle" onClick={() => { setShowPath(false); setPlaying(false); setCoordinate(domain.min) }}>Clear path</button>
            </div>
          </div>
          <SceneCanvas
            definition={definition}
            params={params}
            current={current}
            coordinate={coordinate}
            cameraView={cameraView}
            showVectors={showVectors}
            showAxes={showAxes}
            showGrid={showGrid}
            showPath={showPath}
            orthographic={orthographic}
            quality={quality}
          />
          <div className="model-playback">
            <button type="button" className="play-button" onClick={() => setPlaying(!playing)} aria-label={playing ? 'Pause simulation' : 'Play simulation'}>
              {playing ? <Pause size={17} weight="fill" /> : <Play size={17} weight="fill" />}
            </button>
            <button type="button" className="icon-button" onClick={step} aria-label="Advance simulation by one step"><SkipForward size={17} /></button>
            <label>
              <span className="sr-only">Playback speed</span>
              <select value={speed} onChange={(event) => setSpeed(Number(event.target.value))}>
                {[0.25, 0.5, 1, 2, 4].map((rate) => <option key={rate} value={rate}>{rate}×</option>)}
              </select>
            </label>
            <span className="model-coordinate">{domain.variable} = {formatValue(coordinate)} {domain.unit}</span>
            <button type="button" className="text-button" onClick={reset}>Reset</button>
          </div>
        </section>

        <aside className="model-insights" aria-label="Equations and linked graph">
          <section className="model-panel">
            <div className="model-panel__heading">
              <div><span>Live relationship</span><h2>{current.resultLabel}</h2></div>
              <strong>{formatDisplayText(current.resultValue)}</strong>
            </div>
            <Katex value={current.equation || definition.equation} label="Governing equation" />
            <Katex value={current.substitution} label="Equation with current values" />
            <div className="model-metrics">
              {current.metrics.map((metric) => (
                <div key={metric.label}><span>{metric.label}</span><strong>{formatDisplayText(metric.value)}{metric.unit ? ` ${metric.unit}` : ''}</strong></div>
              ))}
            </div>
            {current.invariant && (
              <p className={`invariant-readout ${current.invariant.relativeDrift < 0.001 ? 'is-stable' : ''}`}>
                {current.invariant.label} relative drift: {formatValue(current.invariant.relativeDrift * 100)}%
              </p>
            )}
            <p className="model-explanation">{definition.depthLevels[depth]}</p>
            {depth !== 'Intuition' && <p className="model-explanation">{definition.whatToNotice}</p>}
          </section>

          <GraphPanel definition={definition} params={params} domain={domain} coordinate={coordinate} onScrub={(value) => {
            setPlaying(false)
            setCoordinate(value)
          }} />

          {definition.predictionPrompts[0] && (
            <section className="model-panel model-prediction">
              <span>Make a prediction</span>
              <h2>{definition.predictionPrompts[0].question}</h2>
              <div role="group" aria-label="Prediction choices">
                {definition.predictionPrompts[0].options.map((option, index) => (
                  <button type="button" key={option} className={answer === index ? (index === definition.predictionPrompts[0].answer ? 'is-correct' : 'is-wrong') : ''} onClick={() => setAnswer(index)}>
                    {option}
                  </button>
                ))}
              </div>
              {answer !== null && <p role="status">{answer === definition.predictionPrompts[0].answer ? definition.predictionPrompts[0].explanation : 'Not quite. Change one parameter and try again.'}</p>}
            </section>
          )}
          <details className="model-assumptions">
            <summary>Assumptions and limits</summary>
            <p>{definition.assumptions}</p>
            <p>{definition.whatToNotice}</p>
          </details>
          {shareMessage && <p className="share-feedback" role="status">{shareMessage}</p>}
        </aside>
      </div>
      {uiHidden && <button type="button" className="model-show-ui" onClick={() => setUiHidden(false)}>Show interface (H)</button>}
    </main>
  )
}

function formatValue(value: number) {
  if (!Number.isFinite(value)) return 'undefined'
  return Number(value.toPrecision(4)).toString()
}

function formatDisplayText(value: string) {
  return value
    .replace(/(-?\d+(?:\.\d+)?)\\times 10\^\{(-?\d+)\}/g, '$1e$2')
    .replace(/\\text\{([^}]+)\}/g, '$1')
}

function Katex({ value, label }: { value: string; label: string }) {
  const html = useMemo(() => katex.renderToString(value, { throwOnError: false, trust: false }), [value])
  return <div className="model-katex" aria-label={label} dangerouslySetInnerHTML={{ __html: html }} />
}

function GraphPanel({ definition, params, domain, coordinate, onScrub }: {
  definition: SimulationDefinition
  params: ParameterValues
  domain: ReturnType<SimulationDefinition['domain']>
  coordinate: number
  onScrub: (value: number) => void
}) {
  const hostRef = useRef<HTMLDivElement>(null)
  const plotRef = useRef<uPlot | null>(null)
  const coordinateRef = useRef(coordinate)
  const programmaticCursor = useRef(false)
  coordinateRef.current = coordinate
  const data = useMemo<uPlot.AlignedData>(() => {
    const axis: number[] = []
    const values: number[] = []
    for (let index = 0; index <= 120; index += 1) {
      const x = domain.min + ((domain.max - domain.min) * index) / 120
      axis.push(x)
      const value = definition.sample(x, params).graphValue
      values.push(Number.isFinite(value) ? value : Number.NaN)
    }
    return [axis, values]
  }, [definition, domain.max, domain.min, params])

  useEffect(() => {
    if (!hostRef.current) return
    const options: uPlot.Options = {
      width: hostRef.current.clientWidth,
      height: 150,
      padding: [10, 8, 0, 0],
      legend: { show: false },
      cursor: { show: true, x: true, y: false, points: { show: false } },
      scales: { x: { time: false } },
      axes: [
        { stroke: '#8EA0B8', grid: { stroke: 'rgba(142, 160, 184, .1)', width: 1 }, font: '10px "Geist Mono", monospace' },
        { side: 3, stroke: '#8EA0B8', grid: { stroke: 'rgba(142, 160, 184, .1)', width: 1 }, font: '10px "Geist Mono", monospace' },
      ],
      series: [{}, { stroke: '#22D3EE', width: 2, points: { show: false } }],
      hooks: {
        setCursor: [(plot) => {
          if (programmaticCursor.current) return
          const index = plot.cursor.idx
          const value = typeof index === 'number' ? plot.data[0][index] : null
          if (value !== null && Number.isFinite(value) && Math.abs(value - coordinateRef.current) > domain.step) onScrub(value)
        }],
      },
    }
    const plot = new uPlot(options, data, hostRef.current)
    plotRef.current = plot
    const observer = new ResizeObserver(() => {
      if (hostRef.current) plot.setSize({ width: hostRef.current.clientWidth, height: 150 })
    })
    observer.observe(hostRef.current)
    return () => {
      observer.disconnect()
      plot.destroy()
      plotRef.current = null
    }
  }, [])

  useEffect(() => { plotRef.current?.setData(data) }, [data])
  useEffect(() => {
    const plot = plotRef.current
    if (!plot) return
    const x = Math.max(domain.min, Math.min(domain.max, coordinate))
    programmaticCursor.current = true
    plot.setCursor({ left: plot.valToPos(x, 'x'), top: 0 })
    window.requestAnimationFrame(() => { programmaticCursor.current = false })
  }, [coordinate, domain.max, domain.min])

  return (
    <section className="model-panel model-graph">
      <div className="model-panel__heading">
        <div><span>Linked graph</span><h2>{definition.domain(params).variable} response</h2></div>
        <span>{domain.unit}</span>
      </div>
      <div ref={hostRef} className="model-plot" aria-label={`Graph of ${definition.title} response against ${domain.variable}`} />
      <label className="model-scrubber">
        <span className="sr-only">Scrub {domain.variable}</span>
        <input type="range" min={domain.min} max={domain.max} step={domain.step} value={coordinate} onChange={(event) => onScrub(Number(event.target.value))} aria-label={`Scrub simulation ${domain.variable}`} />
      </label>
    </section>
  )
}

const cameraPositions = {
  Top: [0, 0, 7] as const,
  Side: [0, -7, 0] as const,
  Front: [7, 0, 0] as const,
  Isometric: [5, -5, 5] as const,
}

function SceneCanvas({ definition, params, current, coordinate, cameraView, showVectors, showAxes, showGrid, showPath, orthographic, quality }: {
  definition: SimulationDefinition
  params: ParameterValues
  current: SimulationSample
  coordinate: number
  cameraView: CameraView
  showVectors: boolean
  showAxes: boolean
  showGrid: boolean
  showPath: boolean
  orthographic: boolean
  quality: 'low' | 'medium' | 'high'
}) {
  const domain = definition.domain(params)
  const wavePath = useMemo(() => {
    if (!definition.waveAt || !showPath) return []
    const span = params.wavelength ?? 2 * Math.PI
    const end = definition.id === 'fourier-series' ? 2 * Math.PI : span
    return Array.from({ length: 121 }, (_, index) => {
      const x = (end * index) / 120
      const y = definition.waveAt?.(x, coordinate, params) ?? 0
      return [x, y, 0] as [number, number, number]
    })
  }, [coordinate, definition, params, showPath])
  const trajectoryPath = useMemo(() => showPath ? Array.from({ length: 49 }, (_, index) => {
    const value = domain.min + ((domain.max - domain.min) * index) / 48
    return definition.sample(value, params).position as [number, number, number]
  }) : [], [definition, domain.max, domain.min, params, showPath])
  const path = definition.waveAt ? wavePath : trajectoryPath
  const maxExtent = Math.max(2.5, ...path.flatMap((position) => position.map((value) => Math.abs(value))))
  const positionScale = Math.min(1, 2.5 / maxExtent)
  const point = current.position.map((value) => value * positionScale) as [number, number, number]
  const dpr = quality === 'low' ? 1 : quality === 'medium' ? 1.35 : 1.75

  return (
    <div className="model-scene">
      <Canvas role="img" aria-label={`${definition.title} 3D visualization. Drag to orbit and scroll to zoom.`} orthographic={orthographic} camera={{ position: cameraPositions[cameraView], fov: 42, near: 0.01, far: 100 }} dpr={[1, dpr]} gl={{ antialias: quality !== 'low', alpha: true }}>
        <color attach="background" args={['#080E19']} />
        <ambientLight intensity={0.75} />
        <directionalLight position={[4, 3, 5]} intensity={1.1} />
        {showGrid && <Grid args={[10, 10]} position={[0, 0, -0.02]} rotation={[-Math.PI / 2, 0, 0]} cellSize={0.5} cellColor="#27364B" sectionSize={2} sectionColor="#41566E" fadeDistance={16} infiniteGrid={false} />}
        {showAxes && <group>
          <Line points={[[-3, 0, 0], [3, 0, 0]]} color="#5B6B82" transparent opacity={0.45} lineWidth={1} />
          <Line points={[[0, -3, 0], [0, 3, 0]]} color="#5B6B82" transparent opacity={0.45} lineWidth={1} />
          <Line points={[[0, 0, -3], [0, 0, 3]]} color="#5B6B82" transparent opacity={0.45} lineWidth={1} />
        </group>}
        {path.length > 1 && <Line points={path.map((position) => position.map((value) => value * positionScale) as [number, number, number])} color="#22D3EE" transparent opacity={0.8} lineWidth={2} />}
        {current.position.length >= 2 && <mesh position={point}><sphereGeometry args={[0.085, 20, 20]} /><meshStandardMaterial color="#E6EDF7" emissive="#22D3EE" emissiveIntensity={1.8} /></mesh>}
        {showVectors && current.vectors?.map((item) => <VectorArrow key={item.key} item={item} scale={positionScale} />)}
        <OrbitControls makeDefault enableDamping dampingFactor={0.08} />
      </Canvas>
      {showVectors && current.vectors && current.vectors.length > 0 && (
        <div className="model-vector-legend" role="list" aria-label="Displayed vector quantities">
          {current.vectors.map((item) => <span key={item.key} role="listitem"><i style={{ backgroundColor: item.color }} />{item.label}</span>)}
        </div>
      )}
    </div>
  )
}

function VectorArrow({ item, scale }: { item: SimulationVector; scale: number }) {
  const start = item.origin.map((value) => value * scale) as [number, number, number]
  const vectorMagnitude = Math.hypot(...item.vector)
  if (vectorMagnitude === 0) return null
  const length = Math.max(0.25, Math.min(1.3, Math.log10(vectorMagnitude + 1) * 0.4))
  const direction = item.vector.map((value) => value / vectorMagnitude) as [number, number, number]
  const end = direction.map((value, index) => start[index] + value * length) as [number, number, number]
  const reference: [number, number, number] = Math.abs(direction[2]) < 0.9 ? [0, 0, 1] : [0, 1, 0]
  const sideRaw: [number, number, number] = [
    direction[1] * reference[2] - direction[2] * reference[1],
    direction[2] * reference[0] - direction[0] * reference[2],
    direction[0] * reference[1] - direction[1] * reference[0],
  ]
  const sideLength = Math.hypot(...sideRaw) || 1
  const base = end.map((value, index) => value - direction[index] * 0.15) as [number, number, number]
  const left = base.map((value, index) => value + (sideRaw[index] / sideLength) * 0.06) as [number, number, number]
  const right = base.map((value, index) => value - (sideRaw[index] / sideLength) * 0.06) as [number, number, number]
  return (
    <group>
      <Line points={[start, end]} color={item.color} lineWidth={2} />
      <Line points={[end, left]} color={item.color} lineWidth={2} />
      <Line points={[end, right]} color={item.color} lineWidth={2} />
    </group>
  )
}
