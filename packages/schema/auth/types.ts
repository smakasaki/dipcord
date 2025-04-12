import { z } from "zod";

import { UUID } from "../common/index.js";
import { SessionBase } from "../user/types.js";

export const Session = SessionBase.extend({
    id: UUID,
});

export const SessionWithUser = Session.extend({
    userId: UUID,
    user: z.object({
        id: UUID,
        name: z.string(),
        surname: z.string(),
        username: z.string(),
    }),
});
