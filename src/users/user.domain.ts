// ---------------------------------------------------------------------------
// Domain model
// ---------------------------------------------------------------------------

export type User = {
  id: string;
  name: string;
  email: string;
};

// ---------------------------------------------------------------------------
// Domain errors
// ---------------------------------------------------------------------------

export type UserNotFoundError = {
  kind: "UserNotFoundError";
  message: string;
};

export type UserAlreadyExistsError = {
  kind: "UserAlreadyExistsError";
  message: string;
};

export type UserValidationError = {
  kind: "UserValidationError";
  message: string;
  fields?: Record<string, string[]>;
};

export type UserError = UserNotFoundError | UserAlreadyExistsError | UserValidationError;

// ---------------------------------------------------------------------------
// Error constructors
// ---------------------------------------------------------------------------

export const userNotFound = (id: string): UserNotFoundError => ({
  kind: "UserNotFoundError",
  message: `User with id "${id}" not found.`,
});

export const userAlreadyExists = (email: string): UserAlreadyExistsError => ({
  kind: "UserAlreadyExistsError",
  message: `A user with email "${email}" already exists.`,
});

export const userValidationError = (
  message: string,
  fields?: Record<string, string[]>
): UserValidationError => ({
  kind: "UserValidationError",
  message,
  ...(fields !== undefined && { fields }),
});
