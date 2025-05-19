import type { ViteUserConfig } from "vitest/config";

import { resolve } from "node:path";
import { defineConfig, mergeConfig } from "vitest/config";

export const baseConfig = defineConfig({
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
        passWithNoTests: true,
        pool: "threads",
        poolOptions: {
            threads: {
                singleThread: false,
                minThreads: 1,
                maxThreads: 4,
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

// Функция для расширения базовой конфигурации
export function createConfig(config: ViteUserConfig) {
    return mergeConfig(baseConfig, defineConfig(config));
}
