import React from 'react'
import { motion } from 'framer-motion'
import { FiChevronDown } from 'react-icons/fi'
import { defaultTransition } from '../../utils/motion'

export default function HeroScrollCue() {
  return (
    <motion.div
      className="hero-scroll-cue"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ ...defaultTransition, delay: 0.6 }}
      aria-hidden="true"
    >
      <motion.span
        animate={{ y: [0, 6, 0] }}
        transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
      >
        <FiChevronDown />
      </motion.span>
    </motion.div>
  )
}
