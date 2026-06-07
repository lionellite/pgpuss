import { motion } from 'framer-motion'
import { defaultTransition, fadeInUp } from './motion'

export const MotionDiv = motion.div
export const MotionSection = motion.section
export const MotionArticle = motion.article

export const revealProps = {
  initial: 'hidden',
  whileInView: 'visible',
  viewport: { once: true, margin: '-40px' },
  variants: fadeInUp,
  transition: defaultTransition,
}
