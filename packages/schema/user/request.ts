import { Type } from "@sinclair/typebox";

import { UUID } from "../common/index.js";
import { UserBase } from "./types.js";

export const UserIdParam = Type.Object({
    userId: UUID,
});

export const CreateUserRequest = Type.Intersect([
    UserBase,
    Type.Object({
        password: Type.String({ minLength: 8 }),
    }),
]);

export const UpdateUserProfileRequest = Type.Partial(UserBase);

export const UpdateUserRoleRequest = Type.Object({
    roles: Type.Array(Type.Union([
        Type.Literal("user"),
        Type.Literal("admin"),
    ])),
});

export const SearchUsersQuery = Type.Object({
    query: Type.Optional(Type.String({ minLength: 1 })),
    role: Type.Optional(Type.Union([
        Type.Literal("user"),
        Type.Literal("admin"),
    ])),
});
