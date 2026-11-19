import { describe, expect, it } from 'vitest'
import { createRK4Sampler, integrateRK4 } from '../src/core/model-math'

describe('shared numerical integration', () => {
  it('integrates an exponential state with fourth-order accuracy', () => {
    const [value] = integrateRK4([1], ([state]) => [state], 1)
    expect(value).toBeCloseTo(Math.E, 9)
  })

  it('reuses fixed-step trajectory states for forward and backward sampling', () => {
    let derivativeCalls = 0
    const sampleAt = createRK4Sampler(
      () => [1],
      ([value]) => {
        derivativeCalls += 1
        return [value]
      },
      0.01,
    )

    expect(sampleAt({}, 0.5)[0]).toBeCloseTo(Math.exp(0.5), 8)
    const callsAfterFirstSample = derivativeCalls
    expect(sampleAt({}, 0.75)[0]).toBeCloseTo(Math.exp(0.75), 8)
    expect(derivativeCalls - callsAfterFirstSample).toBe(100)
    const callsAfterForwardSample = derivativeCalls
    expect(sampleAt({}, 0.2)[0]).toBeCloseTo(Math.exp(0.2), 8)
    expect(derivativeCalls).toBe(callsAfterForwardSample)
  })

  it('rejects invalid sample times and integration steps', () => {
    const sampleAt = createRK4Sampler(() => [0], () => [1], 0.01)
    expect(() => sampleAt({}, -1)).toThrow(RangeError)
    expect(() => createRK4Sampler(() => [0], () => [1], 0)).toThrow(RangeError)
  })
})
