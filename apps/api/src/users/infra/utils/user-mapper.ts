import type { PaginatedResult } from "#commons/app/models.js";
import type { User } from "#users/app/models.js";

/**
 * Maps domain User to API response format
 * @param user Domain user model
 * @returns API user response format
 */
export function mapUserToResponse(user: User): any {
    return {
        id: user.id,
        name: user.name,
        surname: user.surname,
        email: user.email,
        roles: user.roles,
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString(),
    };
}

/**
 * Maps paginated domain Users to API response format
 * @param result Paginated domain user models
 * @returns API paginated users response format
 */
export function mapPaginatedUsersToResponse(result: PaginatedResult<User>): any {
    return {
        count: result.count,
        data: result.data.map(mapUserToResponse),
    };
}
