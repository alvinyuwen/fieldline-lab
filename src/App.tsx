import { lazy, Suspense, useEffect } from 'react'
import { findCatalogEntry, findSimulationDefinition } from './registry'
import { CatalogPage } from './ui/CatalogPage'
import { SimLayout } from './ui/SimLayout'

const ModelSimLayout = lazy(() => import('./ui/ModelSimLayout').then((module) => ({ default: module.ModelSimLayout })))

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
