import React from 'react'

export default function LoadingState({ label = 'Chargement en cours…' }) {
  return (
    <div className="loading-center" role="status" aria-live="polite" aria-busy="true">
      <div className="spinner" aria-hidden="true" />
      <span className="sr-only">{label}</span>
    </div>
  )
}
