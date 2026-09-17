# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev        # Start dev server at http://localhost:5173 (hot reload)
npm run build      # Production build to dist/
npm run preview    # Preview the production build locally
npm run lint       # Run oxlint
```

No test runner is configured.

## Architecture

Single-file React app — all logic lives in `src/App.jsx`. There are no routes, no external state libraries, and no backend.

**Data flow:**
- `useGastos()` custom hook owns all state. It reads/writes to `localStorage` under the key `finca_gastos`. Every mutation (`add`, `update`, `remove`) goes through this hook.
- `App` renders everything: summary cards, progress bar, table, and the add form.
- Computed values (`totalGastado`, `filteredTotal`, `filtered`) are derived via `useMemo` inside `App`.

**Persistence:** `localStorage` only — no server, no auth. Data survives page reloads but is browser-local.

**Styling:** Plain CSS in `src/App.css` (no CSS modules, no Tailwind). `src/index.css` is a minimal global reset.

**Budget constant:** `PRESUPUESTO = 142_000_000` (COP) is hardcoded at the top of `App.jsx`. Change it there if the budget changes.

**Linter:** oxlint with React hooks rules. Config in `.oxlintrc.json`. No TypeScript — plain JSX.
