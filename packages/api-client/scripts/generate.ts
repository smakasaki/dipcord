import { execSync } from 'node:child_process';
import { resolve } from 'node:path';

const colors = {
  reset: "\x1b[0m",
  fg: {
    cyan: "\x1b[36m",
    green: "\x1b[32m",
    red: "\x1b[31m",
    yellow: "\x1b[33m"
  }
};

function timestamp(): string {
  return new Date().toISOString();
}

function logInfo(message: string): void {
  console.log(`${colors.fg.cyan}[${timestamp()}] INFO: ${message}${colors.reset}`);
}

function logDebug(message: string): void {
  console.debug(`${colors.fg.yellow}[${timestamp()}] DEBUG: ${message}${colors.reset}`);
}

function logSuccess(message: string): void {
  console.log(`${colors.fg.green}[${timestamp()}] SUCCESS: ${message}${colors.reset}`);
}

function logError(message: string): void {
  console.error(`${colors.fg.red}[${timestamp()}] ERROR: ${message}${colors.reset}`);
}

const API_URL = 'http://localhost:3001/documentation/json';
const OUTPUT_PATH = resolve(__dirname, '../src/types/api.d.ts');

async function main(): Promise<void> {
  try {
    logInfo('Generating API types...');
    logInfo(`API URL: ${API_URL}`);
    logInfo(`Output path: ${OUTPUT_PATH}`);
    logDebug('Executing command...');
    
    execSync(`pnpm openapi-typescript ${API_URL} -o ${OUTPUT_PATH}`, {
      stdio: 'inherit'
    });
    
    logSuccess('API types generated successfully');
  } catch (error: any) {
    logError(`Error generating API types: ${error.message}`);
    process.exit(1);
  }
}

main();
