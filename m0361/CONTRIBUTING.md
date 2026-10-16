# Contributing

## Branching
- `main` — production
- `develop` — integration
- `feat/<scope>` / `fix/<scope>` — PRs target `develop`

## Setup
```bash
npm ci
cp .env.example .env  # fill JWT_SECRET (≥32 chars), MONGO_URI
npm run dev           # vite on 5173
npm run server:dev    # api on 5000 (with --watch)
```

## Scripts
- `npm run lint` / `lint:fix` — eslint 9 flat config
- `npm run format:check` / `format` — prettier
- `npm test` / `test:coverage` — vitest + jsdom + @testing-library/react
- `npm run build` — vite production (checks ci)
- `npm run server` — node server/server.js

## PR checklist
- [ ] `npm run lint` clean
- [ ] `npm test` green
- [ ] No secrets in diff
- [ ] Update `ARCHITECTURE.md` if structure changes
