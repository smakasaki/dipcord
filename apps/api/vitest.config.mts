import { createConfig } from "./vitest.config.base.mjs";

export default createConfig({
    test: {
        testTimeout: 30000,
        setupFiles: ["./test/setup.ts", "./test/setup.unit.ts", "./test/setup.integration.ts"],
        include: ["test/**/*.test.ts"],
    },
});
