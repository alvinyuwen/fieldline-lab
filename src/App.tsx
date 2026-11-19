import { lazy, Suspense, useEffect } from 'react'
import { findCatalogEntry, findSimulationDefinition } from './registry'
import { CatalogPage } from './ui/CatalogPage'
import { SimLayout } from './ui/SimLayout'

const ModelSimLayout = lazy(() => import('./ui/ModelSimLayout').then((module) => ({ default: module.ModelSimLayout })))
const ElectricFieldsLab = lazy(() => import('./ui/labs/ElectricFieldsLab'))
const MagneticWireLab = lazy(() => import('./ui/labs/MagneticWireLab'))
const SolenoidLab = lazy(() => import('./ui/labs/SolenoidLab'))
const CyclotronLab = lazy(() => import('./ui/labs/CyclotronLab'))
const MotorLab = lazy(() => import('./ui/labs/MotorLab'))
const InductionLab = lazy(() => import('./ui/labs/InductionLab'))

export default function App() {
  const requested = new URLSearchParams(window.location.search).get('sim')
  const entry = requested ? findCatalogEntry(requested) : undefined
  useEffect(() => {
    document.title = entry ? `Fieldline Lab | ${entry.title}` : 'Fieldline Lab | Physics and Math Simulations'
    const description = document.querySelector<HTMLMetaElement>('meta[name="description"]')
    if (description) description.content = entry?.description ?? 'Explore interactive physics and mathematics simulations from Grade 12 through university.'
  }, [entry?.description, entry?.title])
  if (!requested) return <CatalogPage />
  if (requested === 'charged-particle-magnetic-field') return <SimLayout />
  if (requested === 'electric-fields-lab') {
    return <Suspense fallback={<div className="scene-loading" role="status">Preparing electric field laboratory…</div>}><ElectricFieldsLab /></Suspense>
  }
  if (requested === 'magnetic-wire-lab') {
    return <Suspense fallback={<div className="scene-loading" role="status">Preparing magnetic field laboratory…</div>}><MagneticWireLab /></Suspense>
  }
  if (requested === 'solenoid-lab') {
    return <Suspense fallback={<div className="scene-loading" role="status">Preparing solenoid laboratory…</div>}><SolenoidLab /></Suspense>
  }
  if (requested === 'cyclotron-lab') {
    return <Suspense fallback={<div className="scene-loading" role="status">Preparing cyclotron laboratory…</div>}><CyclotronLab /></Suspense>
  }
  if (requested === 'dc-motor-lab') {
    return <Suspense fallback={<div className="scene-loading" role="status">Preparing DC motor laboratory…</div>}><MotorLab /></Suspense>
  }
  if (requested === 'induction-lab') {
    return <Suspense fallback={<div className="scene-loading" role="status">Preparing induction laboratory…</div>}><InductionLab /></Suspense>
  }
  const definition = findSimulationDefinition(requested)
  if (definition && findCatalogEntry(requested)) {
    return (
      <Suspense fallback={<div className="scene-loading" role="status">Preparing simulation workspace…</div>}>
        <ModelSimLayout definition={definition} />
      </Suspense>
    )
  }
  return <CatalogPage />
}
