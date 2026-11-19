export type LabPreviewKind = 'electric' | 'wire' | 'solenoid' | 'cyclotron' | 'motor' | 'induction'

export function LabPreview({ kind }: { kind: LabPreviewKind }) {
  return (
    <div className={`lab-preview lab-preview--${kind}`} aria-hidden="true">
      {kind === 'electric' && (
        <>
          <span className="preview-field preview-field--electric-outer" />
          <span className="preview-field preview-field--electric-inner" />
          <span className="preview-charge preview-charge--positive">+</span>
          <span className="preview-charge preview-charge--negative">−</span>
          <span className="preview-particle" />
        </>
      )}
      {kind === 'wire' && (
        <>
          <span className="preview-wire" />
          <span className="preview-wire-ring preview-wire-ring--one" />
          <span className="preview-wire-ring preview-wire-ring--two" />
          <span className="preview-current-arrow">↑</span>
          <span className="preview-compass"><i /></span>
        </>
      )}
      {kind === 'solenoid' && (
        <>
          <span className="preview-solenoid-field" />
          <span className="preview-solenoid-windings">{Array.from({ length: 11 }, (_, index) => <i key={index} />)}</span>
          <span className="preview-solenoid-core" />
          <span className="preview-pole preview-pole--north">N</span>
          <span className="preview-pole preview-pole--south">S</span>
        </>
      )}
      {kind === 'cyclotron' && (
        <>
          <span className="preview-cyclotron-dee preview-cyclotron-dee--left" />
          <span className="preview-cyclotron-dee preview-cyclotron-dee--right" />
          <span className="preview-cyclotron-gap" />
          <span className="preview-cyclotron-orbit" />
          <span className="preview-cyclotron-particle" />
        </>
      )}
      {kind === 'motor' && (
        <>
          <span className="preview-magnet preview-magnet--north">N</span>
          <span className="preview-magnet preview-magnet--south">S</span>
          <span className="preview-motor-coil" />
          <span className="preview-motor-shaft" />
          <span className="preview-motor-force">↑</span>
        </>
      )}
      {kind === 'induction' && (
        <>
          <span className="preview-induction-magnet"><i>S</i><i>N</i></span>
          <span className="preview-induction-coil" />
          <span className="preview-galvanometer"><i /></span>
          <span className="preview-induction-wire" />
        </>
      )}
    </div>
  )
}
