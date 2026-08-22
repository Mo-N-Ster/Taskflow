import { describe, expect, it } from "vitest";

import { commentInputSchema, hashInvitationToken, invitationInputSchema, notificationActionSchema, taskInputSchema, taskStatusInputSchema } from "./collaboration";

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

describe("Jalon 4 validation", () => {
  it("accepts a trimmed comment and rejects empty or oversized content", () => {
    const input = { projectId: crypto.randomUUID(), taskId: crypto.randomUUID() };
    expect(commentInputSchema.parse({ ...input, body: "  Mise à jour disponible.  " }).body).toBe("Mise à jour disponible.");
    expect(commentInputSchema.safeParse({ ...input, body: "   " }).success).toBe(false);
    expect(commentInputSchema.safeParse({ ...input, body: "x".repeat(5001) }).success).toBe(false);
  });

  it("accepts only a numeric notification identifier and valid context", () => {
    const input = { notificationId: "42", projectId: crypto.randomUUID(), taskId: crypto.randomUUID() };
    expect(notificationActionSchema.safeParse(input).success).toBe(true);
    expect(notificationActionSchema.safeParse({ ...input, notificationId: "42x" }).success).toBe(false);
  });
});
