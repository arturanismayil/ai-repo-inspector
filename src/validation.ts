import { execFile } from "node:child_process";
import type { ValidationResult } from "./types.js";

// Only these commands may run. Both the CLI and MCP use this same list.
export const ALLOWED_COMMANDS = [
  "npm test",
  "npm run test",
  "npm run lint",
  "npm run typecheck",
  "npm run build",
];

const TIMEOUT_MS = 60_000;
const MAX_OUTPUT_BYTES = 1_000_000;

export function runValidation(command: string, cwd: string): Promise<ValidationResult> {
  const normalized = command.trim().replace(/\s+/g, " ");

  if (!ALLOWED_COMMANDS.includes(normalized)) {
    return Promise.resolve({
      command,
      status: "blocked",
      output: `Command not allowed. Allowed commands: ${ALLOWED_COMMANDS.join(", ")}`,
    });
  }

  // execFile runs the program directly (no shell), so ";" or "&&" tricks do nothing.
  const [file, ...args] = normalized.split(" ");

  return new Promise((resolve) => {
    execFile(file, args, { cwd, timeout: TIMEOUT_MS, maxBuffer: MAX_OUTPUT_BYTES }, (error, stdout, stderr) => {
      const output = [stdout, stderr].filter(Boolean).join("\n");
      if (error) {
        const reason = error.killed ? `Timed out after ${TIMEOUT_MS / 1000}s` : error.message;
        resolve({ command, status: "failed", output: `${reason}\n${output}` });
        return;
      }
      resolve({ command, status: "passed", output });
    });
  });
}

export async function runValidations(commands: string[], cwd: string): Promise<ValidationResult[]> {
  const results: ValidationResult[] = [];
  for (const command of commands) {
    results.push(await runValidation(command, cwd));
  }
  return results;
}
