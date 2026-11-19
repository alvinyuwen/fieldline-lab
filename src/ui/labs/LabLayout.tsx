import { ArrowLeft, Pause, Play, SkipForward, ArrowCounterClockwise } from '@phosphor-icons/react'
import type { ReactNode } from 'react'
import { EquationDisplay } from './EquationDisplay'

export type LearningMode = 'Explore' | 'Learn' | 'Challenge'

export interface LabMeasurement {
  label: string
  value: string
  unit?: string
}

export interface LabRangeProps {
  label: string
  value: number
  min: number
  max: number
  step: number
  unit?: string
  onChange: (value: number) => void
}

export function LabRange({ label, value, min, max, step, unit = '', onChange }: LabRangeProps) {
  return (
    <label className="lab-field">
      <span className="lab-field__heading"><span>{label}</span><output>{Number(value.toPrecision(3))}{unit ? ` ${unit}` : ''}</output></span>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(event) => onChange(Number(event.target.value))} aria-label={label} />
    </label>
  )
}

export function LabSelect({ label, value, options, onChange }: {
  label: string
  value: string
  options: readonly { label: string; value: string }[]
  onChange: (value: string) => void
}) {
  return (
    <label className="lab-field">
      <span>{label}</span>
      <select className="lab-select" value={value} onChange={(event) => onChange(event.target.value)} aria-label={label}>
        {options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
      </select>
    </label>
  )
}

export function LabToggle({ label, pressed, onClick }: { label: string; pressed: boolean; onClick: () => void }) {
  return <button type="button" className="lab-button" aria-pressed={pressed} onClick={onClick}>{label}</button>
}

interface LabLayoutProps {
  id: string
  category: string
  title: string
  description: string
  controls: ReactNode
  scene: ReactNode
  sceneControls?: ReactNode
  equation: string
  equationLabel: string
  measurements: readonly LabMeasurement[]
  mode: LearningMode
  onModeChange: (mode: LearningMode) => void
  learningContent: ReactNode
  assumptions: string
  time: number
  duration: number
  timeLabel?: string
  playing: boolean
  speed: number
  onPlayPause: () => void
  onStep: () => void
  onReset: () => void
  onScrub: (value: number) => void
  onSpeedChange: (speed: number) => void
}

const modes: readonly LearningMode[] = ['Explore', 'Learn', 'Challenge']

export function LabLayout(props: LabLayoutProps) {
  return (
    <main className="lab-app" data-sim={props.id}>
      <header className="lab-header">
        <a className="brand-lockup" href="/" aria-label="Return to Fieldline Lab catalog">
          <span className="brand-mark" aria-hidden="true"><i /><i /><i /></span>
          <span>fieldline<span className="brand-lockup__lab">lab</span></span>
        </a>
        <div className="lab-breadcrumb">
          <a href="/"><ArrowLeft size={15} aria-hidden="true" /> Catalog</a>
          <span aria-hidden="true">/</span>
          <strong>{props.title}</strong>
        </div>
        <span className="lab-category">{props.category}</span>
      </header>

      <div className="lab-workspace">
        <aside className="lab-controls" aria-label={`${props.title} experiment controls`}>
          <p className="lab-kicker">{props.category} experiment</p>
          <h1>{props.title}</h1>
          <p className="lab-description">{props.description}</p>
          <div className="lab-control-list">{props.controls}</div>
        </aside>

        <section className="lab-stage" aria-label="Interactive experiment">
          <div className="lab-scene-tools" role="group" aria-label="Visualization options">{props.sceneControls}</div>
          <div className="lab-scene">{props.scene}</div>
          <div className="lab-playback">
            <button type="button" className="play-button" onClick={props.onPlayPause} aria-label={props.playing ? 'Pause experiment' : 'Play experiment'}>
              {props.playing ? <Pause size={17} weight="fill" /> : <Play size={17} weight="fill" />}
            </button>
            <button type="button" className="icon-button" onClick={props.onStep} aria-label="Advance experiment one step"><SkipForward size={17} /></button>
            <label>
              <span className="sr-only">Playback speed</span>
              <select value={props.speed} onChange={(event) => props.onSpeedChange(Number(event.target.value))} aria-label="Playback speed">
                {[0.25, 0.5, 1, 2, 4].map((rate) => <option key={rate} value={rate}>{rate}×</option>)}
              </select>
            </label>
            <label className="lab-time-control">
              <span className="sr-only">Experiment time</span>
              <input type="range" min={0} max={props.duration} step={props.duration / 300} value={props.time} onChange={(event) => props.onScrub(Number(event.target.value))} aria-label="Experiment time" />
            </label>
            <output className="lab-time mono">{props.timeLabel ?? `t = ${props.time.toFixed(2)} s`}</output>
            <button type="button" className="text-button" onClick={props.onReset}><ArrowCounterClockwise size={14} /> Reset</button>
          </div>
        </section>

        <aside className="lab-information" aria-label="Measurements and learning">
          <div className="lab-mode-tabs" role="tablist" aria-label="Learning mode">
            {modes.map((mode) => (
              <button type="button" role="tab" aria-selected={props.mode === mode} className={props.mode === mode ? 'is-selected' : ''} key={mode} onClick={() => props.onModeChange(mode)}>
                {mode}
              </button>
            ))}
          </div>
          <section className="lab-info-panel" aria-label="Live measurements">
            <span className="lab-section-label">Measurements</span>
            <dl className="lab-measurements">
              {props.measurements.map((item) => (
                <div key={item.label}>
                  <dt>{item.label}</dt>
                  <dd>{item.value}{item.unit ? ` ${item.unit}` : ''}</dd>
                </div>
              ))}
            </dl>
          </section>
          <section className="lab-info-panel">
            <span className="lab-section-label">Governing relationship</span>
            <EquationDisplay expression={props.equation} label={props.equationLabel} />
          </section>
          <section className="lab-info-panel lab-learning-content" aria-live="polite">
            {props.learningContent}
          </section>
          <details className="lab-assumptions">
            <summary>Assumptions and limits</summary>
            <p>{props.assumptions}</p>
          </details>
        </aside>
      </div>
    </main>
  )
}
