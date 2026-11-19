export type SIUnit = 'C' | 'kg' | 'T' | 'm/s' | 'deg' | 'm' | 's' | 'N'

export const formatSI = (value: number, significantDigits = 3): string => {
  if (!Number.isFinite(value)) return 'undefined'
  if (value === 0) return '0'
  const absolute = Math.abs(value)
  if (absolute >= 0.001 && absolute < 100_000) {
    return new Intl.NumberFormat('en', { maximumSignificantDigits: significantDigits }).format(value)
  }
  return value.toExponential(significantDigits - 1).replace('e', ' × 10^')
}

export const parseFiniteNumber = (raw: string): number | null => {
  if (!raw.trim()) return null
  const parsed = Number(raw)
  return Number.isFinite(parsed) ? parsed : null
}
