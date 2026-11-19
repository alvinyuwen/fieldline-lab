import { ArrowRight, MagnifyingGlass } from '@phosphor-icons/react'
import { useMemo, useState } from 'react'
import { simulationRegistry } from '../registry'
import { useSiteStore, type RenderQuality } from '../core/site-store'

const levels = ['All levels', 'G12', 'Y1', 'Y2', 'Y3', 'Y4'] as const

export function CatalogPage() {
  const [query, setQuery] = useState('')
  const [topic, setTopic] = useState('All topics')
  const [level, setLevel] = useState<(typeof levels)[number]>('All levels')
  const visited = useSiteStore((state) => state.visited)
  const completed = useSiteStore((state) => state.completed)
  const quality = useSiteStore((state) => state.quality)
  const setQuality = useSiteStore((state) => state.setQuality)
  const topics = useMemo(() => ['All topics', ...new Set(simulationRegistry.map((simulation) => simulation.category))], [])
  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase()
    return simulationRegistry.filter((simulation) => (
      (topic === 'All topics' || simulation.category === topic)
      && (level === 'All levels' || simulation.levels.includes(level))
      && (!needle || `${simulation.title} ${simulation.description} ${simulation.category}`.toLowerCase().includes(needle))
    ))
  }, [level, query, topic])

  return (
    <main className="catalog-page">
      <header className="catalog-header">
        <a className="brand-lockup" href="/" aria-label="Fieldline Lab home">
          <span className="brand-mark" aria-hidden="true"><i /><i /><i /></span>
          <span>fieldline<span className="brand-lockup__lab">lab</span></span>
        </a>
        <div className="catalog-header__tools">
          <label className="quality-control">
            <span>Rendering</span>
            <select aria-label="Rendering quality" value={quality} onChange={(event) => setQuality(event.target.value as RenderQuality)}>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </label>
          <span className="catalog-progress">{completed.length} completed</span>
        </div>
      </header>

      <section className="catalog-intro" aria-labelledby="catalog-title">
        <div>
          <p className="catalog-kicker">Physics and mathematics</p>
          <h1 id="catalog-title">Build intuition by changing the model.</h1>
          <p>Explore interactive simulations from senior high school through university. No account required.</p>
        </div>
        <div className="catalog-intro__count" aria-label={`${simulationRegistry.length} simulations`}>
          <strong>{simulationRegistry.length}</strong>
          <span>interactive models</span>
        </div>
      </section>

      <section className="catalog-browser" aria-label="Simulation catalog">
        <div className="catalog-filters">
          <label className="catalog-search">
            <MagnifyingGlass size={17} aria-hidden="true" />
            <span className="sr-only">Search simulations</span>
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search simulations" />
          </label>
          <label>
            <span className="sr-only">Filter by topic</span>
            <select value={topic} onChange={(event) => setTopic(event.target.value)}>
              {topics.map((item) => <option key={item}>{item}</option>)}
            </select>
          </label>
          <label>
            <span className="sr-only">Filter by level</span>
            <select value={level} onChange={(event) => setLevel(event.target.value as (typeof levels)[number])}>
              {levels.map((item) => <option key={item}>{item}</option>)}
            </select>
          </label>
          <p className="catalog-result-count">{filtered.length} shown</p>
        </div>

        {filtered.length > 0 ? (
          <div className="simulation-list">
            {filtered.map((simulation) => (
              <a className="simulation-row" href={`/?sim=${encodeURIComponent(simulation.id)}`} key={simulation.id}>
                <span className="simulation-row__category">{simulation.category}</span>
                <span className="simulation-row__main">
                  <strong>{simulation.title}</strong>
                  <span>{simulation.description}</span>
                </span>
                <span className="simulation-row__levels" aria-label={`Levels: ${simulation.levels.join(', ')}`}>
                  {simulation.levels.map((item) => <i key={item}>{item}</i>)}
                </span>
                <span className="simulation-row__status">
                  {completed.includes(simulation.id) ? 'Completed' : visited.includes(simulation.id) ? 'Visited' : 'Explore'}
                  <ArrowRight size={17} aria-hidden="true" />
                </span>
              </a>
            ))}
          </div>
        ) : (
          <div className="catalog-empty">
            <strong>No simulations match those filters.</strong>
            <span>Try a broader topic, level, or search term.</span>
            <button type="button" onClick={() => { setQuery(''); setTopic('All topics'); setLevel('All levels') }}>Clear filters</button>
          </div>
        )}
      </section>

      <footer className="catalog-footer">
        <span>Fieldline Lab</span>
        <span>Idealized models, with assumptions shown inside each simulation.</span>
      </footer>
    </main>
  )
}
