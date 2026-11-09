---
name: Field Access & Event Operations
colors:
  surface: '#f9f9ff'
  surface-dim: '#cbdaff'
  surface-bright: '#f9f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f1f3ff'
  surface-container: '#e9edff'
  surface-container-high: '#e0e8ff'
  surface-container-highest: '#d8e2ff'
  on-surface: '#001a42'
  on-surface-variant: '#414751'
  inverse-surface: '#142f5d'
  inverse-on-surface: '#edf0ff'
  outline: '#717782'
  outline-variant: '#c1c7d3'
  surface-tint: '#0060aa'
  primary: '#00508f'
  on-primary: '#ffffff'
  primary-container: '#0f68b5'
  on-primary-container: '#d8e6ff'
  inverse-primary: '#a3c9ff'
  secondary: '#4a5d8e'
  on-secondary: '#ffffff'
  secondary-container: '#b5c8ff'
  on-secondary-container: '#405383'
  tertiary: '#922811'
  on-tertiary: '#ffffff'
  tertiary-container: '#b34026'
  on-tertiary-container: '#ffded7'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#d3e3ff'
  primary-fixed-dim: '#a3c9ff'
  on-primary-fixed: '#001c38'
  on-primary-fixed-variant: '#004882'
  secondary-fixed: '#dae2ff'
  secondary-fixed-dim: '#b2c5fd'
  on-secondary-fixed: '#001947'
  on-secondary-fixed-variant: '#324575'
  tertiary-fixed: '#ffdad2'
  tertiary-fixed-dim: '#ffb4a3'
  on-tertiary-fixed: '#3d0600'
  on-tertiary-fixed-variant: '#872009'
  background: '#f9f9ff'
  on-background: '#001a42'
  surface-variant: '#d8e2ff'
typography:
  headline-xl:
    fontFamily: Plus Jakarta Sans
    fontSize: 36px
    fontWeight: '700'
    lineHeight: 44px
  headline-xl-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 28px
    fontWeight: '700'
    lineHeight: 36px
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 28px
    fontWeight: '700'
    lineHeight: 36px
  headline-lg-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 22px
    fontWeight: '700'
    lineHeight: 28px
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 26px
  headline-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 22px
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  body-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
  label-lg:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 18px
  label-md:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
  label-sm:
    fontFamily: Inter
    fontSize: 10px
    fontWeight: '700'
    lineHeight: 12px
  numeric-display:
    fontFamily: Plus Jakarta Sans
    fontSize: 48px
    fontWeight: '800'
    lineHeight: 52px
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  gutter: 1rem
  gutter-mobile: 0.75rem
  margin: 1.5rem
  margin-mobile: 1rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2.5rem
---

## Brand & Style

This design system is engineered for critical, fast-paced event ticketing, operational check-ins, and handheld QR/NFC validation environments. The personality is authoritative, precise, technological, and intensely functional. 

The aesthetic adheres to **High-Contrast Modern Utility**: an operational interface stripped of decorative distractions to maximize high-velocity readability and error-free thumb navigation. Designed for stewards, operational staff, and gate supervisors under extreme ambient light (glare outdoors, dim auditorium corridors), the system balances institutional credibility with assertive visual feedback. 

Physical affordances dominate the experience: tactile-first buttons, unambiguous visual states, dense data summaries, and high-impact full-screen validation overlays.

## Colors

The palette is anchored by the IPNET technological blue identity and engineered around rigorous semantic clarity for rapid scanning decisions.

### Primary & Core Tones
- **Primary (`#0F68B5`)**: Institutional technical blue used for top bars, key brand anchors, primary action buttons, and active tabs.
- **Secondary (`#8699CE`)**: Soft slate-blue secondary tone for interactive highlights, secondary buttons, and focused filters.
- **Tertiary (`#9D3018`)**: Deep rust-red dedicated strictly to the specific access status **"Wrong Event / Mauvais Événement"**, preventing cognitive mix-ups with invalid tickets.
- **Neutral Core (`#9BB3E9`)**: Soft neutral tint utilized for high-contrast text, borders, and primary surface framing.

### Operational Semantic Palette (Scanning States)
Validation results require instantaneous, peripheral-vision clarity:
- **Scan Success / Valid (`#16A34A`)**: Vibrant emerald green. Signals full clearance and valid ticket burn.
- **Scan Warning / Already Used (`#EA580C`)**: High-visibility amber-orange. Signals duplicate entry attempts or tickets needing supervisor override.
- **Scan Error / Invalid (`#DC2626`)**: Direct crimson red. Signals unreadable, fake, or revoked access.
- **Scan Void / Cancelled (`#374151`)**: Slate charcoal. Signals deactivated passes or cancelled sessions.

### Cold Neutrals & Surface Tiers
- **Canvas Base**: `#F8FAFC` (Cool Gray 50)
- **Surface Elevation 1**: `#FFFFFF`
- **Surface Elevation 2 / Borders**: `#E2E8F0` (Cool Gray 200)
- **Text Muted**: `#64748B` (Cool Gray 500)
- **Viewfinder Overlay Tint**: `rgba(15, 23, 42, 0.88)` (Ink backdrop ensuring sharp contrast against real-time video feed)

