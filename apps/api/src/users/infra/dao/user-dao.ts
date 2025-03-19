import { count, eq } from "drizzle-orm";

import type { PaginatedResult, Pagination, SortBy } from "#commons/app/index.js";
import type { Database } from "#commons/infra/plugins/database.js";
import type { CreateUser, PasswordHashWithSalt, User, UserRole } from "#users/app/models.js";
import type { IUserRepository } from "#users/app/user-repo.js";

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
                roles: users.roles,
                createdAt: users.createdAt,
                updatedAt: users.updatedAt,
            });

        if (!result[0])
            throw new Error("User not created");

        // Ensure roles is properly typed
        return {
            ...result[0],
            roles: result[0].roles as UserRole[],
        };
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

        const rawResult = await this.db
            .select({
                id: users.id,
                name: users.name,
                surname: users.surname,
                email: users.email,
                roles: users.roles,
                createdAt: users.createdAt,
                updatedAt: users.updatedAt,
            })
            .from(users)
            .limit(pagination.limit)
            .offset(pagination.offset)
            .orderBy(...buildSortBy(sortBy));

        // Ensure roles are properly typed
        const result = rawResult.map(user => ({
            ...user,
            roles: user.roles as UserRole[],
        }));

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
                roles: users.roles,
                createdAt: users.createdAt,
                updatedAt: users.updatedAt,
            })
            .from(users)
            .where(eq(users.id, id))
            .limit(1);

        if (!result[0]) {
            return undefined;
        }

        // Ensure roles are properly typed
        return {
            ...result[0],
            roles: result[0].roles as UserRole[],
        };
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
                roles: users.roles,
                createdAt: users.createdAt,
                updatedAt: users.updatedAt,
            })
            .from(users)
            .where(eq(users.email, email))
            .limit(1);

        if (!result[0]) {
            return undefined;
        }

        // Ensure roles are properly typed
        return {
            ...result[0],
            roles: result[0].roles as UserRole[],
        };
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

        if (!result[0])
            throw new Error(`Password hash not found for user with id ${user.id}`);

        return result[0];
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
                roles: users.roles,
                createdAt: users.createdAt,
                updatedAt: users.updatedAt,
            });

        if (!result[0]) {
            return undefined;
        }

        // Ensure roles are properly typed
        return {
            ...result[0],
            roles: result[0].roles as UserRole[],
        };
    }

    /**
     * Update user
     * @param userId User ID
     * @param userData User data to update
     * @returns Updated user or undefined if not found
     */
    async update(
        userId: User["id"],
        userData: Partial<{ name: string; surname: string; email: string }>,
    ): Promise<User | undefined> {
    // Build update data with only the fields that are provided
        const updateData: Partial<typeof users.$inferInsert> = {
            updatedAt: new Date(),
        };

        if (userData.name !== undefined) {
            updateData.name = userData.name;
        }

        if (userData.surname !== undefined) {
            updateData.surname = userData.surname;
        }

        if (userData.email !== undefined) {
            updateData.email = userData.email;
        }

        const result = await this.db
            .update(users)
            .set(updateData)
            .where(eq(users.id, userId))
            .returning({
                id: users.id,
                name: users.name,
                surname: users.surname,
                email: users.email,
                roles: users.roles,
                createdAt: users.createdAt,
                updatedAt: users.updatedAt,
            });

        if (!result[0]) {
            return undefined;
        }

        return {
            ...result[0],
            roles: result[0].roles as UserRole[],
        };
    }

    /**
     * Update user's password
     * @param userId User ID
     * @param passwordHash New password hash and salt
     * @returns Updated user or undefined if not found
     */
    async updatePassword(
        userId: User["id"],
        passwordHash: PasswordHashWithSalt,
    ): Promise<User | undefined> {
        const result = await this.db
            .update(users)
            .set({
                passwordHash: passwordHash.hash,
                passwordSalt: passwordHash.salt,
                updatedAt: new Date(),
            })
            .where(eq(users.id, userId))
            .returning({
                id: users.id,
                name: users.name,
                surname: users.surname,
                email: users.email,
                roles: users.roles,
                createdAt: users.createdAt,
                updatedAt: users.updatedAt,
            });

        if (!result[0]) {
            return undefined;
        }

        // Ensure roles are properly typed
        return {
            ...result[0],
            roles: result[0].roles as UserRole[],
        };
    }

    /**
     * Update user roles
     * @param userId User ID
     * @param roles New roles
     * @returns Updated user or undefined if not found
     */
    async updateRoles(
        userId: User["id"],
        roles: UserRole[],
    ): Promise<User | undefined> {
        const result = await this.db
            .update(users)
            .set({
                roles,
                updatedAt: new Date(),
            })
            .where(eq(users.id, userId))
            .returning({
                id: users.id,
                name: users.name,
                surname: users.surname,
                email: users.email,
                roles: users.roles,
                createdAt: users.createdAt,
                updatedAt: users.updatedAt,
            });

        if (!result[0]) {
            return undefined;
        }

        // Ensure roles are properly typed
        return {
            ...result[0],
            roles: result[0].roles as UserRole[],
        };
    }
}
