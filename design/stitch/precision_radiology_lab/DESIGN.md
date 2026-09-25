---
name: Precision Radiology Lab
colors:
  surface: '#071425'
  surface-dim: '#071425'
  surface-bright: '#2e3a4d'
  surface-container-lowest: '#030e20'
  surface-container-low: '#101c2e'
  surface-container: '#142032'
  surface-container-high: '#1f2a3d'
  surface-container-highest: '#2a3548'
  on-surface: '#d7e3fc'
  on-surface-variant: '#bbcac4'
  inverse-surface: '#d7e3fc'
  inverse-on-surface: '#253144'
  outline: '#86948f'
  outline-variant: '#3d4945'
  surface-tint: '#5bdbbf'
  primary: '#6feed0'
  on-primary: '#00382e'
  primary-container: '#4fd1b5'
  on-primary-container: '#005648'
  inverse-primary: '#006b5a'
  secondary: '#b7c7e5'
  on-secondary: '#213148'
  secondary-container: '#384760'
  on-secondary-container: '#a6b6d3'
  tertiary: '#ffcdc5'
  on-tertiary: '#670400'
  tertiary-container: '#ffa697'
  on-tertiary-container: '#951c0d'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#7af8da'
  primary-fixed-dim: '#5bdbbf'
  on-primary-fixed: '#00201a'
  on-primary-fixed-variant: '#005143'
  secondary-fixed: '#d5e3ff'
  secondary-fixed-dim: '#b7c7e5'
  on-secondary-fixed: '#0b1c32'
  on-secondary-fixed-variant: '#384760'
  tertiary-fixed: '#ffdad4'
  tertiary-fixed-dim: '#ffb4a7'
  on-tertiary-fixed: '#400200'
  on-tertiary-fixed-variant: '#8d1508'
  background: '#071425'
  on-background: '#d7e3fc'
  surface-variant: '#2a3548'
typography:
  display-lg:
    fontFamily: Space Grotesk
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.03em
  display-lg-mobile:
    fontFamily: Space Grotesk
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-xl:
    fontFamily: Space Grotesk
    fontSize: 36px
    fontWeight: '700'
    lineHeight: 44px
    letterSpacing: -0.02em
  headline-xl-mobile:
    fontFamily: Space Grotesk
    fontSize: 26px
    fontWeight: '700'
    lineHeight: 34px
    letterSpacing: -0.01em
  headline-lg:
    fontFamily: Space Grotesk
    fontSize: 28px
    fontWeight: '600'
    lineHeight: 36px
    letterSpacing: -0.015em
  headline-md:
    fontFamily: Space Grotesk
    fontSize: 22px
    fontWeight: '600'
    lineHeight: 30px
    letterSpacing: -0.01em
  headline-sm:
    fontFamily: Space Grotesk
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 26px
    letterSpacing: -0.005em
  body-lg:
    fontFamily: IBM Plex Sans
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 26px
  body-md:
    fontFamily: IBM Plex Sans
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 22px
  body-sm:
    fontFamily: IBM Plex Sans
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 18px
  label-lg:
    fontFamily: JetBrains Mono
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
    letterSpacing: 0.02em
  label-md:
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.03em
  label-sm:
    fontFamily: JetBrains Mono
    fontSize: 10px
    fontWeight: '500'
    lineHeight: 14px
    letterSpacing: 0.05em
  data-metric:
    fontFamily: JetBrains Mono
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
    letterSpacing: -0.02em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1.5rem
  gutter-mobile: 0.75rem
  margin: 2rem
  margin-mobile: 1rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2.5rem
---

## Brand & Style

This design system establishes an immersive, clinical-grade digital environment balancing tactical biomedical engineering with the focused quietude of an advanced radiology operating bay. It caters to biomedical engineers, medical radiation physicists, radiographers, and clinical technicians across Uzbekistan. 

The aesthetic synthesizes modern tactical Glassmorphism with Clinical Laboratory Precision:
- **Atmospheric Anchor:** A low-luminance deep navy realm mirroring dimly lit diagnostic viewing suites, reducing eye strain during high-focus machine calibration.
- **Instrument Precision:** Hairline luminescence, crisp structural telemetry, and measured typography that evoke surgical accuracy rather than decorative flair.
- **Tone:** Authoritative, calm, scientifically rigorous, and high-tech without tipping into arcade gamification or generic enterprise SaaS.
- **Cultural & Professional Nuance:** Built natively for Uzbek Latin technical terminology (`kVp`, `mA`, `Gantri`, `Detektorlar massivi`, `Nosozlik`). Graphical symbolism adheres strictly to clinical science: when universal clinical iconography is required, only the single-serpent Rod of Asclepius is permissible; the double-serpent caduceus, red cross, or red crescent are strictly excluded to maintain international radiological standards.

