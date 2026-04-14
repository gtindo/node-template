import { z } from "zod";
import { ok, err, type Result } from "../../result";
import { userAlreadyExists, userValidationError, type User, type UserAlreadyExistsError, type UserValidationError } from "../../domain/user";
import type { UserRepository } from "../../ports/user-repository";

// ---------------------------------------------------------------------------
// Input schema
// ---------------------------------------------------------------------------

const CreateUserSchema = z.object({
  name: z.string().min(1, "Name must not be empty.").max(100),
  email: z.string().email("Must be a valid email address."),
});

// ---------------------------------------------------------------------------
// Deps
// ---------------------------------------------------------------------------

export type CreateUserDeps = {
  userRepo: () => UserRepository;
};

// ---------------------------------------------------------------------------
// Use case
// ---------------------------------------------------------------------------

export async function createUser(
  input: unknown,
  deps: CreateUserDeps
): Promise<Result<User, UserAlreadyExistsError | UserValidationError>> {
  const parsed = CreateUserSchema.safeParse(input);

  if (!parsed.success) {
    const fields = parsed.error.flatten().fieldErrors as Record<string, string[]>;
    return err(userValidationError("Invalid input.", fields));
  }

  const { name, email } = parsed.data;

  const existing = await deps.userRepo().getUserByName(name);
  if (existing) {
    return err(userAlreadyExists(email));
  }

  const user = await deps.userRepo().createUser({ name, email });
  return ok(user);
}
