// packages/schemas/user/response.ts
import { Type } from "@sinclair/typebox";

import { ID, PaginationResult, StandardErrorResponses } from "../common/index.js";
import { PublicUserBase, UserBase, UserRoleEnum } from "./types.js";

export const UserResponse = Type.Intersect([
    ID,
    UserBase,
    Type.Object({
        roles: Type.Array(UserRoleEnum),
        createdAt: Type.String({ format: "date-time" }),
        updatedAt: Type.String({ format: "date-time" }),
    }),
]);

export const PublicUserProfileResponse = Type.Intersect([
    ID,
    PublicUserBase,
]);

export const PaginatedUsersResponse = PaginationResult(UserResponse);

export const UserErrorResponses = StandardErrorResponses;
