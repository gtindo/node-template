import type { User } from "./user.domain";

export type GetUserById = (id: string) => Promise<User | null>;
export type GetUserByName = (name: string) => Promise<User | null>;

export type CreateUserInput = {
  name: string;
  email: string;
};

export type CreateUser = (input: CreateUserInput) => Promise<User>;

export interface UserRepository {
  getUserById: GetUserById;
  getUserByName: GetUserByName;
  createUser: CreateUser;
  execInTransaction: <T>(fn: (repo: UserRepository) => Promise<T>) => Promise<T>;
}
