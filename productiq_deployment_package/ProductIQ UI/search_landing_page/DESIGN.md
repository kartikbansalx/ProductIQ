---
name: ProductIQ
colors:
  surface: '#f8f9ff'
  surface-dim: '#d1dbec'
  surface-bright: '#f8f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#eef4ff'
  surface-container: '#e5eeff'
  surface-container-high: '#dfe9fa'
  surface-container-highest: '#d9e3f4'
  on-surface: '#121c28'
  on-surface-variant: '#404941'
  inverse-surface: '#27313e'
  inverse-on-surface: '#eaf1ff'
  outline: '#707971'
  outline-variant: '#c0c9bf'
  surface-tint: '#2a6a43'
  primary: '#004322'
  on-primary: '#ffffff'
  primary-container: '#1a5c36'
  on-primary-container: '#90d2a2'
  inverse-primary: '#93d5a5'
  secondary: '#57605d'
  on-secondary: '#ffffff'
  secondary-container: '#d9e2dd'
  on-secondary-container: '#5c6561'
  tertiary: '#64252f'
  on-tertiary: '#ffffff'
  tertiary-container: '#803b45'
  on-tertiary-container: '#ffaeb6'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#aef2c0'
  primary-fixed-dim: '#93d5a5'
  on-primary-fixed: '#00210e'
  on-primary-fixed-variant: '#0b522d'
  secondary-fixed: '#dce5e0'
  secondary-fixed-dim: '#bfc9c4'
  on-secondary-fixed: '#151d1b'
  on-secondary-fixed-variant: '#404945'
  tertiary-fixed: '#ffd9dc'
  tertiary-fixed-dim: '#ffb2ba'
  on-tertiary-fixed: '#3c0612'
  on-tertiary-fixed-variant: '#74313b'
  background: '#f8f9ff'
  on-background: '#121c28'
  surface-variant: '#d9e3f4'
typography:
  display-lg:
    fontFamily: Syne
    fontSize: 48px
    fontWeight: '800'
    lineHeight: '1.1'
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Syne
    fontSize: 32px
    fontWeight: '700'
    lineHeight: '1.2'
  headline-lg-mobile:
    fontFamily: Syne
    fontSize: 28px
    fontWeight: '700'
    lineHeight: '1.2'
  headline-md:
    fontFamily: Syne
    fontSize: 24px
    fontWeight: '700'
    lineHeight: '1.3'
  body-lg:
    fontFamily: Instrument Sans
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: Instrument Sans
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.5'
  data-label:
    fontFamily: DM Mono
    fontSize: 14px
    fontWeight: '500'
    lineHeight: '1.4'
    letterSpacing: 0.02em
  data-value:
    fontFamily: DM Mono
    fontSize: 13px
    fontWeight: '400'
    lineHeight: '1.2'
  caption:
    fontFamily: Instrument Sans
    fontSize: 12px
    fontWeight: '500'
    lineHeight: '1.4'
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 4px
  xs: 0.5rem
  sm: 1rem
  md: 1.5rem
  lg: 2rem
  xl: 3rem
  gutter: 24px
  margin: 32px
---

## Brand & Style
The design system embodies a "Modern Industrial Intelligence" aesthetic—a synthesis of high-density data visualization and premium editorial design. It targets high-stakes decision-makers in the Indian fintech and logistics sectors, demanding a UI that feels both authoritative and hyper-functional.

The style is **Modern Corporate with a Data-Dense edge**, drawing inspiration from the efficiency of financial terminals while maintaining the approachability of contemporary SaaS. It balances brutalist structural integrity with a refined, "breathable" layout philosophy. The atmosphere is one of precision, expertise, and institutional trust.

## Colors
The palette is rooted in a "Forest & Finance" concept. The primary **Deep Forest Green** conveys stability and growth, utilized for key actions and branding elements. 

The background uses a **Light Sage** to reduce eye strain during long data-analysis sessions, providing a softer alternative to pure white. Cards and containers are rendered in **Pure White** or **Near-White** to create a clear "layering" effect against the sage backdrop. 

System feedback relies on high-visibility **Amber** for warnings and **Red** for critical alerts, ensuring these interruptions stand out against the organic green base. The system supports a seamless dark mode transition, where the Sage backgrounds shift to a Deep Charcoal (#0B1A12) while maintaining the primary green's vibrancy.

## Typography
Typography is the core differentiator of this design system. 
- **Syne** is reserved for headlines, providing a bold, avant-garde character that suggests premium quality. 
- **Instrument Sans** handles all standard UI and body copy, chosen for its exceptional legibility and neutral tone. 
- **DM Mono** is strictly for technical data, HSN codes, and numerical values, ensuring that tabular data remains perfectly aligned and visually distinct from the narrative text.

Scale transitions focus on maintaining vertical rhythm. Display headings use tight tracking and leading for maximum impact.

## Layout & Spacing
The layout follows a **Hybrid Grid System**. We use a 12-column fixed grid for desktop (max-width 1440px) to ensure the high-density data remains focused and legible. 

The spacing rhythm is based on a **4px baseline**, emphasizing tight, efficient groupings of data points punctuated by generous margins (`32px`) between major sections. This "Condensed Data, Expansive Layout" approach prevents the terminal aesthetic from becoming overwhelming. 

On mobile, the grid collapses to 4 columns with `16px` margins, prioritizing vertical stack order and mono-spaced labels for technical clarity.

## Elevation & Depth
Hierarchy is established through **Tonal Layering and Soft Shadows**. 

Instead of heavy drop shadows, we use **Ambient Diffused Shadows** (0px 4px 20px, 4% opacity) to lift cards off the Sage background. Depth is reinforced through z-index stacking: navigation sits on the highest plane, followed by active modals, then cards, and finally the base background.

Backdrop blurs (12px) are used on mobile navigation and modal overlays to maintain context while focusing the user's attention.

## Shapes
The shape language is a contrast of structural rigidity and soft approachability. 
- **Cards and Containers:** Use `rounded-lg` (16px) to maintain a premium, modern feel.
- **Badges and Chips:** Always **Pill-shaped** (full radius) to provide a distinct visual break from the rectangular grid.
- **Buttons:** Use a `rounded` (8px) radius, providing a middle ground that feels sturdy yet contemporary.

## Components
- **Buttons:** Primary buttons are Solid Forest Green with White text. Secondary buttons use a Forest Green outline with a subtle Sage hover state.
- **Data Tables:** High-density with `DM Mono` cells. Rows should have a subtle hover highlight (#E2EFEB) and use 1px horizontal dividers only.
- **Pill Badges:** Used for status (Active, Pending, Alert). They utilize low-saturation background tints of the status color with high-saturation text.
- **Input Fields:** Minimalist with a 1px border. On focus, the border thickens to 2px in Forest Green. Labels always use `Instrument Sans` Semi-bold.
- **Cards:** White background with a soft 1px border (#E5E7EB) and the ambient shadow defined in Elevation.
- **Data Points:** HSN codes and currency values must be rendered in `DM Mono` to differentiate them from labels.