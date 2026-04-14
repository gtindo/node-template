import type { PrismaClient } from "../generated/prisma/client";
import type { UserRepository, CreateUserInput } from "../core/ports/user-repository";
import type { User } from "../core/domain/user";
import { DatabaseClient } from "./db";

export function createPrismaUserAdapter(db: PrismaClient): UserRepository {
  const getUserById = async (id: string): Promise<User | null> => {
    const user = await db.user.findFirst({ where: { id } });
    if (!user) return null;
    return { id: user.id, name: user.name, email: user.email };
  };

  const getUserByName = async (name: string): Promise<User | null> => {
    const user = await db.user.findFirst({ where: { name } });
    if (!user) return null;
    return { id: user.id, name: user.name, email: user.email };
  };

  const createUser = async (input: CreateUserInput): Promise<User> => {
    const user = await db.user.create({ data: input });
    return { id: user.id, name: user.name, email: user.email };
  };

  const execInTransaction = async <T>(
    fn: (repo: UserRepository) => Promise<T>
  ): Promise<T> => {
    return db.$transaction(async (tx) => {
      const txRepo = createPrismaUserAdapter(tx as PrismaClient);
      return fn(txRepo);
    });
  };

  return { getUserById, getUserByName, createUser, execInTransaction };
}

/** Convenience factory returning the singleton-backed adapter. */
export function userRepository(): UserRepository {
  return createPrismaUserAdapter(DatabaseClient.getInstance());
}
