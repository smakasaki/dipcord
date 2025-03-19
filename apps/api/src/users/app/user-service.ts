import { randomBytes } from "node:crypto";

import type { PaginatedResult, Pagination, SortBy } from "#commons/app/index.js";

import { BadRequestException, ConflictException, NotFoundException, UnauthorizedException } from "#commons/app/index.js";
import { handleNotFound } from "#commons/infra/http/errors/index.js";

import type { CreateUser, Login, PasswordHashWithSalt, Session, User, UserRole } from "./models.js";
import type { IPasswordResetTokenRepository } from "./password-reset-repo.js";
import type { PasswordService } from "./password-service.js";
import type { SessionService } from "./session-service.js";
import type { IUserRepository } from "./user-repo.js";

/**
 * User Service
 * Business logic for user management
 */
export class UserService {
    private readonly ENTITY_NAME = "User";

    /**
     * Create a new UserService
     * @param passwordService Service for password operations
     * @param sessionService Service for session operations
     * @param userRepository Repository for user data access
     * @param passwordResetTokenRepository Repository for password reset token data access
     */
    constructor(
        private readonly passwordService: PasswordService,
        private readonly sessionService: SessionService,
        private readonly userRepository: IUserRepository,
        private readonly passwordResetTokenRepository: IPasswordResetTokenRepository,
    ) {}

    /**
     * Create a new user
     * @param userData User data with password
     * @returns Created user
     */
    async create(userData: CreateUser): Promise<User> {
        const { password, ...user } = userData;

        // Generate password hash
        const passwordHash = this.passwordService.generateHash(password);

        // Create user in repository
        return this.userRepository.create(user, passwordHash);
    }

    /**
     * Authenticate user and create a session
     * @param credentials Login credentials
     * @param ipAddress IP address of the client
     * @param userAgent User agent of the client
     * @returns Authenticated user
     * @throws UnauthorizedException if credentials are invalid
     */
    async login(credentials: Login, ipAddress?: string, userAgent?: string): Promise<{ user: User; session: Session }> {
        // Find user by email
        const user = await this.userRepository.findByEmail(credentials.email);
        if (!user) {
            throw new UnauthorizedException("Invalid credentials");
        }

        // Get password hash and salt
        const { hash, salt } = await this.userRepository.getPasswordHash(user);

        // Verify password
        const isPasswordValid = this.passwordService.compare(
            credentials.password,
            hash,
            salt,
        );

        if (!isPasswordValid) {
            throw new UnauthorizedException("Invalid credentials");
        }

        return await this.createSession(user, ipAddress, userAgent);
    }

    /**
     * Create a session for the user
     * @param user User to create session for
     * @param ipAddress IP address of the client
     * @param userAgent User agent of the client
     * @returns User and session
     */
    async createSession(user: User, ipAddress?: string, userAgent?: string): Promise<{ user: User; session: Session }> {
    // Create a new session for the user
        const session = await this.sessionService.createSession(user, ipAddress, userAgent);

        return { user, session };
    }

    /**
     * Logout user by deleting the session
     * @param sessionId Session ID to logout
     * @returns True if logout was successful
     */
    async logout(sessionId: string): Promise<boolean> {
        const session = await this.sessionService.deleteSession(sessionId);
        return !!session;
    }

    /**
     * Find all users with pagination and sorting
     * @param pagination Pagination parameters
     * @param sortBy Sort configuration
     * @returns Paginated users
     */
    findAll(
        pagination: Pagination,
        sortBy: SortBy<User>,
    ): Promise<PaginatedResult<User>> {
        return this.userRepository.findAll(pagination, sortBy);
    }

    /**
     * Find user by id
     * @param id User id
     * @returns User
     * @throws NotFoundException if user not found
     */
    async findById(id: User["id"]): Promise<User> {
        const user = await this.userRepository.findById(id);
        handleNotFound(user, id, this.ENTITY_NAME);
        return user;
    }

    /**
     * Find user by email
     * @param email User email
     * @returns User or undefined if not found
     */
    findByEmail(email: User["email"]): Promise<User | undefined> {
        return this.userRepository.findByEmail(email);
    }

    /**
     * Update user
     * @param userId User ID
     * @param userData User data to update
     * @returns Updated user
     */
    async update(
        userId: string,
        userData: Partial<{ name: string; surname: string; email: string }>,
    ): Promise<User> {
    // Find user first to verify it exists
        const existingUser = await this.findById(userId);

        // If updating email, check if it's already taken
        if (userData.email && userData.email !== existingUser.email) {
            const userWithEmail = await this.userRepository.findByEmail(userData.email);
            if (userWithEmail) {
                throw new ConflictException(`Email ${userData.email} is already in use`);
            }
        }

        // Update user in repository
        const updatedUser = await this.userRepository.update(userId, userData);
        if (!updatedUser) {
            throw new Error(`Failed to update user with ID ${userId}`);
        }

        return updatedUser;
    }

