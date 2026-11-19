import { Pause, Play, SkipForward, ArrowCounterClockwise } from '@phosphor-icons/react'
import { formatSI } from '../core/units'
import { useSimStore } from '../core/store'

export function PlaybackBar() {
  const playing = useSimStore((state) => state.playing)
  const elapsed = useSimStore((state) => state.elapsed)
  const speed = useSimStore((state) => state.playbackSpeed)
  const setPlaying = useSimStore((state) => state.setPlaying)
  const setPlaybackSpeed = useSimStore((state) => state.setPlaybackSpeed)
  const step = useSimStore((state) => state.step)
  const reset = useSimStore((state) => state.reset)

  return (
    <div className="playback-bar" role="toolbar" aria-label="Simulation playback">
      <button
        type="button"
        className="play-button"
        onClick={() => setPlaying(!playing)}
        aria-label={playing ? 'Pause simulation' : 'Play simulation'}
      >
        {playing ? <Pause size={15} weight="fill" /> : <Play size={15} weight="fill" />}
      </button>
      <button type="button" className="icon-button" onClick={step} aria-label="Advance one fixed time step" title="Step one time step">
        <SkipForward size={15} />
      </button>
      <button type="button" className="icon-button" onClick={reset} aria-label="Reset simulation">
        <ArrowCounterClockwise size={15} />
      </button>
      <span className="playback-divider" />
      <label className="speed-control">
        <span>Speed</span>
        <select
          value={speed}
          aria-label="Playback speed"
          onChange={(event) => setPlaybackSpeed(Number(event.target.value))}
        >
          <option value={0.25}>0.25×</option>
          <option value={0.5}>0.5×</option>
          <option value={1}>1×</option>
          <option value={2}>2×</option>
        </select>
      </label>
      <div className="elapsed-time" aria-live="polite">
        <span>t</span>
        <output>{formatSI(elapsed)} s</output>
      </div>
    </div>
  )
}
