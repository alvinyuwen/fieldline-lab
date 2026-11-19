import { useEffect, useMemo, useRef } from 'react'
import uPlot from 'uplot'
import 'uplot/dist/uPlot.min.css'
import { analyticState, parametersFromControls } from '../core/cyclotron'
import { cyclotronPeriod } from '../core/cyclotron'
import { formatSI } from '../core/units'
import { useSimStore } from '../core/store'

export function GraphPanel() {
  const hostRef = useRef<HTMLDivElement>(null)
  const plotRef = useRef<uPlot | null>(null)
  const elapsed = useSimStore((state) => state.elapsed)
  const controls = useSimStore((state) => state.controls)
  const scrub = useSimStore((state) => state.scrub)
  const parameters = useMemo(() => parametersFromControls(
    controls.charge, controls.mass, controls.field, controls.speed, controls.pitch,
  ), [controls])
  const period = cyclotronPeriod(controls.charge, controls.field, controls.mass)
  const range = Number.isFinite(period) ? period : 6
  const rangeEnd = Math.max(range, elapsed + range / 4)
  const rangeStart = Math.max(0, rangeEnd - range)
  const data = useMemo<uPlot.AlignedData>(() => {
    const times = new Float64Array(121)
    const positions = new Float64Array(121)
    for (let index = 0; index <= 120; index += 1) {
      const time = rangeStart + ((rangeEnd - rangeStart) * index) / 120
      times[index] = time
      positions[index] = analyticState(parameters, time).position[0]
    }
    return [times, positions]
  }, [parameters, rangeEnd, rangeStart])

  useEffect(() => {
    if (!hostRef.current) return
    const options: uPlot.Options = {
      width: hostRef.current.clientWidth,
      height: 190,
      padding: [10, 8, 0, 0],
      legend: { show: false },
      cursor: { show: true, x: true, y: false, points: { show: false } },
      scales: { x: { time: false } },
      axes: [
        {
          stroke: '#5B6B82',
          grid: { stroke: 'rgba(142, 160, 184, 0.1)', width: 1 },
          ticks: { stroke: 'rgba(142, 160, 184, 0.12)', width: 1 },
          font: '10px "Geist Mono", monospace',
          values: (_plot, ticks) => ticks.map((tick) => Number(tick).toPrecision(2)),
        },
        {
          side: 3,
          stroke: '#5B6B82',
          grid: { stroke: 'rgba(142, 160, 184, 0.1)', width: 1 },
          ticks: { stroke: 'rgba(142, 160, 184, 0.12)', width: 1 },
          font: '10px "Geist Mono", monospace',
          values: (_plot, ticks) => ticks.map((tick) => Number(tick).toPrecision(2)),
        },
      ],
      series: [
        {},
        { stroke: '#22D3EE', width: 2, points: { show: false } },
      ],
    }
    const plot = new uPlot(options, data, hostRef.current)
    plotRef.current = plot
    const observer = new ResizeObserver(() => {
      if (hostRef.current) plot.setSize({ width: hostRef.current.clientWidth, height: 190 })
    })
    observer.observe(hostRef.current)
    return () => {
      observer.disconnect()
      plot.destroy()
      plotRef.current = null
    }
  }, [])

  useEffect(() => {
    plotRef.current?.setData(data)
  }, [data])

  useEffect(() => {
    const plot = plotRef.current
    if (!plot) return
    const x = Math.max(rangeStart, Math.min(rangeEnd, elapsed))
    plot.setCursor({ left: plot.valToPos(x, 'x'), top: 0 })
  }, [elapsed, rangeEnd, rangeStart])

  return (
    <div className="graph-content">
      <div className="section-heading section-heading--compact">
        <div>
          <p className="eyebrow">Position over time</p>
          <h2>Horizontal position</h2>
        </div>
        <span className="graph-axis">x(t) · m</span>
      </div>
      <div className="graph-plot" ref={hostRef} aria-label="Graph of horizontal position in meters against time in seconds" />
      <div className="graph-axes" aria-hidden="true">
        <span>{formatSI(rangeStart)} s</span>
        <span>Time, t (s)</span>
        <span>{formatSI(rangeEnd)} s</span>
      </div>
      <label className="scrubber" htmlFor="graph-time">
        <span>Simulation time</span>
        <input
          id="graph-time"
          aria-label="Scrub simulation time"
          type="range"
          min={rangeStart}
          max={rangeEnd}
          step={Math.max((rangeEnd - rangeStart) / 600, 1e-9)}
          value={Math.max(rangeStart, Math.min(elapsed, rangeEnd))}
          onChange={(event) => scrub(Number(event.target.value))}
        />
        <output>{formatSI(Math.min(elapsed, range))} s</output>
      </label>
      <p className="graph-caption">Drag the time marker to inspect the particle on the path.</p>
    </div>
  )
}
