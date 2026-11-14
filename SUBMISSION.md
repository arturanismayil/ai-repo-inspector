# Submission

## What did you investigate first, and why?

I first ran `npm install`, `npm run typecheck` and `npm test` to see the starting state (all passing, but only 1 test). Then I read every file in `src/`. I started with `mcp-server.ts` and `validation.ts` because those are what an AI agent calls directly. I asked the AI to list problems and rank them before changing any code.

## What did you choose to implement or fix?

1. **MCP tool was broken:** the schema asked for `repo_path` but the code read `input.repoPath`, so the repo path was always undefined. I fixed the field name, removed the `any` type, and made errors return a clean MCP error instead of crashing.
2. **Unsafe command execution:** validation used `exec` (a shell), so any string could run. Now it uses `execFile` with an allowlist (`npm test`, `npm run lint`, etc.), a 60 second timeout and an output size limit.
3. **A failing test crashed the whole review:** now a failed command is reported with status `failed` (or `blocked`) and the report is still written.
4. **Git:** it only worked if the branch was named `main`. It now tries `main` then `master`, rejects a base ref starting with `-` (git would treat it as an option), reports renamed files and finds untracked files.
5. **Report:** output containing triple backticks could break the Markdown, and output size was unlimited. The fence is now always longer than any backticks in the output, and output is cut at 5000 characters.
6. **CLI:** `--repo` was cut at the first space, and `--format json` was accepted but ignored. Both are fixed (json now gives a clear "not supported" error).
7. Added 6 tests (7 total now).

## What did you intentionally not do?

- JSON output format. The type exists but I did not build it; I made the CLI honest about it instead.
- A per-repo configurable allowlist.
- Tests for the CLI and MCP adapters (I checked them by hand, see below).
- Running validations in parallel.
- I did not run `npm audit fix --force` for the 15 audit warnings. It can make breaking changes and they are in dev tools, not in my code.

## Interface decision

- Decision: hybrid
- Primary user and execution environment: a developer, or an AI coding agent working for that developer, running locally on their own laptop (stdio MCP, not a public server).
- Trust boundary and allowed capabilities: the caller is trusted to choose a local repo, but NOT trusted to run arbitrary commands. Only the fixed allowlist can run, without a shell, with timeout and output limit. The tool only reads git state and never changes the repo.
- Reliability, discoverability, latency/context, and output tradeoffs: MCP is easy for agents to discover because the tool description lists the allowed commands, and errors come back as structured errors. The CLI is simpler and faster to start for humans and CI. Long output costs an agent context, so output is cut at 5000 characters per command. The tradeoff is that very long failures lose their tail.
- How supported interfaces remain consistent: both the CLI and MCP only call the same `reviewRepository` function, so the allowlist, git logic and report format are in one place and cannot drift apart.
- Evidence that would change this decision: if almost all real usage came through agents, I would go MCP-first and drop CLI-only features. If the tool had to run on untrusted repos or remote machines, I would need real sandboxing before offering validation at all.

## How did you use an AI coding agent?

I used Claude in a chat window. I pasted the starter code in, asked it to find and rank problems, and asked it to write the fixes. I ran everything myself in Terminal and pasted the real output back. I did not just accept the first version; I tested it on a small demo repository.

## Where did you check, correct, or reject an AI suggestion? (required)

- **Corrected:** the AI's first `validation.ts` put `error.message` in the report and then also added the command output. When I ran it on my demo repo, the npm error text showed twice. I changed it to print only the exit code plus the output once and checked again.
- **Rejected:** the AI advised me not to run `npm audit fix --force` for the 15 vulnerability warnings, and I agreed, because it can break dependencies and the issue is not part of this task.
- **Checked rather than trusted:** I tested the MCP tool by sending it a real tool call instead of assuming the field-name fix worked.

## Commands used to verify the result, with outcomes

- `npm run typecheck`: no errors.
- `npm test`: 3 test files, 7 tests passed.
- `npm run inspector -- review --repo ~/"demo repo" --validate "npm test" --validate "echo hi"` on a small test repo with a space in its path: listed `a.txt (modified)`, `b.txt (added)`, `c.txt (untracked)`; `npm test` shown as failed (no package.json there) and the report was still written; `echo hi` shown as blocked.
- `--base-ref "--output=x"` and `--format json`: each printed a clear error line.
- A manual MCP `tools/call` over stdio with `repoPath` returned the report.

## A blocker you hit and how you approached it

Two terminal problems. First, I copied a command with `<` `>` around the URL and zsh gave a parse error; I removed the brackets. Second, a long commit command wrapped and lost its closing quote, so the terminal got stuck at `dquote>`; I pressed Ctrl+C and used a shorter commit message. TypeScript, MCP and vitest were also new to me, so I checked each change by running it.

## Known limitations and the next three things you would do

- Allowing `npm test` still runs whatever scripts the target repo's package.json defines, so this is only safe on repos you trust.
- The MCP tool can read any local path it is given.
- No automated tests for the CLI/MCP adapters or for most git cases.

Next three: (1) automated tests that create a temporary git repo, (2) an optional allowed-folder setting for the MCP server, (3) real JSON output.

## Approximate focused-work time

- Start: 20:02
- Finish: 20:46
