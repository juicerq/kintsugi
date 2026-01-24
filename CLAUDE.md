# Kintsugi

Desktop application built with Tauri 2 + React frontend + Bun tRPC backend.

## Philosophy

This codebase will outlive you. Every shortcut becomes someone else's burden. Every hack compounds into technical debt that slows the whole team down.

You are not just writing code. You are shaping the future of this project. The patterns you establish will be copied. The corners you cut will be cut again.

Fight entropy. Leave the codebase better than you found it.

## What is Kintsugi

Task management for developers with AI-powered workflow.

### Core Concept

- **Projects** - Containers for work (e.g., "Client X", "Side Project Y")
- **Tasks** - Individual work items within projects
- **Subtasks** - AI-generated implementation steps

### Workflow

1. Add task to project (from boss, own idea, etc.)
2. Brainstorm → Architecture → Review (AI-assisted)
3. AI generates subtasks based on context
4. Each subtask runs in isolated AI session
5. Track progress, key decisions, changed files

## Stack

| Layer | Technology |
|-------|------------|
| Desktop Shell | Tauri 2 |
| Frontend | React 19 + TanStack Router + TanStack Query |
| Backend | Bun + tRPC + bun:sqlite |
| Type Safety | tRPC (end-to-end) + Zod |
| Build | Vite + Bun |

## Structure

```
kintsugi/
├── apps/
│   ├── desktop/     # Tauri + React frontend (see apps/desktop/CLAUDE.md)
│   └── server/      # Bun tRPC server (see apps/server/CLAUDE.md)
├── packages/
│   └── shared/      # Shared types (AppRouter)
└── package.json     # Bun workspaces
```

## Build Commands

```bash
# Development (user only - never run these)
bun run dev:server     # Start tRPC server
bun run dev:desktop    # Start Tauri dev (requires server)

# Building
bun run build:server   # Compile server to sidecar
bun run build          # Full production build
```

## Global Conventions

- Never use barrel imports
- tRPC for all client-server communication (no Tauri invoke)
- Always prefer early returns over nested conditions
- Avoid `else` blocks whenever possible - use early returns instead
- Avoid nested ifs - flatten logic with early returns to prevent layers of `{}` that hurt readability
