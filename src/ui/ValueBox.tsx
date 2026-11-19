import { useEffect, useRef, useState } from 'react'
import { parseFiniteNumber } from '../core/units'

interface ValueBoxProps {
  label: string
  unit: string
  value: number
  min: number
  max: number
  step: number
  onChange: (value: number) => void
}

export function ValueBox({ label, unit, value, min, max, step, onChange }: ValueBoxProps) {
  const [draft, setDraft] = useState(String(value))
  const [error, setError] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  useEffect(() => {
    if (document.activeElement !== inputRef.current) setDraft(String(value))
  }, [value])

  const commitDraft = () => {
    const parsed = parseFiniteNumber(draft)
    if (parsed === null || parsed < min || parsed > max) {
      setError(`Enter a value from ${min} to ${max} ${unit}.`)
      return
    }
    setError('')
    onChange(parsed)
  }

  return (
    <div className="value-box">
      <input
        ref={inputRef}
        id={`value-${label}`}
        aria-label={`${label} value in ${unit}`}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `value-${label}-error` : undefined}
        type="number"
        inputMode="decimal"
        min={min}
        max={max}
        step={step}
        value={draft}
        onChange={(event) => {
          setDraft(event.target.value)
          const parsed = parseFiniteNumber(event.target.value)
          if (parsed !== null && parsed >= min && parsed <= max) {
            setError('')
            onChange(parsed)
          }
        }}
        onBlur={commitDraft}
        onKeyDown={(event) => {
          if (event.key === 'Enter') event.currentTarget.blur()
          if (event.key === 'Escape') {
            setDraft(String(value))
            setError('')
          }
        }}
      />
      <span>{unit}</span>
      {error && <span className="value-box__error" id={`value-${label}-error`} role="alert">{error}</span>}
    </div>
  )
}
