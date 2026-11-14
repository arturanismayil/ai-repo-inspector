import type { ChangedFile, ValidationResult } from "./types.js";

type ReportInput = {
  repositoryPath: string;
  changedFiles: ChangedFile[];
  validationResults: ValidationResult[];
};

const MAX_OUTPUT_CHARS = 5000;

// Wraps text in a code block. The fence is longer than any run of backticks in
// the text, so command output can never break out of the block.
function fenced(text: string): string {
  const clipped =
    text.length > MAX_OUTPUT_CHARS
      ? `${text.slice(0, MAX_OUTPUT_CHARS)}\n... [truncated ${text.length - MAX_OUTPUT_CHARS} characters]`
      : text;
  const longestRun = Math.max(2, ...(clipped.match(/`+/g) ?? []).map((run) => run.length));
  const fence = "`".repeat(longestRun + 1);
  return [fence, clipped, fence].join("\n");
}

export function markdownReport(input: ReportInput): string {
  const lines = [`# Review Report: ${input.repositoryPath}`, "", "## Changed files"];
  if (input.changedFiles.length === 0) {
    lines.push("No changed files found.");
  }
  for (const file of input.changedFiles) {
    lines.push(`- ${file.path} (${file.status})`);
  }
  lines.push("", "## Validation output");
  if (input.validationResults.length === 0) {
    lines.push("No validation commands were run.");
  }
  for (const result of input.validationResults) {
    lines.push(`### ${result.command} - ${result.status}`, fenced(result.output));
  }
  return lines.join("\n");
}
