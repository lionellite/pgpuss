import React, { useEffect, useRef, useState } from 'react'
import { motion, useInView } from 'framer-motion'
import { defaultTransition } from '../../utils/motion'

function parseNumeric(value) {
  if (value == null || value === '—') return null
  const str = String(value)
  const match = str.match(/[\d.]+/)
  return match ? parseFloat(match[0]) : null
}

export default function AnimatedStat({ label, value, icon: Icon, suffix = '', index = 0 }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-20px' })
  const numeric = parseNumeric(value)
  const [display, setDisplay] = useState(value)

  useEffect(() => {
    if (!inView || numeric == null) {
      setDisplay(value)
      return
    }

    const duration = 800
    const start = performance.now()
    let frame

    const tick = (now) => {
      const progress = Math.min((now - start) / duration, 1)
      const eased = 1 - (1 - progress) ** 3
      const current = Math.round(numeric * eased * 10) / 10
      const formatted = Number.isInteger(numeric) ? Math.round(current) : current.toFixed(1)
      setDisplay(`${formatted}${suffix}`)
      if (progress < 1) frame = requestAnimationFrame(tick)
    }

    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [inView, numeric, value, suffix])

  return (
    <motion.div
      ref={ref}
      className="stat-card"
      initial={{ opacity: 0, y: 16 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ ...defaultTransition, delay: index * 0.08 }}
    >
      <div className="stat-card__icon" aria-hidden="true">
        <Icon />
      </div>
      <div className="stat-value" aria-label={`${label} : ${value}`}>{display}</div>
      <div className="stat-label">{label}</div>
    </motion.div>
  )
}
