import { resolve } from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
    resolve: {
        alias: [
            {
                find: /^#(.*)/,
                replacement: resolve(__dirname, "./src/$1"),
            },
        ],
        conditions: ["dev"],
    },
    test: {
        globals: true,
        environment: "node",
        testTimeout: 30000,
        passWithNoTests: true,
        setupFiles: ["./test/setup.ts"],
        pool: "forks",
        poolOptions: {
            threads: {
                singleThread: true,
            },
            forks: {
                isolate: false,
                singleFork: true,
            },
        },
        coverage: {
            provider: "v8",
            reporter: ["text", "json", "html"],
            exclude: [
                "node_modules/**",
                "dist/**",
                "**/index.ts",
                "**/*.d.ts",
            ],
        },
    },
});
