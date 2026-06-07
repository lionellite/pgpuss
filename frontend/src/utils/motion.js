/** Préférences d'animation — respect WCAG 2.1 (prefers-reduced-motion) */

export function prefersReducedMotion() {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

export function motionDuration(defaultMs = 350) {
  return prefersReducedMotion() ? 0 : defaultMs / 1000
}

export const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
}

export const fadeIn = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
}

export const staggerContainer = {
  hidden: {},
  visible: {
    transition: { staggerChildren: prefersReducedMotion() ? 0 : 0.08 },
  },
}

export const defaultTransition = {
  duration: motionDuration(350),
  ease: [0.25, 0.1, 0.25, 1],
}
