import { ArrowCounterClockwise, Check, CirclesThreePlus } from '@phosphor-icons/react'
import { presets } from '../content/presets'
import { formatSI } from '../core/units'
import { useSimStore } from '../core/store'
import { SliderField } from './SliderField'

export function ControlsPanel() {
  const controls = useSimStore((state) => state.controls)
  const setControls = useSimStore((state) => state.setControls)
  const setMode = useSimStore((state) => state.setMode)
  const reset = useSimStore((state) => state.reset)
  const setPlaying = useSimStore((state) => state.setPlaying)

  const applyPreset = (updates: Partial<typeof controls>) => {
    setControls(updates)
    setPlaying(true)
  }

  return (
    <div className="control-stack">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Experiment</p>
          <h1>Magnetic motion</h1>
        </div>
        <button
          type="button"
          className="icon-button"
          onClick={reset}
          aria-label="Reset simulation"
          title="Reset simulation"
        >
          <ArrowCounterClockwise size={17} />
        </button>
      </div>
      <p className="controls-intro">Change a parameter and watch the path respond.</p>

      <div className="mode-selector" role="group" aria-label="Learning level">
        <button
          type="button"
          className={controls.mode === 'G12' ? 'is-selected' : ''}
          onClick={() => setMode('G12')}
          aria-pressed={controls.mode === 'G12'}
        >
          <span className="mode-selector__code">G12</span>
          <span>Circular</span>
        </button>
        <button
          type="button"
          className={controls.mode === 'Y1' ? 'is-selected' : ''}
          onClick={() => setMode('Y1')}
          aria-pressed={controls.mode === 'Y1'}
        >
          <span className="mode-selector__code">Y1</span>
          <span>Helical</span>
        </button>
      </div>

      <div className="control-fields">
        <SliderField
          label="Charge magnitude"
          variable="|q|"
          unit="C"
          value={Math.abs(controls.charge)}
          min={0}
          max={2}
          step={0.01}
          resetValue={1}
          displayValue={formatSI(Math.abs(controls.charge))}
          onChange={(value) => setControls({ charge: Math.sign(controls.charge || 1) * value })}
        />
        <button
          type="button"
          className={`charge-sign ${controls.charge < 0 ? 'charge-sign--negative' : ''}`}
          onClick={() => setControls({ charge: controls.charge === 0 ? -1 : -controls.charge })}
          aria-label={`Charge is ${controls.charge < 0 ? 'negative' : 'positive'}. Reverse charge sign`}
        >
          <span>{controls.charge < 0 ? '−' : '+'}</span>
          <span>{controls.charge < 0 ? 'Negative charge' : 'Positive charge'}</span>
        </button>
        <SliderField
          label="Mass"
          variable="m"
          unit="kg"
          value={controls.mass}
          min={0.1}
          max={2}
          step={0.01}
          resetValue={1}
          displayValue={formatSI(controls.mass)}
          onChange={(mass) => setControls({ mass })}
        />
        <SliderField
          label="Magnetic field"
          variable="B"
          unit="T"
          value={controls.field}
          min={0}
          max={2}
          step={0.01}
          resetValue={1}
          displayValue={formatSI(controls.field)}
          onChange={(field) => setControls({ field })}
        />
        <SliderField
          label="Speed"
          variable="v"
          unit="m/s"
          value={controls.speed}
          min={0}
          max={4}
          step={0.01}
          resetValue={1}
          displayValue={formatSI(controls.speed)}
          onChange={(speed) => setControls({ speed })}
        />
        <SliderField
          label="Pitch angle"
          variable="θ"
          unit="deg"
          value={controls.pitch}
          min={0}
          max={90}
          step={1}
          resetValue={controls.mode === 'G12' ? 90 : 55}
          displayValue={`${controls.pitch}°`}
          onChange={(pitch) => setControls({ pitch })}
        />
      </div>

      <div className="preset-block">
        <div className="subsection-title">
          <CirclesThreePlus size={15} aria-hidden="true" />
          <span>Starting points</span>
        </div>
        <div className="preset-list">
          {presets.map((preset) => (
            <button
              type="button"
              key={preset.id}
              className="preset-button"
              onClick={() => applyPreset(preset.controls)}
              title={preset.description}
            >
              <span>{preset.label}</span>
              <Check size={14} aria-hidden="true" />
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