    /**
     * Delete a user and all associated sessions
     * @param id User id
     * @returns Deleted user or undefined if not found
     */
    async delete(id: User["id"]): Promise<User | undefined> {
        // Delete all user sessions first
        await this.sessionService.deleteUserSessions(id);

        // Delete the user
        return this.userRepository.delete(id);
    }

    /**
     * Create a password reset token for a user
     * @param userId User ID
     * @returns Created token
     */
    async createPasswordResetToken(userId: string): Promise<string> {
        // Verify user exists
        const user = await this.findById(userId);
        if (!user) {
            throw new NotFoundException("User not found");
        }

        // Check if there's already an active token and delete it
        const existingToken = await this.passwordResetTokenRepository.findActiveByUserId(userId);
        if (existingToken) {
            await this.passwordResetTokenRepository.delete(existingToken.id);
        }

        // Generate a secure token
        const token = randomBytes(32).toString("hex");

        // Set expiration time (e.g., 1 hour from now)
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + 1);

        // Create token in repository
        await this.passwordResetTokenRepository.create({
            userId,
            token,
            expiresAt,
        });

        return token;
    }

    /**
     * Reset password using token
     * @param token Reset token
     * @param newPassword New password
     */
    async resetPassword(token: string, newPassword: string): Promise<void> {
    // Find token
        const resetToken = await this.passwordResetTokenRepository.findByToken(token);
        if (!resetToken) {
            throw new BadRequestException("Invalid or expired token");
        }

        // Check if token is expired
        if (resetToken.expiresAt < new Date()) {
            await this.passwordResetTokenRepository.delete(resetToken.id);
            throw new BadRequestException("Token has expired");
        }

        // Check if token has already been used
        if (resetToken.usedAt) {
            throw new BadRequestException("Token has already been used");
        }

        // Find user
        const user = await this.userRepository.findById(resetToken.userId);
        if (!user) {
            throw new NotFoundException("User not found");
        }

        // Generate new password hash
        const passwordHash = this.passwordService.generateHash(newPassword);

        // Update user's password in the database
        // Note: This requires adding an updatePassword method to the repository
        await this.updateUserPassword(user.id, passwordHash);

        // Mark token as used
        await this.passwordResetTokenRepository.markAsUsed(resetToken.id);

        // Delete all user sessions
        await this.sessionService.deleteUserSessions(user.id);
    }

    /**
     * Change password for authenticated user
     * @param userId User ID
     * @param currentPassword Current password
     * @param newPassword New password
     */
    async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
    // Find user
        const user = await this.findById(userId);

        // Get password hash and salt
        const { hash, salt } = await this.userRepository.getPasswordHash(user);

        // Verify current password
        const isPasswordValid = this.passwordService.compare(
            currentPassword,
            hash,
            salt,
        );

        if (!isPasswordValid) {
            throw new UnauthorizedException("Current password is incorrect");
        }

        // Generate new password hash
        const passwordHash = this.passwordService.generateHash(newPassword);

        // Update user's password in the database
        await this.updateUserPassword(user.id, passwordHash);
    }

    /**
     * Update user's password (private helper method)
     * @param userId User ID
     * @param passwordHash Password hash and salt
     */
    private async updateUserPassword(userId: string, passwordHash: PasswordHashWithSalt): Promise<void> {
        await this.userRepository.updatePassword(userId, passwordHash);
    }

    /**
     * Check if user has admin role
     * @param userId User ID
     * @returns True if user has admin role
     */
    async isUserAdmin(userId: string): Promise<boolean> {
        return await this.findById(userId)
            .then(user => user.roles.includes("admin"))
            .catch(() => false);
    }

    /**
     * Add admin role to user
     * @param userId User ID
     * @returns Updated user
     */
    async addAdminRole(userId: string): Promise<User> {
        const user = await this.findById(userId);

        if (user.roles.includes("admin")) {
            return user; // Already an admin
        }

        // Add admin role
        const roles: UserRole[] = [...user.roles, "admin"];

        // Update user roles in the database
        const updatedUser = await this.userRepository.updateRoles(userId, roles);
        if (!updatedUser) {
            throw new Error(`Failed to update roles for user with ID ${userId}`);
        }

        return updatedUser;
    }

    /**
     * Remove admin role from user
     * @param userId User ID
     * @returns Updated user
     */
    async removeAdminRole(userId: string): Promise<User> {
        const user = await this.findById(userId);

        if (!user.roles.includes("admin")) {
            return user; // Not an admin
        }

        // Remove admin role
        const roles = user.roles.filter(role => role !== "admin");

        // Update user roles in the database
        const updatedUser = await this.userRepository.updateRoles(userId, roles);
        if (!updatedUser) {
            throw new Error(`Failed to update roles for user with ID ${userId}`);
        }

        return updatedUser;
    }
}
