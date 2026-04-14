# hexagonal-nodejs

A TypeScript/Node.js boilerplate for building backend services with a **functional core / imperative shell** architecture in an onion style.

The core is **framework-agnostic**: it knows nothing about Express, Prisma, or any infrastructure. HTTP and database concerns live at the edges and plug in through ports.

---

## Architecture

```
src/
├── core/                          # Pure, framework-agnostic business logic
│   ├── result.ts                  # Result<T, E> tuple type
│   ├── domain/
│   │   └── user.ts                # User type, domain error types & constructors
│   ├── ports/
│   │   └── user-repository.ts     # UserRepository interface (port)
│   └── features/
│       └── user/
│           ├── get-user.ts        # getUser(input, deps) use case
│           └── create-user.ts     # createUser(input, deps) use case
│
├── infrastructure/                # DB adapters (driven/secondary side)
│   ├── db.ts                      # PrismaClient singleton
│   └── user-repository.prisma.ts  # Prisma implementation of UserRepository
│
├── http/                          # HTTP layer (driving/primary side)
│   ├── port.ts                    # Framework-agnostic Request/Response/Controller types
│   ├── adapters/
│   │   └── express.ts             # expressAdapter() — bridges Express ↔ internal port
│   └── controllers/
│       └── user.controller.ts     # getUserController, createUserController
│
└── app.ts                         # Composition root — wires everything together

tests/
├── helpers/
│   └── in-memory-user-repository.ts  # Fast in-memory UserRepository for unit tests
├── unit/
│   └── features/user/
│       ├── get-user.test.ts
│       └── create-user.test.ts
└── integration/
    └── user-repository.prisma.test.ts
```

### Layer rules

| Layer | May import from | Must NOT import from |
|---|---|---|
| `core/` | nothing outside `core/` | `infrastructure/`, `http/`, Express, Prisma |
| `infrastructure/` | `core/` | `http/` |
| `http/` | `core/` | `infrastructure/` (except via deps injection) |
| `app.ts` | everywhere | — |

### Result type

All use cases return `Result<T, E>` — a Go-style tuple:

```ts
type Result<T, E = Error> = [T, null] | [null, E];

// Usage
const [user, err] = await getUser({ id }, deps);
if (err) { /* handle */ }
// user is T here
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
| `npm test` | Run unit tests only (no DB needed) |
| `npm run test:integration` | Run integration tests (requires `DATABASE_URL`) |
| `npm run test:all` | Run all tests |
| `npm run test:watch` | Watch unit tests |
| `npm run db:migrate` | Run Prisma migrations (dev) |
| `npm run db:migrate:prod` | Deploy migrations (production) |
| `npm run db:generate` | Regenerate Prisma client after schema changes |

---

## Adding a new feature

1. **Domain** — add types and error constructors to `src/core/domain/`.
2. **Port** — add methods to the repository interface in `src/core/ports/`.
3. **Use case** — add a function in `src/core/features/<domain>/`. Accept `(input: unknown, deps)`, validate with Zod, return `Result<T, E>`.
4. **Infrastructure** — implement the new port methods in `src/infrastructure/`.
5. **Controller** — add a controller function in `src/http/controllers/`. Map `Result` errors to HTTP status codes.
6. **Wire** — register the route in `src/app.ts` via `expressAdapter`.
7. **Test** — unit test the use case with the in-memory repository; integration test the adapter.

---

## Running integration tests

Integration tests hit a real SQLite database. Point `DATABASE_URL` at a test database so your dev data is not touched:

```bash
DATABASE_URL="file:./prisma/test.db" npm test
```

The `beforeEach` hook in the integration suite calls `prisma.user.deleteMany()` to ensure a clean slate between tests.
