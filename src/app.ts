import express, { type Request, type Response, type NextFunction } from "express";
import { expressAdapter } from "./shared/http/adapters/express";
import { getUserController, createUserController } from "./users/user.controller";
import { userRepository } from "./users/user.prisma";

const app = express();

// ---------------------------------------------------------------------------
// Middleware
// ---------------------------------------------------------------------------

app.use(express.json());

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------

const userDeps = { userRepo: userRepository };

app.get("/users/:id", expressAdapter(getUserController, userDeps));
app.post("/users", expressAdapter(createUserController, userDeps));

// ---------------------------------------------------------------------------
// Global error handler
// ---------------------------------------------------------------------------

// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ error: "Internal server error" });
});

// ---------------------------------------------------------------------------
// Server
// ---------------------------------------------------------------------------

const PORT = process.env["PORT"] ? Number(process.env["PORT"]) : 3000;

app.listen(PORT, () => {
  console.info(`Server started on port ${PORT}`);
});