## Colors

The palette is engineered for high dark-field legibility, critical diagnostic telemetry, and cognitive differentiation under time-critical operational procedures.

### Color Roles & Ratios
- **Canvas / Root Background (`#0F1B2D`):** Deep navy void representing physical diagnostic chambers. Occupies the primary spatial canvas.
- **Surface Navy (`#16263D`):** Layered panels, instrumentation consoles, and frosted glass plates. Applied with semi-transparent blending (`rgba(22, 38, 61, 0.75)` to `rgba(22, 38, 61, 0.90)`).
- **Primary Accent Teal (`#4FD1B5`):** Signal for active machine health, verified CT subsystems, optimal scanning states, focus outlines, and primary actions. Emits an ethereal 6px to 12px soft glow (`rgba(79, 209, 181, 0.25)`) when active or calibrated.
- **Light Contrast Neutral (`#F4F6F5`):** Pure clinical off-white applied to primary metrics, high-voltage indicators, and acute callouts requiring stark contrast against the dark background.
- **Text Dominance (`#EEF3F2`):** Primary readout text, ensuring balanced contrast without the glare of uncalibrated `#FFFFFF`.
- **Telemetry Muted (`#A9BBC4`):** Secondary meta-labels, non-critical telemetry units, physical scanner coordinates, and inactive navigation items.
- **Fault/Diagnostic Coral (`#E0523D`):** Strictly quarantined for hard hardware interlocks, tube overheat alarms, critical reconstruction errors, high-voltage faults, and failing hardware nodes. It must never appear as a non-critical visual flourish or marketing badge.

## Typography

The typographical framework enforces clear role separation across narrative, scientific prose, and machine-level telemetry:

- **Structural Headings (`Space Grotesk`):** Used for view titles, subsystem names, module headings, and diagnostic panel headers. Characterized by tightly tracked letterforms and confident geometric proportions that signal technical mastery.
- **Narrative & Instruction (`IBM Plex Sans`):** Selected for clinical troubleshooting steps, operating manual procedures, and Uzbek training curricula. Offers neutral, highly distinct glyph shapes with zero ambiguity under varied viewing angles.
- **Telemetry & Technical Telemetry (`JetBrains Mono`):** Dedicated exclusively to physical parameters (`120 kVp`, `350 mA`, `0.35s rotatsiya`), sensor readings, machine hex registers, exam IDs, error logs, and calibration thresholds. Tabular figures align vertical numeric columns reliably across dynamic readouts.

## Layout & Spacing

The layout is built for desktop-first training environments (workstations running dual-screen machine emulators and high-resolution multi-slice CT diagnostics), scaling gracefully to clinical tablets and remote field devices.

### Grid Architecture
- **Desktop (≥ 1280px):** 12-column dynamic grid, `margin: 2rem`, `gutter: 1.5rem`. Split typically into a fixed 280px left console (subsystem tree & diagnostics), an 8-column interactive simulation canvas (X-ray tube, slip rings, phantom reconstruction), and a 4-column real-time parameter stack.
- **Tablet (768px – 1279px):** 8-column layout, `margin: 1.5rem`, `gutter: 1rem`. Simulation and telemetry stack into dual vertically synchronized viewports.
- **Mobile (< 768px):** 4-column reflow, `margin: 1rem`, `gutter: 0.75rem`. Complex 3D CT schematics switch to interactive telemetry strips and tabbed inspection cards.

### Spacing Rules
Internal card padding maintains an unyielding `1.5rem` (`space-lg`) on desktop views to keep telemetry controls separated from capacitive touch-points and prevent mis-calibration inputs. Component clusters (e.g., tube voltage fine-tuning increments) use strict `0.5rem` (`space-sm`) gaps.

## Elevation & Depth

Visual hierarchy operates through luminous planar layering rather than traditional drop shadows, replicating multi-layered glass projection terminals found in modern advanced scanner consoles.

