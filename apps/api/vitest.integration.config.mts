import { createConfig } from "./vitest.config.base.mjs";

export default createConfig({
    test: {
        testTimeout: 60000,
        setupFiles: ["./test/setup.integration.ts"],
        include: ["test/integration/**/*.test.ts"],
        name: "integration",
    },
});
