/* eslint-disable no-console */
/* eslint-disable node/no-process-env */

import { execSync } from "node:child_process";
import fs from "node:fs";
import { resolve } from "node:path";

const colors = {
    reset: "\x1B[0m",
    green: "\x1B[32m",
    red: "\x1B[31m",
    cyan: "\x1B[36m",
};

const API_URL = process.env.API_URL || "http://localhost:3001/documentation/json";
const OUTPUT_DIR = resolve(__dirname, "../src/shared/api/types");
const OUTPUT_PATH = resolve(OUTPUT_DIR, "api.d.ts");

if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    console.log(`${colors.cyan}Created directory: ${OUTPUT_DIR}${colors.reset}`);
}

function main() {
    try {
        console.log(`${colors.cyan}Generating API types from: ${API_URL}${colors.reset}`);
        console.log(`${colors.cyan}Output: ${OUTPUT_PATH}${colors.reset}`);

        execSync(`pnpm openapi-typescript ${API_URL} -o ${OUTPUT_PATH}`, {
            stdio: "inherit",
        });

        console.log(`${colors.green}✓ API types generated successfully${colors.reset}`);
    }
    catch (error) {
        console.error(`${colors.red}Error generating API types: ${error}${colors.reset}`);
        process.exit(1);
    }
}

main();
