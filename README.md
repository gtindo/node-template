# node-template

A TypeScript/Node.js boilerplate for building backend services with a **functional core / imperative shell** architecture in an onion style.

The core is **framework-agnostic**: it knows nothing about Express, Prisma, or any infrastructure. HTTP and database concerns live at the edges and plug in through ports.

---

## Structure

The layout is **feature-first**. Everything about a domain concept lives together. Only genuinely cross-cutting concerns live in `shared/`.

```
src/
├── shared/                            # Cross-cutting, reusable across all features
│   ├── result.ts                      # Result<T, E> tuple type
│   ├── http/
│   │   ├── port.ts                    # Request/Response/Controller/Action types
│   │   └── adapters/
│   │       └── express.ts             # expressAdapter() — bridges Express ↔ port
│   └── infrastructure/
│       └── db.ts                      # PrismaClient singleton
│
├── users/                             # Everything about users, co-located
│   ├── user.domain.ts                 # User type, domain error types & constructors
│   ├── user.port.ts                   # UserRepository interface
│   ├── user.prisma.ts                 # Prisma implementation of UserRepository
│   ├── user.features.ts               # Use case functions
│   ├── user.controller.ts             # HTTP controllers (GET /users/:id, POST /users)
│   └── __tests__/                     # Tests co-located with the feature
│       ├── in-memory-user-repository.ts  # Fast in-memory UserRepository for unit tests
│       ├── user.features.test.ts      # Unit tests (no DB)
│       └── user.prisma.test.ts        # Integration tests (real SQLite)
│
└── app.ts                             # Composition root — wires everything together
```

### How the structure grows

This layout works for small projects as-is. As the codebase grows:

- **New feature** → add a new folder (e.g. `src/posts/`, `src/billing/`) with its own `*.domain.ts`, `*.port.ts`, `*.prisma.ts`, `*.features.ts`, `*.controller.ts`.
- **Shared infrastructure** → if a DB helper, queue client, or other adapter is used by multiple features, it goes in `shared/infrastructure/`.
- **Shared domain concepts** → if a type is referenced across multiple features (e.g. a `Money` value object), it goes in `shared/domain/`.
- **The `users/` folder never grows into other features** — each feature stays self-contained.

### Layer rules

| Location | May import from | Must NOT import from |
|---|---|---|
| `users/user.domain.ts` | nothing | anywhere else |
| `users/user.port.ts` | `user.domain.ts` | `user.prisma.ts`, `shared/infrastructure/`, Express |
| `users/user.features.ts` | `user.domain.ts`, `user.port.ts`, `shared/result.ts` | `user.prisma.ts`, `shared/infrastructure/`, Express |
| `users/user.prisma.ts` | `user.domain.ts`, `user.port.ts`, `shared/infrastructure/` | `user.features.ts`, `shared/http/` |
| `users/user.controller.ts` | `user.features.ts`, `shared/http/port.ts` | `user.prisma.ts`, `shared/infrastructure/` |
| `app.ts` | everywhere | — |

### Result type

All use cases return `Result<T, E>` — a Go-style tuple:

```ts
type Result<T, E = Error> = [T, null] | [null, E];

// Usage
const [user, err] = await getUser({ id }, deps);
if (err) { /* handle */ }
// user is narrowed to T here
```

Helper constructors: `ok(value)` and `err(error)`.

### HTTP port

Controllers are **pure functions** — no Express objects leak into the core:

```ts
type Controller<State, Deps> = (
  request: Request,   // internal, framework-agnostic
  state: State,       // from res.locals (e.g. auth middleware output)
  deps: Deps          // injected at wiring time
) => Promise<Response | void>;
```

`expressAdapter(controller, deps)` translates between Express and the internal port.

An optional `Action<State>` can be passed as a third argument for fire-and-forget post-response side effects (audit logs, analytics, etc.).

---

## Quick start

```bash
# 1. Clone and install
git clone <repo>
npm install

# 2. Set up environment
cp .env.example .env        # or create .env with DATABASE_URL

# 3. Run migrations and generate Prisma client
npm run db:migrate
npm run db:generate

# 4. Start dev server (tsx watch)
npm run dev
```

### Environment variables

| Variable | Description | Example |
|---|---|---|
| `DATABASE_URL` | Prisma connection string | `file:./prisma/dev.db` |
| `PORT` | HTTP port (optional, default 3000) | `3000` |

---

## Scripts

| Script | Description |
|---|---|
| `npm run dev` | Start dev server with hot reload (`tsx watch`) |
| `npm run build` | Compile TypeScript to `dist/` |
| `npm start` | Run compiled output from `dist/` |
| `npm test` | Run unit tests — `*.features.test.ts` (no DB needed) |
| `npm run test:integration` | Run integration tests — `*.prisma.test.ts` (requires `DATABASE_URL`) |
| `npm run test:all` | Run all tests |
| `npm run test:watch` | Watch unit tests |
| `npm run db:migrate` | Run Prisma migrations (dev) |
| `npm run db:migrate:prod` | Deploy migrations (production) |
| `npm run db:generate` | Regenerate Prisma client after schema changes |

---

## Adding a new feature

1. Create `src/<feature>/` folder.
2. `<feature>.domain.ts` — domain type + typed error constructors.
3. `<feature>.port.ts` — repository interface.
4. `<feature>.prisma.ts` — Prisma adapter implementing the port.
5. `<feature>.features.ts` — use case functions: accept `(input: unknown, deps)`, validate with Zod, return `Result<T, E>`.
6. `<feature>.controller.ts` — HTTP controllers: map `Result` errors to status codes.
7. Wire routes in `app.ts` via `expressAdapter`.
8. Create `src/<feature>/__tests__/`:
   - `in-memory-<feature>-repository.ts` — in-memory port implementation for unit tests.
   - `<feature>.features.test.ts` — unit tests, no DB.
   - `<feature>.prisma.test.ts` — integration tests against real DB.

---

## Running integration tests

Integration tests hit a real SQLite database. Point `DATABASE_URL` at a test database so the dev database is never touched:

```bash
# First time only — create and migrate the test DB
DATABASE_URL="file:./prisma/test.db" npx prisma migrate deploy

# Then run integration tests
npm run test:integration
```

The `beforeEach` hook calls `prisma.<model>.deleteMany()` to ensure a clean slate between tests.
