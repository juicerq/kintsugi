---
name: kintsugi-design
description: Use when implementing UI components, pages, or styling in Kintsugi frontend. Reference for colors, spacing, components, and visual patterns.
---

# Kintsugi Design System

## Overview

Dark-first task management UI with minimal chrome. Focus on content density and clear visual hierarchy through subtle color coding and spacing.

## Color Palette

| Token | Value | Usage |
|-------|-------|-------|
| `--background` | `#0d0d0d` | App background |
| `--card` | `#141414` | Card/container backgrounds |
| `--border` | `#262626` | Subtle borders |
| `--foreground` | `#fafafa` | Primary text |
| `--muted-foreground` | `#737373` | Secondary text, placeholders |
| `--success` | `#22c55e` | Completed, success states |
| `--primary` | `#10b981` | Primary actions (OpenCode) |
| `--accent` | `#a855f7` | AI actions (Generate) |
| `--warning` | `#eab308` | Functional category |
| `--info` | `#14b8a6` | Test category |

## Typography

- **Font**: System sans-serif (Inter preferred)
- **Titles**: Bold, white (`--foreground`)
- **Body**: Regular, white
- **Secondary**: Regular, muted (`--muted-foreground`)
- **Completed items**: Strikethrough + muted

## Component Patterns

### Breadcrumb Navigation
```
Project / Section / Item
```
- Separator: ` / ` with spaces
- All segments clickable except current
- Current segment: same style (no bold)
- Right side: action icons (settings gear, plus)

### Cards/Containers
- Background: `--card`
- Border: 1px `--border`
- Border-radius: `--radius` (0.625rem)
- Padding: 16px

### Drag Handle
- 6 dots (2x3 grid) on left of draggable items
- Color: `--muted-foreground`
- Cursor: grab

### Checkboxes
- Shape: Circle (not square)
- Unchecked: Border only, `--border`
- Checked: Filled green (`--success`), white checkmark
- Size: 20px

### Progress/Count Badges
- Format: `n/n` (completed/total)
- With checkmark icon when complete
- Color: `--success` when all complete
- Position: Right-aligned

### Category Badges
| Category | Color | Icon |
|----------|-------|------|
| TEST | Teal (`--info`) | Flask |
| FUNCTIONAL | Yellow (`--warning`) | Sparkles |
| Types | Gray | Code |
| Fix | Orange | Wrench |
| Refactor | Blue | Recycle |
| Cleanup | Gray | Broom |
| Docs | Gray | File |

Badge style: Rounded pill, icon + text, subtle background

### Status Badges
- COMPLETED: Green background, white text, uppercase

### Buttons

**Primary (dropdown)**
```
[Icon] Label [Chevron]
```
- OpenCode: Green (`--primary`)
- Generate: Purple (`--accent`)
- Rounded, with dropdown chevron

**Text buttons**
- No background
- Muted color, hover: foreground
- Examples: "View history", "Run All", "+ Add tags"

### Input Fields
- Background: `--card` or slightly darker
- Border: `--border`
- Placeholder: `--muted-foreground`
- Icons: Right-aligned (tag icon for task input)

### Dropdown Menus
- Background: `--card`
- Border: `--border`
- Items with chevron `>` indicate submenu
- Icons on left of menu items

### Modals
- Dark overlay background
- Card-style container
- Header with icon, title, close X
- Scrollable content area

### Lists

**Task list item:**
```
[Checkbox] Title [+ Add tags] [Progress n/n]
```

**Subtask item:**
```
[Drag] [Checkbox] Title [Category Badge] [Status Badge]
```

**Expandable subtask:**
```
[Drag] [Checkbox] Title [Category] [Status]
  Steps
    [Small checkbox] Step description
    [Small checkbox] Step description
  + Add step...
  Details
    [Category selector chips]
    [Commit toggle] [View notes button]
```

### Execution History
- Timestamp: `Jan 24, 03:55 PM`
- Status badge: SUCCESS (green)
- Description: Truncated with ellipsis
- Duration: Right-aligned (`1s`, `20s`)
- Expandable for full details

## Spacing

- Card padding: 16px
- Item vertical gap: 12px
- Section gap: 24px
- Inline element gap: 8px

## Hierarchy

1. **Page level**: Breadcrumb + main action
2. **Section level**: Section title + section actions
3. **Item level**: Checkbox + content + metadata
4. **Detail level**: Steps, tags, notes (indented/nested)

## Quick Reference

| Element | Key Classes |
|---------|-------------|
| Page container | `bg-background min-h-screen` |
| Card | `bg-card border border-border rounded-lg p-4` |
| Muted text | `text-muted-foreground` |
| Success state | `text-success` |
| Badge | `rounded-full px-2 py-0.5 text-xs font-medium` |
| Drag handle | `cursor-grab text-muted-foreground` |
