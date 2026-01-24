---
name: kintsugi-design
description: Use when implementing UI components, pages, or styling in Kintsugi frontend. Reference for colors, spacing, components, and visual patterns.
---

# Kintsugi Design System

## Overview

Dark-first task management UI with minimal chrome. Focus on content density and clear visual hierarchy through subtle opacity variations and spacing.

## Color System

### White Opacity Scale (Primary)

Use white with opacity instead of CSS variables for most UI elements:

| Class | Usage |
|-------|-------|
| `white/90` | Primary text, titles |
| `white/70` | Secondary text |
| `white/50` | Muted text, placeholders |
| `white/40` | Inactive/disabled states |
| `white/30` | Faint text |
| `white/25` | Very faint text |
| `white/20` | Icon overlays |
| `white/15` | Subtle borders (active state) |
| `white/10` | Light hover states |
| `white/8` | Slight background tint, badges |
| `white/[0.04]` | Card backgrounds, hover states |
| `white/[0.02]` | Subtle elevated surfaces |

### Status Colors

| Status | Background | Text |
|--------|------------|------|
| Completed | `bg-emerald-500/15` | `text-emerald-400` |
| In Progress | `bg-amber-500/20` | `text-amber-400` |
| Pending | `bg-white/8` | `text-white/40` |
| Failed | `bg-red-500/15` | `text-red-400` |

### Category Badges

| Category | Background | Text |
|----------|------------|------|
| Types | `bg-cyan-500/15` | `text-cyan-400` |
| Functional | `bg-sky-500/15` | `text-sky-400` |
| Fix | `bg-rose-500/15` | `text-rose-400` |
| Test | `bg-violet-500/15` | `text-violet-400` |
| Refactor | `bg-emerald-500/15` | `text-emerald-400` |
| Cleanup | `bg-slate-500/15` | `text-slate-400` |
| Docs | `bg-indigo-500/15` | `text-indigo-400` |

## Typography

- **Font**: System sans-serif (Inter preferred)
- **Primary text**: `text-[13px] tracking-[-0.01em] leading-[1.4] font-medium`
- **Secondary text**: `text-[12px] tracking-[-0.01em]`
- **Small labels**: `text-[11px]`, `text-[10px]`
- **Badge text**: `text-[9px] uppercase tracking-wider font-medium`
- **Completed items**: Strikethrough + reduced opacity

## Component Patterns

### Cards/Containers

```tsx
<div className="
  bg-white/[0.02] border border-white/[0.04] rounded-lg px-3.5 py-3
  hover:bg-white/[0.04] hover:border-white/[0.08]
  hover:shadow-[0_2px_8px_rgba(0,0,0,0.3)]
  active:scale-[0.99] active:border-white/15
  transition-all duration-150 ease-out
">
```

### Drag Handle
- 6 dots (2x3 grid) on left of draggable items
- Color: `text-white/40`
- Hover: `text-white/70`
- Cursor: grab

### Checkboxes
- Shape: Circle (rounded)
- Size: `h-[18px] w-[18px] rounded-[5px] border-[1.5px]`
- Unchecked: `border-white/25 bg-transparent`
- Unchecked hover: `border-white/45 bg-white/4`
- Checked: `border-white/90 bg-white/90` with white checkmark
- In Progress: `border-amber-500 bg-amber-500/20` with amber minus

### Progress/Count Badges

```tsx
// All complete
<span className="rounded-full px-1.5 py-0.5 bg-emerald-500/15 text-emerald-400 text-[10px] font-medium">
  {completed}/{total}
</span>

// Partial
<span className="rounded-full px-1.5 py-0.5 bg-white/6 text-white/45 text-[10px] font-medium">
  {completed}/{total}
</span>
```

### Category/Status Badges

```tsx
<span className="rounded-full px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-wider bg-{color}-500/15 text-{color}-400">
  {category}
</span>
```

### Buttons

**Icon buttons**
```tsx
<button className="
  p-1.5 rounded-md
  text-white/40 hover:text-white/70
  hover:bg-white/[0.04]
  active:scale-90
  transition-all duration-150 ease-out
">
```

**Text buttons**
- No background
- Color: `text-white/40` → `hover:text-white/70`

### Input Fields

```tsx
<input className="
  bg-transparent border border-white/10
  text-white/70 placeholder:text-white/25
  focus:border-white/20 focus:bg-white/[0.04]
  rounded-md px-3 h-9
  transition-all duration-150
"/>
```

### Breadcrumb Navigation
```
Project / Section / Item
```
- Separator: ` / ` with spaces
- All segments clickable except current
- Text: `text-white/50` → `hover:text-white/70`

### Dropdown Menus
- Background: `bg-white/[0.02]`
- Border: `border-white/[0.08]`
- Items with chevron `>` indicate submenu
- Icons on left of menu items

### Modals
- Dark overlay background
- Container: `bg-white/[0.02] border border-white/[0.08]`
- Header with icon, title, close X

## Lists

**Project/Folder card:**
```tsx
<div className="
  rounded-lg bg-white/[0.02] border border-white/[0.04] px-3.5 py-3
  hover:bg-white/[0.04] hover:border-white/[0.08]
  hover:shadow-[0_2px_8px_rgba(0,0,0,0.3)]
  active:scale-[0.99]
  transition-all duration-150 ease-out
">
  <div className="flex items-center gap-2">
    <DragHandle />
    <h3 className="text-[13px] font-medium text-white/90 tracking-[-0.01em]">{name}</h3>
    <span className="rounded-full px-2 py-0.5 bg-white/8 text-white/50 text-[11px] font-medium">
      {count}
    </span>
  </div>
</div>
```

**Task list item:**
```
[Checkbox] Title [+ Add tags] [Progress n/n]
```

**Subtask item:**
```
[Drag] [Checkbox] Title [Category Badge] [Status Badge]
```

## Spacing

- Card padding: `px-3.5 py-3`
- Item vertical gap: `gap-1.5`
- Section gap: `gap-4`
- Inline element gap: `gap-2`

## Transitions

All interactive elements use:
```
transition-all duration-150 ease-out
```

Hover/active states:
- Scale: `active:scale-[0.99]` or `active:scale-90` (icons)
- Border: `hover:border-white/[0.08]`
- Shadow: `hover:shadow-[0_2px_8px_rgba(0,0,0,0.3)]`

## Quick Reference

| Element | Key Classes |
|---------|-------------|
| Page container | `bg-background min-h-screen` |
| Card | `bg-white/[0.02] border border-white/[0.04] rounded-lg px-3.5 py-3` |
| Primary text | `text-white/90 text-[13px] tracking-[-0.01em]` |
| Muted text | `text-white/50` |
| Badge | `rounded-full px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-wider` |
| Drag handle | `cursor-grab text-white/40 hover:text-white/70` |
| Transition | `transition-all duration-150 ease-out` |
