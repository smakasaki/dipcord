import type { PaginatedResult, Pagination, SortBy } from "#commons/app/index.js";

import type { CreateUser, PasswordHashWithSalt, User, UserRole } from "./models.js";

/**
 * User Repository Interface
 * Defines operations for user management
 */
export type IUserRepository = {
    /**
     * Create a new user
     * @param user User data without password
     * @param passwordHash Password hash and salt
     * @returns Created user
     */
    create: (
        user: Omit<CreateUser, "password">,
        passwordHash: PasswordHashWithSalt
    ) => Promise<User>;

    /**
     * Find all users with pagination and sorting
     * @param pagination Pagination parameters
     * @param sortBy Sort configuration
     * @returns Paginated users
     */
    findAll: (
        pagination: Pagination,
        sortBy: SortBy<User>
    ) => Promise<PaginatedResult<User>>;

    /**
     * Find user by id
     * @param id User id (UUID string)
     * @returns User or undefined if not found
     */
    findById: (id: User["id"]) => Promise<User | undefined>;

    /**
     * Find user by email
     * @param email User email
     * @returns User or undefined if not found
     */
    findByEmail: (email: User["email"]) => Promise<User | undefined>;

    /**
     * Get password hash and salt for a user
     * @param user User
     * @returns Password hash and salt
     */
    getPasswordHash: (user: User) => Promise<PasswordHashWithSalt>;

    /**
     * Update user
     * @param userId User ID
     * @param userData User data to update
     * @returns Updated user or undefined if not found
     */
    update: (
        userId: User["id"],
        userData: Partial<{ name: string; surname: string; email: string }>
    ) => Promise<User | undefined>;

    /**
     * Update user's password
     * @param userId User ID
     * @param passwordHash New password hash and salt
     * @returns Updated user or undefined if not found
     */
    updatePassword: (
        userId: User["id"],
        passwordHash: PasswordHashWithSalt
    ) => Promise<User | undefined>;

    /**
     * Delete a user
     * @param id User id (UUID string)
     * @returns Deleted user or undefined if not found
     */
    delete: (id: User["id"]) => Promise<User | undefined>;

    /**
     * Update user roles
     * @param userId User ID
     * @param roles New roles
     * @returns Updated user or undefined if not found
     */
    updateRoles: (
        userId: User["id"],
        roles: UserRole[]
    ) => Promise<User | undefined>;
};
