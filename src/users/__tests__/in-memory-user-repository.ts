import type { User } from "../user.domain";
import type { UserRepository, CreateUserInput } from "../user.port";

/**
 * In-memory UserRepository for use in unit tests.
 * Starts empty; seed it via the returned `seed` helper.
 */
export function createInMemoryUserRepository(initial: User[] = []): UserRepository & {
  seed: (users: User[]) => void;
  all: () => User[];
} {
  const store = new Map<string, User>(initial.map((u) => [u.id, u]));
  let nextId = initial.length + 1;

  const getUserById = async (id: string): Promise<User | null> =>
    store.get(id) ?? null;

  const getUserByName = async (name: string): Promise<User | null> =>
    Array.from(store.values()).find((u) => u.name === name) ?? null;

  const createUser = async (input: CreateUserInput): Promise<User> => {
    const user: User = { id: String(nextId++), ...input };
    store.set(user.id, user);
    return user;
  };

  const execInTransaction = async <T>(
    fn: (repo: UserRepository) => Promise<T>
  ): Promise<T> => fn(repo);

  const repo = { getUserById, getUserByName, createUser, execInTransaction };

  return {
    ...repo,
    seed: (users: User[]) => {
      store.clear();
      for (const u of users) store.set(u.id, u);
    },
    all: () => Array.from(store.values()),
  };
}
