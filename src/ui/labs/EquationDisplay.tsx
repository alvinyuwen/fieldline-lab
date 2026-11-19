import katex from 'katex'
import { useMemo } from 'react'

export function EquationDisplay({ expression, label }: { expression: string; label: string }) {
  const html = useMemo(() => katex.renderToString(expression, { throwOnError: false, trust: false }), [expression])
  return <div className="lab-equation" aria-label={label} dangerouslySetInnerHTML={{ __html: html }} />
}
