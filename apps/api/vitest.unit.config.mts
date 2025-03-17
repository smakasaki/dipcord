import { createConfig } from "./vitest.config.base.mjs";

export default createConfig({
    test: {
        testTimeout: 10000,
        setupFiles: ["./test/setup.unit.ts"],
        include: ["test/unit/**/*.test.ts"],
        name: "unit",
    },
});
