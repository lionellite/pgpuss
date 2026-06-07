import React from 'react'
import { motion } from 'framer-motion'
import { fadeInUp, defaultTransition } from '../../utils/motion'

export default function KpiCard({ label, value, icon, color = 'var(--color-primary)', index = 0 }) {
  return (
    <motion.div
      className="kpi-card"
      style={{ borderLeftColor: color }}
      variants={fadeInUp}
      initial="hidden"
      animate="visible"
      transition={{ ...defaultTransition, delay: index * 0.05 }}
    >
      <div className="kpi-card__head">
        <span className="kpi-card__icon" style={{ color }} aria-hidden="true">{icon}</span>
        <span className="kpi-card__label">{label}</span>
      </div>
      <div className="kpi-card__value" aria-label={`${label} : ${value}`}>{value}</div>
    </motion.div>
  )
}
