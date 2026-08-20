import { describe, expect, it } from "vitest";
import { z } from "zod";

const projectInputSchema = z.object({
  name: z.string().trim().min(1).max(120),
});

describe("implementation environment", () => {
  it("validates the first project input contract", () => {
    expect(projectInputSchema.safeParse({ name: "Demo project" }).success).toBe(
      true,
    );
    expect(projectInputSchema.safeParse({ name: "" }).success).toBe(false);
  });
});
