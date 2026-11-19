import { beforeEach, describe, expect, it } from 'vitest'
import { initialControls, useSimStore } from '../src/core/store'
import { DEFAULT_TIME_STEP } from '../src/core/constants'

describe('simulation state', () => {
  beforeEach(() => useSimStore.getState().reset())

  it('switches between circular and helical starting conditions', () => {
    useSimStore.getState().setMode('Y1')
    expect(useSimStore.getState().controls.pitch).toBe(55)
    expect(useSimStore.getState().controls.mode).toBe('Y1')
    expect(useSimStore.getState().particle.velocity[2]).toBeGreaterThan(0)
    useSimStore.getState().setMode('G12')
    expect(useSimStore.getState().controls.pitch).toBe(90)
    expect(useSimStore.getState().particle.velocity[2]).toBeCloseTo(0)
  })

  it('scrubs to a deterministic particle state and pauses playback', () => {
    const store = useSimStore.getState()
    store.setPlaying(true)
    store.scrub(0.75)
    const first = useSimStore.getState().particle
    expect(useSimStore.getState().elapsed).toBe(0.75)
    expect(useSimStore.getState().playing).toBe(false)
    useSimStore.getState().scrub(0)
    expect(useSimStore.getState().particle.position).toEqual([0, 0, 0])
    useSimStore.getState().scrub(0.75)
    expect(useSimStore.getState().particle).toEqual(first)
  })

  it('steps once by the fixed timestep and global reset restores controls', () => {
    useSimStore.getState().setControls({ speed: 2 })
    useSimStore.getState().step()
    expect(useSimStore.getState().elapsed).toBe(DEFAULT_TIME_STEP)
    useSimStore.getState().reset()
    expect(useSimStore.getState().controls).toEqual(initialControls)
    expect(useSimStore.getState().elapsed).toBe(0)
  })
})
