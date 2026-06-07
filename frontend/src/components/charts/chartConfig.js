/** Palette Recharts — Sovereign Health Governance (Stitch) */

export const CHART_COLORS = [
  '#004c4c', // primary
  '#006666', // primary-container
  '#006e1c', // secondary
  '#1976d2', // priority-p4
  '#f57c00', // priority-p2
  '#6f7979', // text-muted
  '#d32f2f', // accent
  '#fbc02d', // priority-p3
]

export const PRIORITY_COLORS = ['#d32f2f', '#f57c00', '#fbc02d', '#1976d2', '#78909c']

export const STATUS_LABELS = {
  SOUMISE: 'Soumise',
  ACCUSEE: 'Accusée',
  INSTRUITE: 'Instruite',
  AFFECTEE: 'Affectée',
  EN_TRAITEMENT: 'En traitement',
  RESOLUE: 'Résolue',
  ESCALADEE: 'Escaladée',
  ARBITREE: 'Arbitrée',
  CLOTUREE: 'Clôturée',
  REJETEE: 'Rejetée',
}

export const chartAxisStyle = {
  tick: { fill: '#3f4948', fontSize: 12 },
  axisLine: { stroke: '#e2e8f0' },
}

export const chartGridStyle = {
  strokeDasharray: '3 3',
  stroke: '#e2e8f0',
}
