#!/usr/bin/env node
import { writeFileSync } from "node:fs";
import { reviewRepository } from "./core.js";

type Args = {
  command: string;
  repositoryPath?: string;
  baseRef?: string;
  validations: string[];
};

function parseArgs(argv: string[]): Args {
  const args: Args = { command: argv[0] ?? "", validations: [] };
  for (let index = 1; index < argv.length; index++) {
    const flag = argv[index];
    const value = (): string => {
      const next = argv[++index];
      if (next === undefined || next.startsWith("--")) {
        throw new Error(`Missing value for ${flag}`);
      }
      return next;
    };
    if (flag === "--repo") {
      args.repositoryPath = value(); // keep the whole path, spaces included
    } else if (flag === "--base-ref") {
      args.baseRef = value();
    } else if (flag === "--format") {
      const format = value();
      if (format !== "markdown") {
        throw new Error(`Format "${format}" is not supported yet. Use --format markdown.`);
      }
    } else if (flag === "--validate") {
      args.validations.push(value());
    } else {
      throw new Error(`Unknown option: ${flag}`);
    }
  }
  return args;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.command !== "review" || !args.repositoryPath) {
    console.error("Usage: inspector review --repo <path> [--base-ref <ref>] [--validate <command>] [--format markdown]");
    process.exitCode = 1;
    return;
  }

  const report = await reviewRepository({
    repositoryPath: args.repositoryPath,
    baseRef: args.baseRef,
    validationCommands: args.validations,
  });
  writeFileSync("review-report.md", report, "utf8");
  console.log("Review report written to review-report.md");
}

main().catch((error) => {
  console.error(`Error: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
});
