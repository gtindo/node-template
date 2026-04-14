import { z } from "zod";
import { ok, err, type Result } from "../../result";
import { userNotFound, userValidationError, type User, type UserNotFoundError, type UserValidationError } from "../../domain/user";
import type { UserRepository } from "../../ports/user-repository";

// ---------------------------------------------------------------------------
// Input schema
// ---------------------------------------------------------------------------

const GetUserSchema = z.object({
  id: z.string().uuid("User id must be a valid UUID."),
});

// ---------------------------------------------------------------------------
// Deps
// ---------------------------------------------------------------------------

export type GetUserDeps = {
  userRepo: () => UserRepository;
};

// ---------------------------------------------------------------------------
// Use case
// ---------------------------------------------------------------------------

export async function getUser(
  input: unknown,
  deps: GetUserDeps
): Promise<Result<User, UserNotFoundError | UserValidationError>> {
  const parsed = GetUserSchema.safeParse(input);

  if (!parsed.success) {
    const fields = parsed.error.flatten().fieldErrors as Record<string, string[]>;
    return err(userValidationError("Invalid input.", fields));
  }

  const { id } = parsed.data;
  const user = await deps.userRepo().getUserById(id);

  if (!user) {
    return err(userNotFound(id));
  }

  return ok(user);
}
