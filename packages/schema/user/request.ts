import { z } from "zod";

import { UUID } from "../common/index.js";
import { UserBase, UserRoleEnum } from "./types.js";

export const UserIdParam = z.object({
    userId: UUID,
});

export const CreateUserRequest = UserBase.extend({
    password: z.string().min(8),
});

export const UpdateUserProfileRequest = UserBase.partial();

export const UpdateUserRoleRequest = z.object({
    roles: z.array(UserRoleEnum),
});

export const SearchUsersQuery = z.object({
    query: z.string().min(1).optional(),
    role: UserRoleEnum.optional(),
});
