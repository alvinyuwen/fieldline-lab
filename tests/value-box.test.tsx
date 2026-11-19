import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { ValueBox } from '../src/ui/ValueBox'

describe('editable parameter values', () => {
  it('accepts finite values within the physical range', () => {
    const onChange = vi.fn()
    render(<ValueBox label="speed" unit="m/s" value={1} min={0} max={4} step={0.1} onChange={onChange} />)
    fireEvent.change(screen.getByRole('spinbutton'), { target: { value: '2.5' } })
    expect(onChange).toHaveBeenCalledWith(2.5)
  })

  it('surfaces invalid values without applying them', () => {
    const onChange = vi.fn()
    render(<ValueBox label="speed" unit="m/s" value={1} min={0} max={4} step={0.1} onChange={onChange} />)
    const input = screen.getByRole('spinbutton')
    fireEvent.change(input, { target: { value: '5' } })
    fireEvent.blur(input)
    expect(onChange).not.toHaveBeenCalled()
    expect(screen.getByRole('alert')).toHaveTextContent('Enter a value from 0 to 4 m/s.')
    expect(input).toHaveAttribute('aria-invalid', 'true')
  })
})
