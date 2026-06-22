---
name: Sovereign Health Governance
colors:
  surface: '#f8f9ff'
  surface-dim: '#cbdbf5'
  surface-bright: '#f8f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#eff4ff'
  surface-container: '#e5eeff'
  surface-container-high: '#dce9ff'
  surface-container-highest: '#d3e4fe'
  on-surface: '#0b1c30'
  on-surface-variant: '#3f4948'
  inverse-surface: '#213145'
  inverse-on-surface: '#eaf1ff'
  outline: '#6f7979'
  outline-variant: '#bec9c8'
  surface-tint: '#096969'
  primary: '#004c4c'
  on-primary: '#ffffff'
  primary-container: '#006666'
  on-primary-container: '#93e1e0'
  inverse-primary: '#86d4d3'
  secondary: '#006e1c'
  on-secondary: '#ffffff'
  secondary-container: '#91f78e'
  on-secondary-container: '#00731e'
  tertiary: '#6a3516'
  on-tertiary: '#ffffff'
  tertiary-container: '#874c2b'
  on-tertiary-container: '#ffc8ad'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#a2f0ef'
  primary-fixed-dim: '#86d4d3'
  on-primary-fixed: '#002020'
  on-primary-fixed-variant: '#004f4f'
  secondary-fixed: '#94f990'
  secondary-fixed-dim: '#78dc77'
  on-secondary-fixed: '#002204'
  on-secondary-fixed-variant: '#005313'
  tertiary-fixed: '#ffdbcb'
  tertiary-fixed-dim: '#ffb690'
  on-tertiary-fixed: '#341100'
  on-tertiary-fixed-variant: '#6e3819'
  background: '#f8f9ff'
  on-background: '#0b1c30'
  surface-variant: '#d3e4fe'
  emergency-red: '#D32F2F'
  priority-p1: '#D32F2F'
  priority-p2: '#F57C00'
  priority-p3: '#FBC02D'
  priority-p4: '#1976D2'
  priority-p5: '#78909C'
  surface-gray: '#F8FAFC'
  border-light: '#E2E8F0'
typography:
  display-lg:
    fontFamily: Atkinson Hyperlegible Next
    fontSize: 40px
    fontWeight: '700'
    lineHeight: 48px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Atkinson Hyperlegible Next
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
  headline-lg-mobile:
    fontFamily: Atkinson Hyperlegible Next
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
  headline-md:
    fontFamily: Atkinson Hyperlegible Next
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  title-lg:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
  caption:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 8px
  container-max: 1280px
  gutter: 24px
  margin-mobile: 16px
  margin-desktop: 32px
  stack-sm: 8px
  stack-md: 16px
  stack-lg: 32px
---

## Brand & Style

The design system is engineered to project **institutional authority, medical trust, and administrative transparency**. As a platform serving the Beninese Ministry of Health, the UI must balance the gravitas of a sovereign state institution with the approachability required for citizen-facing healthcare services.

The design style is **Corporate / Modern**, leaning heavily into functional minimalism to ensure clarity for users under stress. It prioritizes high legibility and a logical hierarchy to guide users through the 10-step complaint lifecycle. The aesthetic is clean and organized, mimicking a well-run clinical environment where information is structured, secure, and actionable. 

Key principles include:
- **Multimodal Accessibility:** Accommodating varying literacy levels through clear iconography and support for non-textual inputs (voice/photo).
- **Efficiency & Accountability:** Visualizing strict SLAs (P1-P5) to reinforce the government's commitment to timely resolution.
- **Sovereign Trust:** Utilizing institutional symbols and a disciplined layout to validate the platform's official status.

## Colors

This design system utilizes a palette rooted in medical professionalism and administrative clarity. 

