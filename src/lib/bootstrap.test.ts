import { describe, expect, it } from "vitest";

import { loginInputSchema, registerInputSchema } from "./auth";
import { projectInputSchema } from "./projects";

describe("implementation environment", () => {
  it("validates the first project input contract", () => {
    expect(projectInputSchema.safeParse({ name: "Demo project", description: "", visibility: "private" }).success).toBe(
      true,
    );
    expect(projectInputSchema.safeParse({ name: "", description: "", visibility: "private" }).success).toBe(false);
  });

  it("normalizes login emails and rejects empty passwords", () => {
    expect(loginInputSchema.parse({ email: " USER@EXAMPLE.TEST ", password: "secret" }).email).toBe("user@example.test");
    expect(loginInputSchema.safeParse({ email: "user@example.test", password: "" }).success).toBe(false);
  });

  it("requires matching registration passwords", () => {
    expect(registerInputSchema.safeParse({
      displayName: "User",
      email: "user@example.test",
      password: "password-1",
      passwordConfirmation: "password-2",
    }).success).toBe(false);
  });
});