## Typography

The typographic hierarchy couples **Plus Jakarta Sans** for structural headlines and high-visibility status indicators with **Inter** for dense tabular readouts, ticket serials, and instructional body copy.

All numeric elements (timestamps, entry counts, turnstile throughput, seat indices) utilize tabular figures (`tnum`) to eliminate layout jitter during high-volume real-time syncs. `numeric-display` is dedicated to dashboard scanning counters and split-second entry approvals.

## Layout & Spacing

The layout architecture employs a fluid column structure with fixed thumb-zone anchors on mobile:
- **Mobile Handheld (up to 640px)**: 4 columns, `margin-mobile` (16px), `gutter-mobile` (12px). Interactive controls occupy the bottom 40% of the screen.
- **Tablet / Rugged Terminal (641px - 1024px)**: 8 columns, `margin` (24px), `gutter` (16px). Dual-pane layout separating the camera stream from participant lists.
- **Desktop / Control Room (1025px+)**: 12 columns, max container width 1440px, centered with progressive margins.

All primary tap targets adhere strictly to an absolute minimum dimension of 48×48px (optimized for single-handed thumb operation and glove use on turnstiles).

## Elevation & Depth

Visual hierarchy uses **tonal layering and crisp structural borders** over deep atmospheric shadows, maintaining sharpness under bright ambient conditions.

- **Level 0 (Base Canvas)**: Flat `#F8FAFC`, no elevation.
- **Level 1 (Cards, Lists, Input Shelves)**: Solid `#FFFFFF`, bordered by 1px solid `#E2E8F0`, with zero blur to eliminate smearing on low-brightness mobile displays.
- **Level 2 (Dropdowns, Floating Toolbars, Active Modals)**: Solid `#FFFFFF`, bordered by 1px solid `#CBD5E1`, with a high-definition tactile shadow: `0 4px 12px -2px rgba(15, 23, 42, 0.08), 0 2px 4px -1px rgba(15, 23, 42, 0.04)`.
- **Level 3 (Scan Result Overlays)**: Full-viewport or sheet-level elevation layered directly over the camera feed, driven entirely by full-bleed background fills in the respective status color (Success, Warning, Error, Wrong Event).

## Shapes

The design system adopts **Soft Geometry (Value 1)**:
- Base elements, inputs, and list rows: `0.25rem` (4px).
- Container cards, dialogs, and scanner target guides: `0.5rem` (8px).
- Modals, action sheets, and elevated overlays: `0.75rem` (12px).

This compact radius preserves valuable screen estate and reinforces the industrial, professional tooling feel. Pills and fully rounded buttons are banned to avoid playful consumer-app connotations.

## Components

### Buttons
- **Primary Action (Scan, Validate, Confirm)**: Height: 52px minimum. Background: `#0F68B5`, Text: `#FFFFFF`, Radius: 4px. Bold typography.
- **Secondary Action (Torch Toggle, Camera Switch, Manual Entry)**: Height: 48px. Background: `#FFFFFF`, Border: 1.5px solid `#0F68B5`, Text: `#0F68B5`.
- **Destructive / Reset Action**: Background: `#FEF2F2`, Border: 1px solid `#DC2626`, Text: `#DC2626`.
- **Interactive Feedback**: Pressed states apply an immediate visual depression (scale: 0.98 and dark tint overlay), mimicking physical key travel.

### Scanning Viewfinder & Target Reticle
- Centered 260×260px framing square with thick 4px corner reticles in `#FFFFFF`.
- Surrounding ambient area shaded with `rgba(15, 23, 42, 0.88)`.
- Laser guide: Horizontal animated pulse in `#8699CE` idling, switching instantly to semantic state colors upon tag decode.

### Status Banner Overlays (Instant Visual Haptics)
- **Success**: Full surface `#16A34A`, White bold text. Primary text: "ACCÈS AUTORISÉ". Large white checkmark glyph.
- **Warning**: Surface `#EA580C`, White bold text. Primary text: "TICKET DÉJÀ SCANNE". Displays timestamp of first scan.
- **Error**: Surface `#DC2626`, White bold text. Primary text: "BILLET INVALIDE".
- **Wrong Event**: Surface `#9D3018`, White bold text. Primary text: "MAUVAIS ÉVÉNEMENT / SALLE".
- **Cancelled**: Surface `#374151`, White bold text. Primary text: "SESSION ANNULÉE".

### Input Fields (Manual Search & Code Input)
- Fixed height: 48px. Background: `#FFFFFF`. Border: 1.5px solid `#E2E8F0`. Focus state: `#8699CE` border with a 2px outer ring offset. Numeric keyboards forced by default for code inputs. Clear button (X) sized at 32×32px minimum.

### Participant & Ticket Lists
- High-density rows separated by 1px dividers (`#E2E8F0`). Left side: Participant full name (`label-lg`) and category chip. Right side: Time of entry and current status badge.

### Status Chips & Badges
- Compact padding: 4px vertical, 8px horizontal. Uppercase `label-sm`.
- VIP / Regular / Staff category tags use `#F1F5F9` background with `#0F68B5` text.