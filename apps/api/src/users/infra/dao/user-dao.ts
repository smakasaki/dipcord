import { count, eq } from "drizzle-orm";

import type { PaginatedResult, Pagination, SortBy } from "#commons/app/index.js";
import type { Database } from "#commons/infra/plugins/database.js";
import type { CreateUser, IUserRepository, PasswordHashWithSalt, User } from "#users/app/index.js";

import { buildSortBy } from "#commons/infra/dao/utils.js";
import { users } from "#db/schema/index.js";

/**
 * User Data Access Object
 * Implements IUserRepository interface using Drizzle ORM
 */
export class UserDao implements IUserRepository {
    /**
     * Create a new UserDao
     * @param db Drizzle database instance
     */
    constructor(private readonly db: Database) {}

    /**
     * Create a new user
     * @param userData User data without password
     * @param passwordHash Password hash and salt
     * @returns Created user
     */
    async create(
        userData: Omit<CreateUser, "password">,
        passwordHash: PasswordHashWithSalt,
    ): Promise<User> {
        const result = await this.db
            .insert(users)
            .values({
                name: userData.name,
                surname: userData.surname,
                email: userData.email,
                passwordHash: passwordHash.hash,
                passwordSalt: passwordHash.salt,
            })
            .returning({
                id: users.id,
                name: users.name,
                surname: users.surname,
                email: users.email,
                createdAt: users.createdAt,
                updatedAt: users.updatedAt,
            });

        return result[0] as User;
    }

    /**
     * Find all users with pagination and sorting
     * @param pagination Pagination parameters
     * @param sortBy Sort configuration
     * @returns Paginated users
     */
    async findAll(
        pagination: Pagination,
        sortBy: SortBy<User>,
    ): Promise<PaginatedResult<User>> {
        const countResult = await this.db
            .select({ value: count() })
            .from(users);

        const total = countResult[0]?.value ?? 0;

        const result = await this.db
            .select({
                id: users.id,
                name: users.name,
                surname: users.surname,
                email: users.email,
                createdAt: users.createdAt,
                updatedAt: users.updatedAt,
            })
            .from(users)
            .limit(pagination.limit)
            .offset(pagination.offset)
            .orderBy(...buildSortBy(sortBy));

        return {
            count: total,
            data: result,
        };
    }

    /**
     * Find user by id
     * @param id User id
     * @returns User or undefined if not found
     */
    async findById(id: User["id"]): Promise<User | undefined> {
        const result = await this.db
            .select({
                id: users.id,
                name: users.name,
                surname: users.surname,
                email: users.email,
                createdAt: users.createdAt,
                updatedAt: users.updatedAt,
            })
            .from(users)
            .where(eq(users.id, id))
            .limit(1);

        return result[0];
    }

    /**
     * Find user by email
     * @param email User email
     * @returns User or undefined if not found
     */
    async findByEmail(email: User["email"]): Promise<User | undefined> {
        const result = await this.db
            .select({
                id: users.id,
                name: users.name,
                surname: users.surname,
                email: users.email,
                createdAt: users.createdAt,
                updatedAt: users.updatedAt,
            })
            .from(users)
            .where(eq(users.email, email))
            .limit(1);

        return result[0];
    }

    /**
     * Get password hash and salt for a user
     * @param user User
     * @returns Password hash and salt
     */
    async getPasswordHash(user: User): Promise<PasswordHashWithSalt> {
        const result = await this.db
            .select({
                hash: users.passwordHash,
                salt: users.passwordSalt,
            })
            .from(users)
            .where(eq(users.id, user.id))
            .limit(1);

        return result[0] as PasswordHashWithSalt;
    }

    /**
     * Delete a user
     * @param id User id
     * @returns Deleted user or undefined if not found
     */
    async delete(id: User["id"]): Promise<User | undefined> {
        const result = await this.db
            .delete(users)
            .where(eq(users.id, id))
            .returning({
                id: users.id,
                name: users.name,
                surname: users.surname,
                email: users.email,
                createdAt: users.createdAt,
                updatedAt: users.updatedAt,
            });

        return result[0];
    }
}
