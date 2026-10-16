# VentureBridge — Enterprise Architecture

## Overview
VentureBridge is a multi-tenant MERN discovery platform connecting entrepreneurs ↔ investors. Enterprise build focuses on security, observability, scalability and DX.

## Frontend (`/src`)
```
src/
  components/
    ui/           # Button, Input, Card, Modal, Badge — design system primitives
    common/       # ErrorBoundary, Loading, EmptyState
  hooks/          # useDebounce, usePagination, useSocket, useAuth
  utils/          # format, validators
  constants/      # ROLES, INDUSTRIES, NAV_CONFIG
  context/        # AuthContext (JWT httpOnly)
  services/       # api.js — centralized fetch wrapper with credentials
  pages/
    auth/         # Login, Register (react-hook-form + zod-ready)
    entrepreneur/ # EntrepreneurDashboard
    investor/     # InvestorDashboard, InvestorProfile
    startup/      # StartupProfile (CRUD)
    discover/     # DiscoverInvestors, DiscoverStartups (faceted search)
    requests/     # Requests (received/sent + accept/reject)
    connections/  # Connections grid
    chat/         # Messages (Socket.IO + REST fallback)
    notifications/# Notifications (mark read)
    admin/        # AdminDashboard (stats + recharts), AdminUsers, AdminStartups
    Documents, Settings, Favourites
  layouts/        # DashboardLayout (role-based nav)
  test/           # vitest setup + smoke tests
```

Routing: `src/App.jsx` — `BrowserRouter` + `Suspense` lazy boundaries + `ProtectedRoute`/`PublicRoute` + `ErrorBoundary`. Vite code-splitting via `manualChunks`.

Styling: `src/styles.css` — DM Sans + Plus Jakarta Sans + enterprise utility fallbacks (Tailwind-lite). No Tailwind build required but ready for Tailwind/PostCSS if added.

State: `AuthContext` + local component state. Ready for Redux/Zustand without refactor.

## Backend (`/server`)
```
server/
  server.js          # dotenv + graceful shutdown (SIGTERM/SIGINT) + httpServer + socket
  src/
    app.js           # helmet, cors (allowlist), mongoSanitize, hpp, requestId, morgan → logger, granular rate-limit, health/ready
    config/
      env.js         # typed env validation (fails fast in prod)
      constants.js   # ROLES, INDUSTRIES, etc.
      db.js          # mongoose connect with retry hints
    utils/
      logger.js      # leveled logger (error/warn/info/debug/http)
      ApiError.js    # operational error class
      ApiResponse.js # success/created/paginated helpers
      asyncHandler.js
      pagination.js  # parsePagination + buildPaginationMeta
    middleware/
      authMiddleware.js  # protect + allowRoles
      errorMiddleware.js # handles ValidationError, 11000, CastError + requestId
      requestId.js       # x-request-id or uuid
      security.js        # mongoSanitize, hpp, noCache
      validate.js        # zod safeParse wrapper
    validators/
      schemas.js     # zod schemas (with ESM fallback stub)
    models/          # User, Startup, InvestorProfile, CollaborationRequest, Connection, Conversation, Message, Favourite, Notification, Document, Report
    controllers/     # thin handlers delegating to services/models
    routes/          # versioned under /api/*
    services/
      matchingService.js
      notificationService.js
    socket/
      socketHandler.js # auth via cookie/jwt + rooms + typing + message:new + notifications
    scripts/
      createAdmin.js
      seedData.js
```

## Cross-cutting concerns
- **Security**: helmet, cors allowlist, httpOnly jwt cookie (7d), bcrypt 12 rounds, rate-limit (300/15m + 20/15m auth), mongoSanitize, hpp, `X-Content-Type-Options` etc., role middleware.
- **Observability**: `logger` + morgan http logs + `x-request-id` propagated in responses, `/api/health` + `/api/ready`, graceful shutdown, socket connect/disconnect logs.
- **DX**: `vite.config.js` (aliases `@/`, `@components` etc., proxy, chunking), `eslint.config.js` + `.prettierrc`, `.editorconfig`, `.vscode` settings, `vitest` smoke tests.
- **DevOps**: `Dockerfile` multi-stage (base→build→production) + `docker-compose.yml` (mongo, api, nginx), `nginx.conf` (SPA fallback, /api proxy, gzip), GitHub Actions `ci.yml` + `deploy.yml`, `.gitignore`.

## Data flow
1. Auth: `POST /api/auth/register|login` → httpOnly `token` cookie + JWT → `protect` reads cookie or `Authorization: Bearer`.
2. Matching: `GET /api/matching/*` → `matchingService.calculateStartupInvestorMatch` (weights 30/25/15/10/10/10) → score + factors.
3. Chat: Socket.IO `message:send` → persist `Message` + update `Conversation` unreadCount + `Connection.lastActivity` → emit `message:new` + `notification:new` + create `Notification`.
4. Discovery: `GET /api/startups?search&industry&stage&page&limit` with pagination meta.

## Scaling notes
- Stateless API → horizontal via `docker-compose` or k8s (add Redis for socket adapter + rate-limit store).
- Ready for `zod` strict validation, `compression`, `express-mongo-sanitize` npm, `winston` if log volume grows, and `swagger-jsdoc` for OpenAPI.
