import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { PrismaClient } from "../../generated/prisma/client";
import { createPrismaUserAdapter } from "../user.prisma";

/**
 * Integration tests for the Prisma UserRepository adapter.
 *
 * Uses a separate SQLite test database so the dev database is never touched.
 * Run with: npm run test:integration
 */

let prisma: PrismaClient;

beforeAll(async () => {
  prisma = new PrismaClient();
  await prisma.$connect();
});

afterAll(async () => {
  await prisma.$disconnect();
});

beforeEach(async () => {
  await prisma.user.deleteMany();
});

describe("createPrismaUserAdapter", () => {
  it("createUser — inserts and returns the new user", async () => {
    const repo = createPrismaUserAdapter(prisma);
    const user = await repo.createUser({ name: "Alice", email: "alice@example.com" });

    expect(user.name).toBe("Alice");
    expect(user.email).toBe("alice@example.com");
    expect(user.id).toBeDefined();

    const found = await repo.getUserById(user.id);
    expect(found).toEqual(user);
  });

  it("getUserById — returns null when not found", async () => {
    const repo = createPrismaUserAdapter(prisma);
    const user = await repo.getUserById("non-existent-id");
    expect(user).toBeNull();
  });

  it("getUserByName — returns the user when found", async () => {
    const repo = createPrismaUserAdapter(prisma);
    const created = await repo.createUser({ name: "Bob", email: "bob@example.com" });
    const found = await repo.getUserByName("Bob");
    expect(found).toEqual(created);
  });

  it("getUserByName — returns null when not found", async () => {
    const repo = createPrismaUserAdapter(prisma);
    const user = await repo.getUserByName("Ghost");
    expect(user).toBeNull();
  });

  it("execInTransaction — commits changes within a transaction", async () => {
    const repo = createPrismaUserAdapter(prisma);

    const result = await repo.execInTransaction(async (txRepo) => {
      return txRepo.createUser({ name: "Charlie", email: "charlie@example.com" });
    });

    expect(result.name).toBe("Charlie");

    const persisted = await repo.getUserById(result.id);
    expect(persisted).toEqual(result);
  });
});
