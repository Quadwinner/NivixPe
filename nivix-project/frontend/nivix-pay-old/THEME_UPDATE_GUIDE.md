# NivixPe Theme Update Guide

## Overview
This guide documents the color system updates to match the Home page design across all sections of the website.

## Color System (from index.css)

### Primary Colors
- **Navy Blue**: `var(--color-navy-600)` (#0A4174) - Primary brand color
- **Teal**: `var(--color-teal-600)` (#0C7075) - Secondary brand color
- **Teal Accent**: `var(--color-teal-500)` (#0F9688) - Highlights

### Neutral Colors
- **Ink 900**: `var(--color-ink-900)` (#0A0E14) - Primary text
- **Ink 500**: `var(--color-ink-500)` (#56607A) - Secondary text
- **Ink 50**: `var(--color-ink-50)` (#F4F6F9) - Light backgrounds

### Gradients
- **Navy-Teal**: `linear-gradient(135deg, var(--color-navy-600), var(--color-teal-600))`
- **Teal Gradient**: `linear-gradient(135deg, var(--color-teal-500), var(--color-teal-600))`
- **Navy Gradient**: `linear-gradient(135deg, var(--color-navy-700), var(--color-navy-600))`

## Global Changes Applied

### 1. Background Colors
- **Main backgrounds**: Changed from `bg-gradient-to-br from-background via-accent-50/20` to `bg-white`
- **Card backgrounds**: Changed from `bg-white/90 backdrop-blur-sm` to `bg-white`
- **Dark sections**: Use `linear-gradient(135deg, var(--color-navy-800), var(--color-navy-700))`

### 2. Text Colors
- **Headings**: Changed from `text-text` to `style={{ color: 'var(--color-ink-900)' }}`
- **Body text**: Changed from `text-text-muted` to `style={{ color: 'var(--color-ink-500)' }}`
- **Gradient text**: Use `background: linear-gradient(135deg, var(--color-navy-700), var(--color-teal-600))` with `WebkitBackgroundClip: 'text'`

### 3. Button Colors
- **Primary buttons**: Changed from `bg-accent-600` to `bg-gradient-to-r from-teal-500 to-teal-400`
- **Hover states**: `hover:from-teal-400 hover:to-teal-300`
- **Wallet button**: Updated to use teal gradient

### 4. Icon Backgrounds
- **Navy icons**: `background: linear-gradient(135deg, var(--color-navy-500), var(--color-navy-600))`
- **Teal icons**: `background: linear-gradient(135deg, var(--color-teal-500), var(--color-teal-600))`
- **Mixed icons**: `background: linear-gradient(135deg, var(--color-navy-600), var(--color-teal-600))`

### 5. Progress Indicators
- **Completed steps**: Teal gradient `linear-gradient(135deg, var(--color-teal-500), var(--color-teal-600))`
- **Current step**: Navy-Teal gradient with ring
- **Pending steps**: Gray `bg-gray-100`

### 6. Status Colors
- **Success**: `var(--color-teal-500)` instead of green
- **Info**: `var(--color-navy-600)` instead of blue
- **Warning**: Keep `var(--color-warning)`
- **Error**: Keep `var(--color-error)`

## Page-Specific Updates

### AutomatedTransfer.tsx ✅ COMPLETED
- Updated background to white
- Changed header gradient to Navy-Teal
- Updated step progress indicators to use Teal/Navy
- Changed info card icons to Navy/Teal gradients
- Updated wallet button to teal gradient

### Dashboard.tsx (TO UPDATE)
```tsx
// Background
<div className="min-h-screen bg-white">

// Stats cards - use Navy and Teal gradients
<Card className="text-white border-0 shadow-xl" style={{ background: 'linear-gradient(135deg, var(--color-navy-600), var(--color-navy-700))' }}>

<Card className="text-white border-0 shadow-xl" style={{ background: 'linear-gradient(135deg, var(--color-teal-500), var(--color-teal-600))' }}>

// Icon backgrounds
style={{ background: 'linear-gradient(135deg, var(--color-teal-500), var(--color-teal-600))' }}

// Text colors
style={{ color: 'var(--color-ink-900)' }} // headings
style={{ color: 'var(--color-ink-500)' }} // body text
```

### KYC.tsx (TO UPDATE)
```tsx
// Background
<div className="min-h-screen bg-white">

// Step indicators - use Teal for completed, Navy-Teal for current
style={{ background: 'linear-gradient(135deg, var(--color-teal-500), var(--color-teal-600))' }}

// Buttons
className="!bg-gradient-to-r !from-teal-500 !to-teal-400"
```

### Send.tsx, Receive.tsx, Profile.tsx (TO UPDATE)
Apply same pattern:
1. White backgrounds
2. Navy-Teal gradients for primary elements
3. Teal for success/completed states
4. Navy for info/current states
5. Use CSS variables for all colors

## Component Updates

### Card Component
- Border: `style={{ borderColor: 'rgba(12,112,117,0.2)' }}`
- Background: `bg-white` (no transparency)
- Shadow: Keep existing shadow classes

### Button Component
- Primary: `!bg-gradient-to-r !from-teal-500 !to-teal-400`
- Hover: `hover:!from-teal-400 hover:!to-teal-300`
- Secondary: Keep existing with Navy border on hover

### Badge Component
- Success: `backgroundColor: 'rgba(12,112,117,0.12)', color: 'var(--color-teal-600)'`
- Info: `backgroundColor: 'rgba(10,65,116,0.12)', color: 'var(--color-navy-600)'`

## Typography
- **Display font**: `font-family: var(--font-display)` (Sora)
- **Body font**: `font-family: var(--font-body)` (DM Sans)
- **Mono font**: `font-family: var(--font-mono)` (Space Mono)

## Alternating Section Pattern (like Home page)
1. Hero/Header: Dark (Navy gradient)
2. Stats: White
3. Features: Dark (Navy gradient)
4. Use Cases: White
5. Video/Demo: Dark (Navy gradient)
6. Trust/Architecture: Dark (Navy gradient)
7. CTA: White with dark card

## Testing Checklist
- [ ] All pages use white or Navy gradient backgrounds
- [ ] No blue/purple/green gradients (except semantic colors)
- [ ] All text uses Ink color variables
- [ ] All buttons use Teal gradient
- [ ] All icons use Navy or Teal gradients
- [ ] Progress indicators use Teal for completion
- [ ] Cards have consistent styling
- [ ] Hover states work correctly
- [ ] Dark mode compatibility (if applicable)

## Quick Reference

### Replace These Colors:
- `bg-accent` → `style={{ backgroundColor: 'var(--color-navy-600)' }}`
- `text-accent` → `style={{ color: 'var(--color-teal-600)' }}`
- `from-accent-600 to-accent-700` → `from-teal-500 to-teal-400`
- `bg-blue-*` → Navy or Teal equivalents
- `bg-green-*` → Teal for success states
- `bg-purple-*` → Navy-Teal gradient
- `text-text` → `style={{ color: 'var(--color-ink-900)' }}`
- `text-text-muted` → `style={{ color: 'var(--color-ink-500)' }}`

### Keep These Colors:
- Red for errors: `var(--color-error)`
- Yellow for warnings: `var(--color-warning)`
- Gray for disabled/neutral states

## Notes
- Always use CSS variables instead of hardcoded hex values
- Maintain consistency with Home page design
- Test on both light backgrounds and dark sections
- Ensure WCAG 2.1 AA contrast ratios
- Use gradients sparingly for visual hierarchy
