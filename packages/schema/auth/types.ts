import { Type } from "@sinclair/typebox";

import { UUID } from "../common/index.js";
import { SessionBase } from "../user/types.js";

export const Session = Type.Intersect([
    Type.Object({ id: UUID }),
    SessionBase,
]);

export const SessionWithUser = Type.Intersect([
    Session,
    Type.Object({
        userId: UUID,
        user: Type.Object({
            id: UUID,
            name: Type.String(),
            surname: Type.String(),
            username: Type.String(),
        }),
    }),
]);
