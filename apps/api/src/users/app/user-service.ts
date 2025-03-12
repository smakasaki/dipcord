import type { PaginatedResult, Pagination, SortBy } from "#commons/app/index.js";

import { UnauthorizedException } from "#commons/app/index.js";
import { handleNotFound } from "#commons/infra/http/errors/index.js";

import type { AuthTokenService } from "./auth-token-service.js";
import type { AuthToken, CreateUser, Login, User } from "./models.js";
import type { PasswordService } from "./password-service.js";
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
     * @param authTokenService Service for JWT operations
     * @param userRepository Repository for user data access
     */
    constructor(
        private readonly passwordService: PasswordService,
        private readonly authTokenService: AuthTokenService,
        private readonly userRepository: IUserRepository,
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
     * Authenticate user and return token
     * @param credentials Login credentials
     * @returns Authentication token
     * @throws UnauthorizedException if credentials are invalid
     */
    async login(credentials: Login): Promise<AuthToken> {
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

        // Generate JWT token
        const accessToken = await this.authTokenService.generateToken(user);

        return { accessToken };
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
     * Delete a user
     * @param id User id
     * @returns Deleted user or undefined if not found
     */
    delete(id: User["id"]): Promise<User | undefined> {
        return this.userRepository.delete(id);
    }
}
