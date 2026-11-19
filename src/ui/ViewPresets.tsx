import { useSimStore } from '../core/store'
import type { ViewPreset } from '../registry'

const views: readonly ViewPreset[] = ['Top', 'Side', 'Front', 'Isometric']

export function ViewPresets() {
  const view = useSimStore((state) => state.view)
  const setView = useSimStore((state) => state.setView)
  const orthographic = useSimStore((state) => state.orthographic)
  const setOrthographic = useSimStore((state) => state.setOrthographic)

  return (
    <div className="scene-toolbar">
      <div className="view-tabs" role="group" aria-label="Camera view">
        {views.map((item) => (
          <button
            type="button"
            key={item}
            className={view === item ? 'is-selected' : ''}
            aria-pressed={view === item}
            onClick={() => setView(item)}
          >
            {item}
          </button>
        ))}
      </div>
      <button
        type="button"
        className={`view-toggle ${orthographic ? 'is-selected' : ''}`}
        onClick={() => setOrthographic(!orthographic)}
        aria-pressed={orthographic}
        aria-label={`Switch to ${orthographic ? 'perspective' : 'orthographic'} projection`}
      >
        Ortho
      </button>
    </div>
  )
}
