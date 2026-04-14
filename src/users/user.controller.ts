import { getUser, createUser, type UserDeps } from "./user.features";
import type { Controller, Request, Response } from "../shared/http/port";

// ---------------------------------------------------------------------------
// GET /users/:id
// ---------------------------------------------------------------------------

export const getUserController: Controller<unknown, UserDeps> = async (
  req: Request,
  _state: unknown,
  deps: UserDeps
): Promise<Response> => {
  const [user, error] = await getUser({ id: req.params["id"] }, deps);

  if (error) {
    const status = error.kind === "UserNotFoundError" ? 404 : 400;
    return { status, body: { error: error.message, kind: error.kind } };
  }

  return { status: 200, body: user };
};

// ---------------------------------------------------------------------------
// POST /users
// ---------------------------------------------------------------------------

export const createUserController: Controller<unknown, UserDeps> = async (
  req: Request,
  _state: unknown,
  deps: UserDeps
): Promise<Response> => {
  const [user, error] = await createUser(req.body, deps);

  if (error) {
    const status = error.kind === "UserAlreadyExistsError" ? 409 : 400;
    return { status, body: { error: error.message, kind: error.kind } };
  }

  return { status: 201, body: user };
};
