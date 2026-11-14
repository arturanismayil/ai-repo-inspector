import { execFileSync } from "node:child_process";
import type { ChangedFile } from "./types.js";

function git(repositoryPath: string, args: string[]): string {
  return execFileSync("git", ["-c", "core.quotepath=false", ...args], {
    cwd: repositoryPath,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  }).trim();
}

function refExists(repositoryPath: string, ref: string): boolean {
  try {
    git(repositoryPath, ["rev-parse", "--verify", "--quiet", `${ref}^{commit}`]);
    return true;
  } catch {
    return false;
  }
}

function pickBase(repositoryPath: string, baseRef?: string): string {
  if (baseRef !== undefined) {
    // A ref starting with "-" would be read by git as an option, not a branch name.
    if (baseRef.startsWith("-")) {
      throw new Error(`Invalid base ref "${baseRef}": must not start with "-".`);
    }
    if (!refExists(repositoryPath, baseRef)) {
      throw new Error(`Base ref "${baseRef}" was not found in this repository.`);
    }
    return baseRef;
  }
  const found = ["main", "master"].find((name) => refExists(repositoryPath, name));
  if (!found) {
    throw new Error('Could not find a "main" or "master" branch. Please pass a base ref.');
  }
  return found;
}

export function changedFiles(repositoryPath: string, baseRef?: string): ChangedFile[] {
  const base = pickBase(repositoryPath, baseRef);
  const output = git(repositoryPath, ["diff", "--name-status", `${base}...HEAD`, "--"]);

  const files: ChangedFile[] = output
    .split("\n")
    .filter(Boolean)
    .map((line) => {
      const [code, ...pathParts] = line.split("\t");
      if (code.startsWith("R")) {
        // Renames look like: R100<TAB>old<TAB>new
        return { path: `${pathParts[0]} -> ${pathParts[1]}`, status: "renamed" as const };
      }
      const status = code === "A" ? "added" : code === "D" ? "deleted" : "modified";
      return { path: pathParts.join("\t"), status };
    });

  const untracked = git(repositoryPath, ["ls-files", "--others", "--exclude-standard"])
    .split("\n")
    .filter(Boolean)
    .map((path) => ({ path, status: "untracked" as const }));

  return [...files, ...untracked];
}
