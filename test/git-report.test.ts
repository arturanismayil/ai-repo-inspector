import { describe, expect, it } from "vitest";
import { changedFiles } from "../src/git.js";
import { markdownReport } from "../src/report.js";

describe("changedFiles", () => {
  it("rejects a base ref that looks like a git option", () => {
    expect(() => changedFiles(".", "--output=hacked.txt")).toThrow(/Invalid base ref/);
  });
});

describe("markdownReport safety", () => {
  it("uses a longer fence when output contains backticks", () => {
    const report = markdownReport({
      repositoryPath: "/x",
      changedFiles: [],
      validationResults: [{ command: "npm test", status: "failed", output: "```\nbreak out\n```" }],
    });
    expect(report).toContain("````");
  });

  it("truncates very long output", () => {
    const report = markdownReport({
      repositoryPath: "/x",
      changedFiles: [],
      validationResults: [{ command: "npm test", status: "passed", output: "a".repeat(20000) }],
    });
    expect(report).toContain("truncated");
    expect(report.length).toBeLessThan(7000);
  });
});
