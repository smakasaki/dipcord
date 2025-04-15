import type { User, UserRole } from "../entities/user.js";

export type CreateUser = Omit<User, 'id' | 'roles' | 'createdAt' | 'updatedAt'> & {
  password: string;
};

export type UpdateUser = Partial<Pick<User, 'name' | 'surname' | 'email'>>;

export type UpdateUserRoles = {
  roles: UserRole[];
};

export type Login = Pick<CreateUser, 'email' | 'password'>;

export type AuthToken = {
  accessToken: string;
};

export type PasswordHashWithSalt = {
  hash: string;
  salt: string;
};