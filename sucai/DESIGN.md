---
name: Precision & Clarity
colors:
  surface: '#faf9fe'
  surface-dim: '#dad9df'
  surface-bright: '#faf9fe'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f4f3f8'
  surface-container: '#eeedf3'
  surface-container-high: '#e9e7ed'
  surface-container-highest: '#e3e2e7'
  on-surface: '#1a1b1f'
  on-surface-variant: '#414755'
  inverse-surface: '#2f3034'
  inverse-on-surface: '#f1f0f5'
  outline: '#717786'
  outline-variant: '#c1c6d7'
  surface-tint: '#005bc1'
  primary: '#0058bc'
  on-primary: '#ffffff'
  primary-container: '#0070eb'
  on-primary-container: '#fefcff'
  inverse-primary: '#adc6ff'
  secondary: '#4c4aca'
  on-secondary: '#ffffff'
  secondary-container: '#6664e4'
  on-secondary-container: '#fffbff'
  tertiary: '#9e3d00'
  on-tertiary: '#ffffff'
  tertiary-container: '#c64f00'
  on-tertiary-container: '#fffbff'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#d8e2ff'
  primary-fixed-dim: '#adc6ff'
  on-primary-fixed: '#001a41'
  on-primary-fixed-variant: '#004493'
  secondary-fixed: '#e2dfff'
  secondary-fixed-dim: '#c2c1ff'
  on-secondary-fixed: '#0c006a'
  on-secondary-fixed-variant: '#3631b4'
  tertiary-fixed: '#ffdbcc'
  tertiary-fixed-dim: '#ffb595'
  on-tertiary-fixed: '#351000'
  on-tertiary-fixed-variant: '#7c2e00'
  background: '#faf9fe'
  on-background: '#1a1b1f'
  surface-variant: '#e3e2e7'
typography:
  display-lg:
    fontFamily: Inter
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 52px
    letterSpacing: -0.022em
  headline-lg:
    fontFamily: Inter
    fontSize: 34px
    fontWeight: '700'
    lineHeight: 41px
    letterSpacing: -0.022em
  headline-lg-mobile:
    fontFamily: Inter
    fontSize: 28px
    fontWeight: '700'
    lineHeight: 34px
    letterSpacing: -0.021em
  title-md:
    fontFamily: Inter
    fontSize: 22px
    fontWeight: '600'
    lineHeight: 28px
    letterSpacing: -0.015em
  body-lg:
    fontFamily: Inter
    fontSize: 17px
    fontWeight: '400'
    lineHeight: 22px
    letterSpacing: -0.015em
  body-sm:
    fontFamily: Inter
    fontSize: 15px
    fontWeight: '400'
    lineHeight: 20px
    letterSpacing: -0.01em
  label-md:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '500'
    lineHeight: 18px
    letterSpacing: 0.01em
  caption:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '400'
    lineHeight: 13px
    letterSpacing: 0.01em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 4px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  xxl: 48px
  gutter: 20px
  margin-mobile: 16px
  margin-desktop: 64px
---

## Brand & Style
The design system is centered on a premium, editorial aesthetic inspired by the principles of clarity, deference, and depth. It targets a sophisticated audience that values efficiency and high-quality craftsmanship. 

The style is **Corporate / Modern** with a strong infusion of **Glassmorphism**. It prioritizes content through generous whitespace and a reduction of unnecessary visual ornamentation. Every element serves a functional purpose, utilizing subtle layers and physical metaphors like translucency to establish hierarchy without clutter. The emotional response should be one of calm, reliability, and effortless luxury.

## Colors
The palette is rooted in a monochromatic spectrum of off-whites and greys to provide a quiet backdrop for content. 

- **Primary:** "Apple Blue" (#007AFF) is reserved strictly for interactive elements, primary actions, and indicative states. 
- **Neutral:** A range of grays (from #8E8E93 to #F5F5F7) defines the hierarchy of non-interactive surfaces.
- **Surface Strategy:** Use pure white (#FFFFFF) for cards and foreground elements, while using the off-white base (#F5F5F7) for the main application background to create a "layered" effect. 
- **System States:** Success, warning, and error states should follow standard semantic conventions (Green, Orange, Red) but remain desaturated to match the premium tone.

## Typography
The typography system uses **Inter** to mimic the systematic, high-legibility nature of SF Pro. 

Key implementation details:
- **Tracking:** Apply negative letter spacing to larger display types to maintain a tight, editorial feel. Use positive tracking for smaller labels and captions to improve readability.
- **Leading:** Utilize generous line heights for body text to promote an airy, readable flow.
- **Contrast:** Distinguish information hierarchy through weight (SemiBold/Bold for headers) rather than just size or color.

## Layout & Spacing
The layout follows a **Fluid Grid** model with strict adherence to an 8px (or 4px sub-grid) rhythmic scale. 

- **Desktop:** 12-column grid with 64px side margins. Information should be centered or grouped in clear, modular cards.
- **Mobile:** 4-column grid with 16px side margins. 
- **Airy Philosophy:** Use "lg" and "xl" spacing tokens between sections to ensure the UI feels uncrowded. Content should never feel cramped against the edges of its container.

## Elevation & Depth
Depth is conveyed through a combination of **Glassmorphism** and **Ambient Shadows**.

- **Backdrop Blur:** Use `backdrop-filter: blur(20px)` on navigation bars, sidebars, and floating modals to create a sense of verticality and context.
- **Shadows:** Avoid harsh shadows. Use ultra-diffused, multi-layered shadows with low opacity (e.g., `box-shadow: 0 4px 24px rgba(0,0,0,0.04)`).
- **Fine Borders:** Surfaces should be defined by 1px solid borders in a very light grey (#E5E5E5) or a semi-transparent white on dark backgrounds to give a "milled" look.
- **Z-Index Strategy:** Higher elevation levels should be represented by increased background blur and slightly more pronounced shadows.

## Shapes
The shape language is consistently soft and friendly. 

- **Standard Radius:** Most UI elements (buttons, inputs) use a 10px-12px radius.
- **Large Radius:** Containers, cards, and modals use a 16px to 20px radius to create a distinct, modern container feel.
- **Continuity:** Ensure that nested elements (like a button inside a card) have a smaller radius than their parent to maintain visual harmony.

## Components
- **Buttons:** Primary buttons use the vibrant Apple Blue with white text. Secondary buttons are subtle grey with blue text. Avoid heavy gradients; use solid fills or very subtle tints.
- **Inputs:** Fields should have a light grey background (#E8E8ED) with no border in their resting state, shifting to a 1px Blue border on focus.
- **Cards:** White background, 16px corner radius, a 1px light border, and a soft ambient shadow.
- **Chips/Badges:** Pill-shaped with a soft tinted background (e.g., 10% opacity of the label color).
- **Lists:** Clean lines with 1px horizontal dividers that do not span the full width of the container (inset dividers).
- **Modals:** Centered with a heavy backdrop blur on the underlying content and a 20px corner radius.