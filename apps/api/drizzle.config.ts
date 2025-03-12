/* eslint-disable node/no-process-env */
import type { Config } from "drizzle-kit";

export default {
    schema: "./src/db/schema/index.ts",
    out: "./src/db/migrations",
    dialect: "postgresql",
    dbCredentials: {
        host: process.env.POSTGRES_HOST || "localhost",
        port: Number(process.env.POSTGRES_PORT) || 5432,
        user: process.env.POSTGRES_USER || "postgres",
        password: process.env.POSTGRES_PASSWORD || "postgres",
        database: process.env.POSTGRES_DB || "dipcord",
        ssl: false,
    },
    verbose: true,
    strict: true,
} satisfies Config;
