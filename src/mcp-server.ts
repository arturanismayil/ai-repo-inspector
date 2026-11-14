#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { reviewRepository } from "./core.js";
import { ALLOWED_COMMANDS } from "./validation.js";

const server = new McpServer({ name: "repository-inspector", version: "2.0.0" });

server.tool(
  "review_repository",
  `Inspects a Git repository and returns a Markdown review report. Validation commands must be one of: ${ALLOWED_COMMANDS.join(", ")}.`,
  {
    repoPath: z.string().min(1).describe("Path to the Git repository to inspect."),
    baseRef: z.string().optional().describe("Git ref to compare against. Defaults to main."),
    validationCommands: z.array(z.string()).optional().describe("Allowed validation commands to run."),
  },
  async ({ repoPath, baseRef, validationCommands }) => {
    try {
      const report = await reviewRepository({
        repositoryPath: repoPath,
        baseRef,
        validationCommands,
      });
      return { content: [{ type: "text" as const, text: report }] };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return { isError: true, content: [{ type: "text" as const, text: `Review failed: ${message}` }] };
    }
  },
);

await server.connect(new StdioServerTransport());
