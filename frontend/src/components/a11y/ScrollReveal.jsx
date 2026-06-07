import React from 'react'
import { motion } from 'framer-motion'
import { fadeInUp, defaultTransition } from '../../utils/motion'

export default function ScrollReveal({
  children,
  as: Tag = motion.div,
  className,
  delay = 0,
  ...rest
}) {
  return (
    <Tag
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-32px' }}
      variants={fadeInUp}
      transition={{ ...defaultTransition, delay }}
      {...rest}
    >
      {children}
    </Tag>
  )
}
