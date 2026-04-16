# Palette's Journal - Critical UX/Accessibility Learnings

## 2024-11-19 - Initial Setup
**Learning:** Starting the UX audit of PGP-USS.
**Action:** Focus on accessibility, keyboard navigation, and micro-interactions.

## 2025-05-15 - Accessible Step Indicators
**Learning:** Multi-step forms in PGP-USS used a custom step indicator that lacked both visual styles and semantic accessibility (ARIA), making it difficult for screen readers and sighted users to track progress.
**Action:** Wrap step indicators in a `<nav>` element with `aria-label`, use `aria-current="step"` for the active state, and ensure `aria-label`s describe the status (e.g., "Step 1: Establishment (completed)").
