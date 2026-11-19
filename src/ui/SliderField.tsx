import * as Slider from '@radix-ui/react-slider'
import { ValueBox } from './ValueBox'

interface SliderFieldProps {
  label: string
  variable: string
  unit: string
  value: number
  min: number
  max: number
  step: number
  onChange: (value: number) => void
  resetValue: number
  displayValue?: string
}

export function SliderField({
  label, variable, unit, value, min, max, step, onChange, resetValue, displayValue,
}: SliderFieldProps) {
  return (
    <div className="slider-field">
      <div className="slider-field__head">
        <label className="slider-field__label" htmlFor={`value-${variable}`}>
          <span>{label}</span>
          <span className="math-variable">{variable}</span>
        </label>
        <ValueBox label={variable} unit={unit} value={value} min={min} max={max} step={step} onChange={onChange} />
      </div>
      <Slider.Root
        className="range-slider"
        min={min}
        max={max}
        step={step}
        value={[value]}
        onValueChange={([nextValue]) => onChange(nextValue)}
        aria-label={`${label} (${variable})`}
        aria-valuetext={`${displayValue ?? value} ${unit}`}
      >
        <Slider.Track className="range-slider__track">
          <Slider.Range className="range-slider__range" />
        </Slider.Track>
        <Slider.Thumb className="range-slider__thumb" aria-label={`${label} slider`} />
      </Slider.Root>
      <div className="slider-field__foot">
        <span>{min} {unit}</span>
        <button
          type="button"
          className="text-button"
          onClick={() => onChange(resetValue)}
          aria-label={`Reset ${label}`}
        >
          Reset
        </button>
        <span>{max} {unit}</span>
      </div>
    </div>
  )
}
