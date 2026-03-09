# Neon Stack Tetris

Responsive Tetris built with React Router in SPA mode. The app keeps the game rules in a pure domain engine, pushes keyboard and timer orchestration into a client usecase Hook, and keeps the UI layer presentational.

![Neon Stack Tetris screenshot](./docs/tetris-screenshot.png)

## Features

- 7-bag randomizer with hold, ghost piece, soft drop, and hard drop
- score, lines, level, and gravity ramp
- local high score persistence with `localStorage`
- keyboard and touch controls for desktop and mobile
- React Router SPA structure with FlatRoutes
- Vitest coverage for core game engine behavior

## Stack

- React 19
- React Router 7
- TypeScript
- Vite
- TailwindCSS v4
- Vitest

## Development

Install dependencies and start the app:

```bash
npm install
npm run dev
```

Default local URL:

```text
http://localhost:5173
```

## Quality Gates

```bash
npm test
npm run typecheck
npm run build
```

## Controls

| Action | Keys |
| --- | --- |
| Move left / right | `ArrowLeft` / `ArrowRight`, `A` / `D` |
| Soft drop | `ArrowDown`, `S` |
| Hard drop | `Space` |
| Rotate clockwise | `ArrowUp`, `X` |
| Rotate counter clockwise | `Z` |
| Hold piece | `C`, `Shift` |
| Pause | `P`, `Escape` |
| Restart | `R` |

## Architecture

```text
app/
  routes/                     Route composition only
  components/tetris/         Presentational UI
  lib/client/usecase/tetris/ Client interaction flow
  lib/client/infrastructure/ Browser adapters
  lib/domain/                Pure game rules and value objects
```

The domain engine lives in [app/lib/domain/services/tetris-engine.ts](./app/lib/domain/services/tetris-engine.ts), and the main screen orchestration lives in [app/lib/client/usecase/tetris/use-tetris.ts](./app/lib/client/usecase/tetris/use-tetris.ts).
