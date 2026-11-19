import katex from 'katex'
import { ArrowRight } from '@phosphor-icons/react'
import { useMemo } from 'react'
import { acceleration, parametersFromControls } from '../core/cyclotron'
import { cross, magnitude } from '../core/vector'
import { formatSI } from '../core/units'
import { useSimStore } from '../core/store'

const latexNumber = (value: number): string => {
  const absolute = Math.abs(value)
  if (value === 0) return '0'
  if (absolute < 0.001 || absolute >= 100_000) {
    const [mantissa, exponent] = value.toExponential(2).split('e')
    return `${Number(mantissa)}\\times 10^{${Number(exponent)}}`
  }
  return Number(value.toPrecision(3)).toString()
}

export function EquationPanel() {
  const controls = useSimStore((state) => state.controls)
  const level = useSimStore((state) => state.level)
  const data = useMemo(() => {
    const parameters = parametersFromControls(
      controls.charge, controls.mass, controls.field, controls.speed, controls.pitch,
    )
    const forceVector = cross(parameters.initialVelocity, parameters.magneticField)
    const forceMagnitude = Math.abs(controls.charge) * magnitude(forceVector)
    const accel = acceleration(parameters.initialVelocity, parameters)
    const formula = katex.renderToString(String.raw`\vec{F}=q(\vec{v}\times\vec{B})`, {
      throwOnError: false,
      trust: false,
    })
    const substitution = katex.renderToString(
      String.raw`\lvert F\rvert=\lvert q\rvert vB\sin\theta=${latexNumber(Math.abs(controls.charge))}\times${latexNumber(controls.speed)}\times${latexNumber(controls.field)}\times\sin(${controls.pitch}^\circ)=${latexNumber(forceMagnitude)}\ \mathrm{N}`,
      { throwOnError: false, trust: false },
    )
    return { forceVector, forceMagnitude, accel, formula, substitution }
  }, [controls])

  const directionText = data.forceMagnitude === 0
    ? 'No magnetic force acts on this particle.'
    : controls.charge > 0
      ? 'For a positive charge, the force points with v × B.'
      : 'For a negative charge, the force points opposite to v × B.'

  return (
    <div className="equation-content">
      <div className="section-heading section-heading--compact">
        <div>
          <p className="eyebrow">Live relationship</p>
          <h2>Magnetic force</h2>
        </div>
        <span className="quantity-chip" style={{ color: 'var(--force)' }}>F</span>
      </div>
      <div
        className="equation-katex"
        aria-label="Force equals charge times velocity cross magnetic field"
        dangerouslySetInnerHTML={{ __html: data.formula }}
      />
      <div
        className="equation-katex equation-katex--substitution"
        aria-label={`Force magnitude is ${formatSI(data.forceMagnitude)} newtons`}
        dangerouslySetInnerHTML={{ __html: data.substitution }}
      />
      <div className="equation-result">
        <div>
          <span className="muted-label">Force magnitude</span>
          <strong>{formatSI(data.forceMagnitude)} <small>N</small></strong>
        </div>
        <ArrowRight size={16} aria-hidden="true" />
        <div>
          <span className="muted-label">Acceleration</span>
          <strong>{formatSI(magnitude(data.accel))} <small>m/s²</small></strong>
        </div>
      </div>
      <p className="equation-note">{directionText}</p>
      {level !== 'Intuition' && (
        <div className="equation-detail">
          {level === 'Equation' && (
            <p><span className="math-variable">|F|</span> = |q| v B sin θ = {formatSI(data.forceMagnitude)} N</p>
          )}
          {level === 'Derivation' && (
            <p>The force is perpendicular to both v and B. It changes direction, not speed. Here v × B = ({data.forceVector.map(formatSI).join(', ')}) in m·T/s.</p>
          )}
          {level === 'Advanced' && (
            <p>ω = qB/m = {formatSI((controls.charge * controls.field) / controls.mass)} rad/s. The signed frequency sets rotation direction; |ω| sets the cyclotron period.</p>
          )}
        </div>
      )}
    </div>
  )
}
