import { z } from "zod";

export const projectRoleSchema = z.enum(["project_manager", "member", "observer"]);
export const taskStatusSchema = z.enum(["todo", "in_progress", "in_review", "done"]);
export const taskPrioritySchema = z.enum(["low", "medium", "high"]);

export const invitationInputSchema = z.object({
  projectId: z.string().uuid(),
  email: z.string().trim().toLowerCase().email().max(320),
  role: projectRoleSchema,
});

export const invitationTokenSchema = z.string().regex(/^[a-f0-9]{64}$/);

export const taskInputSchema = z.object({
  projectId: z.string().uuid(),
  title: z.string().trim().min(1).max(160),
  description: z.string().trim().max(5000),
  priority: taskPrioritySchema,
  dueDate: z.union([z.literal(""), z.iso.date()]),
  assigneeIds: z.array(z.string().uuid()).max(50),
});

export const taskStatusInputSchema = z.object({
  projectId: z.string().uuid(),
  taskId: z.string().uuid(),
  status: taskStatusSchema,
});

export const invitationDecisionSchema = z.object({ invitationId: z.string().uuid() });
export const projectMembershipActionSchema = z.object({ projectId: z.string().uuid() });
export const taskReassignmentSchema = z.object({
  projectId: z.string().uuid(),
  taskId: z.string().uuid(),
  assigneeIds: z.array(z.string().uuid()).max(50),
});

export function hashInvitationToken(token: string) {
  const bytes = new TextEncoder().encode(token);
  return crypto.subtle.digest("SHA-256", bytes).then((digest) =>
    Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join(""),
  );
}

export const taskStatusLabels = {
  todo: "À faire",
  in_progress: "En cours",
  in_review: "En revue",
  done: "Terminée",
} as const;

export const taskPriorityLabels = { low: "Basse", medium: "Moyenne", high: "Haute" } as const;
