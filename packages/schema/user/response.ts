// packages/schemas/user/response.ts
import { z } from "zod";

import { ID, PaginationResult, StandardErrorResponses } from "../common/index.js";
import { PublicUserBase, UserBase, UserRoleEnum } from "./types.js";

export const UserResponse = ID.extend({
    ...UserBase.shape,
    roles: z.array(UserRoleEnum),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
});

export const PublicUserProfileResponse = ID.extend({
    ...PublicUserBase.shape,
});

export const PaginatedUsersResponse = PaginationResult(UserResponse);

export const UserErrorResponses = StandardErrorResponses;
