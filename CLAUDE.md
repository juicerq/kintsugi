# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build Commands

```bash
bun run dev     # Start Tauri dev server (Vite on port 1420 + Tauri). never run this, this is a user only command
bun run build  # TypeScript compile + Vite build. only run when building for releases
bun tauri dev     # Direct Tauri development. never run this, this is a user only command
bun tauri build   # Production bundle for current platform
bun tauri 
```

## Architecture

This is a Tauri 2 desktop application with a React frontend.

**Frontend (src/):** React 19 + TypeScript + Vite. Entry point is `main.tsx`, main component is `App.tsx`.

**Backend (src-tauri/):** Rust with Tauri 2. Entry point is `main.rs` which delegates to `lib.rs` for app setup and command handlers.

**IPC Pattern:** Frontend uses `invoke()` from `@tauri-apps/api/core` to call Rust commands. Commands are registered in `lib.rs` via `tauri::generate_handler![]` macro.

**Example IPC flow:**
- Frontend: `invoke("greet", { name })`
- Backend: `#[tauri::command] fn greet(name: &str) -> String`

## Key Configuration Files

- `src-tauri/tauri.conf.json` - Tauri app config (app ID, window settings, build commands)
- `src-tauri/Cargo.toml` - Rust dependencies
- `src-tauri/capabilities/default.json` - Tauri permissions/capabilities
- `vite.config.ts` - Vite bundler config
- `tsconfig.json` - TypeScript config (strict mode, ES2020 target)
