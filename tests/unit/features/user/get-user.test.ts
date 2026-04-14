import { describe, it, expect, beforeEach } from "vitest";
import { getUser } from "../../../../src/core/features/user/get-user";
import { createInMemoryUserRepository } from "../../../helpers/in-memory-user-repository";
import type { User } from "../../../../src/core/domain/user";

const ALICE: User = { id: "550e8400-e29b-41d4-a716-446655440000", name: "Alice", email: "alice@example.com" };

describe("getUser", () => {
  let repo: ReturnType<typeof createInMemoryUserRepository>;

  beforeEach(() => {
    repo = createInMemoryUserRepository([ALICE]);
  });

  const deps = () => ({ userRepo: () => repo });

  it("returns the user when found", async () => {
    const [user, error] = await getUser({ id: ALICE.id }, deps());
    expect(error).toBeNull();
    expect(user).toEqual(ALICE);
  });

  it("returns UserNotFoundError when user does not exist", async () => {
    const [user, error] = await getUser({ id: "550e8400-e29b-41d4-a716-446655440001" }, deps());
    expect(user).toBeNull();
    expect(error?.kind).toBe("UserNotFoundError");
  });

  it("returns UserValidationError when id is not a UUID", async () => {
    const [user, error] = await getUser({ id: "not-a-uuid" }, deps());
    expect(user).toBeNull();
    expect(error?.kind).toBe("UserValidationError");
  });

  it("returns UserValidationError when id is missing", async () => {
    const [user, error] = await getUser({}, deps());
    expect(user).toBeNull();
    expect(error?.kind).toBe("UserValidationError");
  });
});
