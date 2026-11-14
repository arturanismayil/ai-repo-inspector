import { describe, expect, it } from "vitest";
import { runValidation } from "../src/validation.js";

describe("runValidation", () => {
  it("blocks commands that are not on the allowlist", async () => {
    const result = await runValidation("rm -rf /", ".");
    expect(result.status).toBe("blocked");
  });

  it("blocks shell tricks chained onto an allowed command", async () => {
    const result = await runValidation("npm test; echo hacked", ".");
    expect(result.status).toBe("blocked");
  });

  it("reports a failing command instead of throwing", async () => {
    const result = await runValidation("npm run lint", "."); // this repo has no lint script
    expect(result.status).toBe("failed");
  });
});
