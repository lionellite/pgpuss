import React from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { FiArrowRight } from 'react-icons/fi'
import { fadeInUp, defaultTransition } from '../../utils/motion'

const cardMotion = {
  variants: fadeInUp,
  initial: 'hidden',
  whileInView: 'visible',
  viewport: { once: true },
  whileHover: { borderColor: 'var(--border-strong)' },
}

export default function ServiceCard({
  to,
  href,
  icon: Icon,
  title,
  description,
  cta,
  index = 0,
  external = false,
}) {
  const content = (
    <>
      <div className="action-card__icon" aria-hidden="true">
        <Icon />
      </div>
      <h2 className="action-card__title">{title}</h2>
      <p className="action-card__desc">{description}</p>
      <span className="action-card__cta">
        {cta} <FiArrowRight aria-hidden />
      </span>
    </>
  )

  const transition = { ...defaultTransition, delay: index * 0.1 }

  if (href) {
    return (
      <motion.a
        {...cardMotion}
        transition={transition}
        className="glass-card action-card"
        href={href}
        target={external ? '_blank' : undefined}
        rel={external ? 'noopener noreferrer' : undefined}
      >
        {content}
      </motion.a>
    )
  }

  return (
    <motion.div {...cardMotion} transition={transition} className="glass-card action-card">
      <Link to={to} className="action-card__link">
        {content}
      </Link>
    </motion.div>
  )
}
