import { z } from "zod";
import { ok, err, type Result } from "../shared/result";
import {
  userNotFound,
  userAlreadyExists,
  userValidationError,
  type User,
  type UserNotFoundError,
  type UserAlreadyExistsError,
  type UserValidationError,
} from "./user.domain";
import type { UserRepository } from "./user.port";

// ---------------------------------------------------------------------------
// Shared deps type
// ---------------------------------------------------------------------------

export type UserDeps = {
  userRepo: () => UserRepository;
};

// ---------------------------------------------------------------------------
// getUser
// ---------------------------------------------------------------------------

const GetUserSchema = z.object({
  id: z.string().uuid("User id must be a valid UUID."),
});

export async function getUser(
  input: unknown,
  deps: UserDeps
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

// ---------------------------------------------------------------------------
// createUser
// ---------------------------------------------------------------------------

const CreateUserSchema = z.object({
  name: z.string().min(1, "Name must not be empty.").max(100),
  email: z.string().email("Must be a valid email address."),
});

export async function createUser(
  input: unknown,
  deps: UserDeps
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
