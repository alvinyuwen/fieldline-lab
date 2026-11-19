import { ArrowsOut, CaretDown, Eye, EyeSlash, SidebarSimple, SlidersHorizontal } from '@phosphor-icons/react'
import { motion, useReducedMotion } from 'framer-motion'
import { Suspense, lazy, useEffect, useState } from 'react'
import { activeSimulation } from '../registry'
import { useSimStore, type LearningLevel } from '../core/store'
import { useSiteStore } from '../core/site-store'
import { GlassPanel } from './GlassPanel'
import { ControlsPanel } from './ControlsPanel'
import { PlaybackBar } from './PlaybackBar'
import { ViewPresets } from './ViewPresets'

const SceneCanvas = lazy(() => import('../sims/charged-particle/SceneCanvas').then((module) => ({ default: module.SceneCanvas })))
const EquationPanel = lazy(() => import('./EquationPanel').then((module) => ({ default: module.EquationPanel })))
const GraphPanel = lazy(() => import('./GraphPanel').then((module) => ({ default: module.GraphPanel })))

const levels: readonly LearningLevel[] = ['Intuition', 'Equation', 'Derivation', 'Advanced']

export function SimLayout() {
  const level = useSimStore((state) => state.level)
  const setLevel = useSimStore((state) => state.setLevel)
  const reduceEffects = useSiteStore((state) => state.reduceEffects)
  const setReduceEffects = useSiteStore((state) => state.setReduceEffects)
  const uiHidden = useSimStore((state) => state.uiHidden)
  const leftPanelOpen = useSimStore((state) => state.leftPanelOpen)
  const rightPanelOpen = useSimStore((state) => state.rightPanelOpen)
  const controlsOpen = useSimStore((state) => state.controlsOpen)
  const mode = useSimStore((state) => state.controls.mode)
  const toggle = useSimStore((state) => state.toggle)

  useEffect(() => {
    document.documentElement.dataset.reduceEffects = String(reduceEffects)
    return () => { delete document.documentElement.dataset.reduceEffects }
  }, [reduceEffects])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null
      if (target?.matches('input, textarea, select, [contenteditable="true"]')) return
      if (event.key.toLowerCase() === 'h') useSimStore.getState().setUiHidden(!useSimStore.getState().uiHidden)
      if (event.code === 'Space') {
        event.preventDefault()
        const state = useSimStore.getState()
        state.setPlaying(!state.playing)
      }
      if (event.key.toLowerCase() === 'r') useSimStore.getState().reset()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [toggle])

  const handleFullscreen = () => {
    if (document.fullscreenElement) void document.exitFullscreen()
    else void document.documentElement.requestFullscreen?.()
  }

  return (
    <main className={`sim-app min-h-[100dvh] ${uiHidden ? 'ui-hidden' : ''}`}>
      <header className="topbar">
        <a className="brand-lockup" href="/" aria-label="Fieldline Lab home">
          <span className="brand-mark" aria-hidden="true"><i /><i /><i /></span>
          <span>fieldline<span className="brand-lockup__lab">lab</span></span>
        </a>
        <div className="topbar__simulation">
          <span>{activeSimulation.category}</span>
          <span className="breadcrumb-separator">/</span>
          <strong>{activeSimulation.title}</strong>
        </div>
        <div className="topbar__actions">
          <div className="level-tabs" role="tablist" aria-label="Explanation depth">
            {levels.map((item) => (
              <button
                type="button"
                role="tab"
                aria-selected={level === item}
                className={level === item ? 'is-selected' : ''}
                key={item}
                onClick={() => setLevel(item)}
              >
                {item}
              </button>
            ))}
          </div>
          <label className="mobile-level-control">
            <span className="sr-only">Explanation depth</span>
            <select
              aria-label="Explanation depth"
              value={level}
              onChange={(event) => setLevel(event.target.value as LearningLevel)}
            >
              {levels.map((item) => <option value={item} key={item}>{item}</option>)}
            </select>
          </label>
          <button
            type="button"
            className={`icon-button ${reduceEffects ? 'is-active' : ''}`}
            onClick={() => setReduceEffects(!reduceEffects)}
            aria-label={reduceEffects ? 'Turn effects on' : 'Reduce visual effects'}
            aria-pressed={reduceEffects}
            title="Reduce visual effects"
          >
            {reduceEffects ? <EyeSlash size={17} /> : <Eye size={17} />}
          </button>
          <button type="button" className="icon-button fullscreen-button" onClick={handleFullscreen} aria-label="Toggle fullscreen">
            <ArrowsOut size={17} />
          </button>
        </div>
      </header>

      <div className={`sim-main ${leftPanelOpen ? '' : 'sim-main--left-collapsed'} ${rightPanelOpen ? '' : 'sim-main--right-collapsed'}`}>
        {leftPanelOpen && (
          <GlassPanel variant="dense" className={`left-panel ${controlsOpen ? 'left-panel--mobile-open' : ''}`} label="Simulation controls">
            <ControlsPanel />
          </GlassPanel>
        )}

        <section className="center-stage" aria-label="Simulation workspace">
          <ViewPresets />
          <Suspense fallback={<div className="scene-loading" role="status">Preparing the 3D scene…</div>}>
            <SceneCanvas />
          </Suspense>
          <div className="scene-depth" aria-hidden="true">
            <span>Drag to orbit</span>
            <span>Scroll to zoom</span>
          </div>
        </section>

        {rightPanelOpen && (
          <aside className="right-panel" aria-label="Equation and graph">
            <Suspense fallback={<div className="panel-loading" role="status">Loading equation…</div>}>
              <GlassPanel variant="dense" label="Magnetic force equation">
                <EquationPanel />
              </GlassPanel>
            </Suspense>
            <Suspense fallback={<div className="panel-loading" role="status">Loading graph…</div>}>
              <GlassPanel variant="dense" label="Linked position graph">
                <GraphPanel />
              </GlassPanel>
            </Suspense>
            <PredictionPrompt reduceEffects={reduceEffects} />
          </aside>
        )}
      </div>

      <footer className="bottom-strip">
        <button type="button" className="collapse-control" onClick={() => toggle('leftPanelOpen')} aria-label={leftPanelOpen ? 'Collapse controls panel' : 'Show controls panel'}>
          <SidebarSimple size={17} />
        </button>
        <button type="button" className="mobile-controls-button" onClick={() => toggle('controlsOpen')} aria-expanded={controlsOpen}>
          <SlidersHorizontal size={15} />
          Controls
          <CaretDown size={13} />
        </button>
        <PlaybackBar />
        <span className="bottom-spacer" />
        <span className="mode-status">{mode} mode</span>
        <button type="button" className="collapse-control" onClick={() => toggle('rightPanelOpen')} aria-label={rightPanelOpen ? 'Collapse graph and equation panel' : 'Show graph and equation panel'}>
          <SidebarSimple size={17} className="sidebar-right-icon" />
        </button>
      </footer>
    </main>
  )
}

function PredictionPrompt({ reduceEffects }: { reduceEffects: boolean }) {
  const [answer, setAnswer] = useState('')
  const reduceMotion = useReducedMotion()
  return (
    <div className="prediction">
      <span className="prediction__label">Make a prediction</span>
      <label htmlFor="prediction-choice">If the magnetic field doubles, what happens to the radius?</label>
      <div className="prediction__row">
        <select id="prediction-choice" value={answer} onChange={(event) => setAnswer(event.target.value)}>
          <option value="">Choose an answer</option>
          <option value="half">It halves</option>
          <option value="same">It stays the same</option>
          <option value="double">It doubles</option>
        </select>
      </div>
      {answer && (
        <motion.p
          className={answer === 'half' ? 'prediction__feedback is-correct' : 'prediction__feedback'}
          initial={reduceMotion || reduceEffects ? false : { opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: reduceMotion || reduceEffects ? 0 : 0.18 }}
        >
          {answer === 'half'
            ? 'Correct. r = mv / (|q|B), so doubling B halves r.'
            : 'Try again. The radius is inversely proportional to |B|.'}
        </motion.p>
      )}
    </div>
  )
}
