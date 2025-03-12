import createConfig from "@dipcord/eslint-config/create-config";
import drizzle from "eslint-plugin-drizzle";

export default createConfig({
    ignores: ["src/db/migrations/*", "public/*", "docker-compose.yml"],
    plugins: { drizzle },
    rules: {
        ...drizzle.configs.recommended.rules,
        "drizzle/enforce-delete-with-where": [
            "error",
            {
                drizzleObjectName: ["db"],
            },
        ],
        "drizzle/enforce-update-with-where": [
            "error",
            {
                drizzleObjectName: ["db"],
            },
        ],
    },
});