- **Primary (#006666):** A deep teal representing health, stability, and government authority. Used for navigation, primary actions, and institutional headers.
- **Secondary (#4CAF50):** A soft, positive green used for success states, resolution confirmations, and positive feedback loops.
- **Neutral (#64748B):** A professional slate gray used for body text and secondary interface elements to maintain high contrast without visual fatigue.

**Semantic Status & SLA Colors:**
A dedicated priority scale (P1–P5) is mapped to specific hues to indicate urgency. **Emergency Red (#D32F2F)** is reserved strictly for P1 critical issues and destructive actions.

**Background Strategy:**
The system defaults to a **Light Mode** to maintain a clinical, organized feel. Use `surface-gray` for page backgrounds to allow white cards to pop, creating a clear physical distinction between the canvas and interactive content.

## Typography

The typography system is designed for **extreme legibility** across diverse user groups. 

- **Headlines:** Use **Atkinson Hyperlegible Next**, a font specifically designed for high readability and distinction between similar character shapes. This reinforces the institutional and inclusive nature of the system.
- **Body & UI Elements:** Use **Inter**, a highly functional sans-serif that excels in data-heavy environments like administrative dashboards.

**Hierarchy Guidelines:**
- **Display/Headline:** Reserved for page titles and major section headers.
- **Label-MD:** Used for all-caps institutional titles (e.g., "MINISTÈRE DE LA SANTÉ") and table headers to provide clear structure.
- **Body-LG:** Preferred for the "Description de la plainte" to ensure ease of reading for agents and citizens alike.
- **Caption:** Used for legal disclaimers, timestamps, and audit trail metadata.

## Layout & Spacing

The system employs a **12-column fluid grid** for the web portal and a flexible, single-column widget system for mobile.

- **Rhythm:** An 8px base unit (1rem = 16px) governs all spacing. 
- **Dashboards:** Use a 24px gutter between KPI cards to provide visual breathing room.
- **Forms:** Input fields should be stacked with 16px (`stack-md`) vertical spacing.
- **Mobile:** Margins are reduced to 16px to maximize screen real estate on smaller devices.

**Responsiveness:**
- **Desktop (>1024px):** Fixed max-width container (1280px) centered on the screen.
- **Tablet (768px - 1023px):** Fluid width with 24px side margins.
- **Mobile (<767px):** Full-width components with 16px side margins. Progress steppers should transition from horizontal to vertical orientation on mobile devices.

## Elevation & Depth

This design system uses **Tonal Layering** supplemented by **Ambient Shadows** to create a sense of order without overwhelming the user with unnecessary depth.

- **Surface Levels:** 
    - **Level 0 (Background):** `surface-gray` (#F8FAFC) provides the foundation.
    - **Level 1 (Cards):** Pure white (#FFFFFF) surfaces with a subtle 1px border (`border-light`) and a soft, diffused shadow (Offset: 0, 2px; Blur: 4px; Opacity: 0.05).
    - **Level 2 (Modals/Popovers):** White surfaces with a more pronounced shadow (Offset: 0, 8px; Blur: 16px; Opacity: 0.1) to focus user attention.

- **Interactive Elevation:** 
    - Buttons and interactive cards should not "lift" on hover; instead, use a subtle background color shift (darkening by 5%) to maintain the professional, grounded feel of an institutional tool.

## Shapes

The shape language is **Rounded (0.5rem / 8px)**. This choice balances the seriousness of a government platform with the friendliness of a service-oriented healthcare app.

- **Standard Elements (8px):** Buttons, input fields, and dashboard cards.
- **Large Elements (16px):** Main container sections and large modal windows.
- **Pills (Stadium):** Status badges (SOUMISE, EN COURS) and Priority Tags (P1–P5) always use a full stadium-radius to distinguish them from interactive buttons.
- **Borders:** Use a consistent 1px hairline border for all form inputs and card outlines to define structure in high-brightness environments.

## Components

### Buttons
- **Primary:** Solid `#006666` with white text. Used for "Déposer une plainte".
- **Secondary:** Outlined with `#006666` and 1px border. Used for "Suivre ma plainte".
- **Emergency:** Solid `#D32F2F`. Used only for critical deletions or P1-related overrides.

### Progress Steppers
- Visualizes the 10-stage complaint lifecycle.
- **Active Stage:** Primary color with a bold label.
- **Completed Stage:** Secondary green with a checkmark icon.
- **Pending Stage:** Neutral gray with a thin outline.

### Status Badges
- **SOUMISE:** Neutral gray background with dark text.
- **EN COURS:** Primary blue background with white text.
- **CLÔTURÉE:** Secondary green background with white text.
- Badges must be stadium-shaped (pill) and use `label-md` typography.

### Input Fields
- Labels must always be visible above the input (no placeholder-only labels) to ensure accessibility.
- Support for **Voice Notes** and **File Uploads** must be presented as secondary actions within the form group to accommodate low-literacy users.

### Cards (Tableau de Bord)
- Use white backgrounds on the gray surface.
- Include a 4px left-border accent using the `priority` color tokens to visually categorize data by urgency.

### Iconography
- Use **Material Design Icons** (Rounded style).
- Icons should always be accompanied by text labels unless the action is universally understood (e.g., a phone icon for "Appeler").