import React, { createContext, useContext, useEffect, useState } from 'react'
import { MotionConfig } from 'framer-motion'

const ReducedMotionContext = createContext(false)

export function useReducedMotion() {
  return useContext(ReducedMotionContext)
}

export default function MotionProvider({ children }) {
  const [reduced, setReduced] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReduced(mq.matches)
    const handler = (e) => setReduced(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  return (
    <ReducedMotionContext.Provider value={reduced}>
      <MotionConfig reducedMotion={reduced ? 'always' : 'user'}>
        {children}
      </MotionConfig>
    </ReducedMotionContext.Provider>
  )
}
