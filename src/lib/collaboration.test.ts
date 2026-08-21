import { describe, expect, it } from "vitest";

import { hashInvitationToken, invitationInputSchema, taskInputSchema, taskStatusInputSchema } from "./collaboration";

describe("Jalon 3 validation", () => {
  it("normalizes an invitation email and rejects the owner role", () => {
    expect(invitationInputSchema.parse({ projectId: crypto.randomUUID(), email: " MEMBER@Example.COM ", role: "member" }).email).toBe("member@example.com");
    expect(invitationInputSchema.safeParse({ projectId: crypto.randomUUID(), email: "a@example.com", role: "owner" }).success).toBe(false);
  });

  it("validates task limits, status and assignees", () => {
    const projectId = crypto.randomUUID();
    expect(taskInputSchema.safeParse({ projectId, title: "Tâche", description: "", priority: "high", dueDate: "2026-08-30", assigneeIds: [crypto.randomUUID()] }).success).toBe(true);
    expect(taskInputSchema.safeParse({ projectId, title: "", description: "", priority: "urgent", dueDate: "", assigneeIds: [] }).success).toBe(false);
    expect(taskStatusInputSchema.safeParse({ projectId, taskId: crypto.randomUUID(), status: "in_review" }).success).toBe(true);
  });

  it("hashes invitation tokens deterministically without retaining the token", async () => {
    const hash = await hashInvitationToken("a".repeat(64));
    expect(hash).toMatch(/^[a-f0-9]{64}$/);
    expect(hash).not.toContain("a".repeat(64));
    expect(await hashInvitationToken("a".repeat(64))).toBe(hash);
  });
});