### Layering Levels
- **Base Canvas (Level 0):** Solid `#0F1B2D` with subtle background linear gradients simulating quiet room illumination.
- **Structural Modules (Level 1 - Frosted Navy Glass):** `rgba(22, 38, 61, 0.70)` surface fill, backed by `backdrop-filter: blur(16px)` and bounded by a crisp `1px` solid border using `rgba(79, 209, 181, 0.20)`. Shadows are soft, chromatic halos: `0 8px 32px rgba(15, 27, 45, 0.60)`.
- **Interactive Floating Consoles & Modals (Level 2):** Elevated cards handling direct troubleshooting tasks. Background is `rgba(22, 38, 61, 0.88)` with `backdrop-filter: blur(24px)`. Border is heightened to `rgba(79, 209, 181, 0.40)` with an outward teal radiation aura: `box-shadow: 0 0 20px rgba(79, 209, 181, 0.15), 0 12px 40px rgba(0, 0, 0, 0.50)`.
- **Fault State Elevation (Hardware Interlock):** When a component reports critical failure, the elevation field converts to `rgba(224, 82, 61, 0.35)` border resonance with an alert glow: `box-shadow: 0 0 24px rgba(224, 82, 61, 0.25)`.

## Shapes

The geometric signature combines protective curved glass shields with high-mobility interactive controls:

- **Cards & Functional Panels:** Fixed to `16px` (`rounded-lg` / `1rem`), providing a contained, balanced structural frame for high-density medical telemetry.
- **Controls, Action Triggers & Chips:** Strictly pill-shaped (`9999px`), contrasting the structured rectangular matrix of the panels and guiding the eye toward actionable, clickable operational triggers.
- **Metric Badges & Segmented Switches:** Embedded within cards using `8px` (`rounded` / `0.5rem`) pill contours to hold numeric readings and telemetry flags without encroaching on canvas boundaries.

## Components

### Buttons
- **Primary Pill:** Background is `#4FD1B5`, text is `#0F1B2D` in `Space Grotesk` medium (`14px`), horizontal padding `24px`, vertical padding `10px`. Hover initiates a teal particle illumination (`box-shadow: 0 0 16px rgba(79, 209, 181, 0.45)`).
- **Secondary / Ghost Pill:** Background is transparent, border is `1px solid rgba(79, 209, 181, 0.30)`, text is `#EEF3F2`. Hover activates an inner surface tint `rgba(79, 209, 181, 0.10)`.
- **Fault Override Trigger:** Background is `rgba(224, 82, 61, 0.15)`, border `1px solid #E0523D`, text `#E0523D`. Hover intensifies to solid `#E0523D` fill with off-white `#F4F6F5` text.

### Chips & Telemetry Tags
- Standard metadata badges are rendered in full pill geometry with `JetBrains Mono` (`11px`, uppercase).
- Normal status: `rgba(79, 209, 181, 0.12)` background, `rgba(79, 209, 181, 0.40)` border, `#4FD1B5` text.
- Hardware alert tag: `rgba(224, 82, 61, 0.15)` background, `#E0523D` border, `#E0523D` text with a blinking `3px` circular failure indicator.

### Input Fields & Parameter Steppers
- Background: `rgba(15, 27, 45, 0.80)`.
- Border: `1px solid rgba(169, 187, 196, 0.30)`. On focus: `1px solid #4FD1B5` with a `0 0 8px rgba(79, 209, 181, 0.30)` glow.
- Numeric inputs (e.g., tube current `mA`, rotation time `s`) use `JetBrains Mono` with integrated fixed unit badges on the right edge.

### Inspection Cards (Frosted Panels)
- Defined with `16px` border-radius, `1px solid rgba(79, 209, 181, 0.25)`, background `rgba(22, 38, 61, 0.75)`, and `backdrop-filter: blur(16px)`.
- Cards host an upper meta-header containing system status, an engineering coordinate or ID, and an action trigger.

### Checkboxes & Segmented Selectors
- Checkboxes: `18px` squircle with `4px` inner radius. Checked state displays a teal `#4FD1B5` fill with deep navy checkmark.
- Radio buttons: Double ring telemetry indicator with an active glowing `#4FD1B5` center.

### Specialized Domain Components
- **Gantry Vector Visualizer:** Circular telemetry viewport mapping CT gantry tilt angle (degrees) and RPM, encircled by a 1.5px teal orbit track.
- **Subsystem Diagnostic Node:** Interactive diagram points for physical assemblies (X-ray Tube, High Voltage Generator, Collimator, Detector Array, Slip Ring). Normal nodes pulse with a calm teal frequency; fault nodes glow steadily in `#E0523D`.
- **Iconography Standards:** Precision vector line art (strictly 1.5px stroke width, geometric joins) representing the CT gantry ring, X-ray tube filament, detector array curve, real-time pulse monitor, inspection wrench, graduation cap, and single-serpent Rod of Asclepius.