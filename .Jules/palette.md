## 2025-05-15 - [Copy Ticket Number & Form Accessibility]
**Learning:** Ticket numbers in tracking systems are critical but hard to remember/type. Adding a one-click copy button with visual confirmation (`FiCheck`) and toast notification significantly reduces friction. Label-input associations and ARIA labels for icon-buttons are essential for screen reader users in login forms.
**Action:** Always include a copy-to-clipboard feature for generated IDs or ticket numbers, and ensure every interactive icon-button has a descriptive `aria-label`.

## 2026-05-31 - [URL-driven search must re-sync on param change]
**Learning:** A header search that navigates to `/suivi?ticket=…` breaks when the user is already on the track page: React Router reuses the component instance, so a `useEffect` with `[]` never re-runs. Users see no results after a second search from the header.
**Action:** Derive the trigger from `searchParams.get('ticket')` (or equivalent) in the effect dependency array, and wire empty-submit feedback (`role="alert"`, focus return, `aria-describedby`).
