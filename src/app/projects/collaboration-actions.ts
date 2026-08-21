"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  hashInvitationToken,
  invitationInputSchema,
  invitationTokenSchema,
  taskInputSchema,
  taskStatusInputSchema,
} from "@/lib/collaboration";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function value(formData: FormData, name: string) {
  const entry = formData.get(name);
  return typeof entry === "string" ? entry : "";
}

async function authenticatedClient() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  return { supabase, user };
}

export async function inviteMember(formData: FormData) {
  const parsed = invitationInputSchema.safeParse({
    projectId: value(formData, "projectId"), email: value(formData, "email"), role: value(formData, "role"),
  });
  if (!parsed.success) redirect(`/projects/${value(formData, "projectId")}?error=INVALID_INVITATION`);

  const { supabase, user } = await authenticatedClient();
  const token = Array.from(crypto.getRandomValues(new Uint8Array(32)), (byte) => byte.toString(16).padStart(2, "0")).join("");
  const tokenHash = await hashInvitationToken(token);
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
  const { error } = await supabase.from("project_invitations").insert({
    project_id: parsed.data.projectId, email: parsed.data.email, role: parsed.data.role,
    token_hash: tokenHash, invited_by: user.id, expires_at: expiresAt,
  });
  if (error) redirect(`/projects/${parsed.data.projectId}?error=INVITATION_FAILED`);
  revalidatePath(`/projects/${parsed.data.projectId}`);
  redirect(`/projects/${parsed.data.projectId}?invitation=${token}`);
}

export async function acceptInvitation(formData: FormData) {
  const token = value(formData, "token");
  const parsed = invitationTokenSchema.safeParse(token);
  if (!parsed.success) redirect("/invitations/accept?error=INVALID_INVITATION");
  const { supabase } = await authenticatedClient();
  const tokenHash = await hashInvitationToken(parsed.data);
  const { data: projectId, error } = await supabase.rpc("accept_project_invitation", { invitation_token_hash: tokenHash });
  if (error || typeof projectId !== "string") redirect(`/invitations/accept?token=${token}&error=INVITATION_REJECTED`);
  revalidatePath("/dashboard");
  redirect(`/projects/${projectId}?status=INVITATION_ACCEPTED`);
}

export async function createTask(formData: FormData) {
  const parsed = taskInputSchema.safeParse({
    projectId: value(formData, "projectId"), title: value(formData, "title"),
    description: value(formData, "description"), priority: value(formData, "priority"),
    dueDate: value(formData, "dueDate"), assigneeIds: formData.getAll("assigneeIds").filter((id): id is string => typeof id === "string"),
  });
  if (!parsed.success) redirect(`/projects/${value(formData, "projectId")}?error=INVALID_TASK`);
  const { supabase } = await authenticatedClient();
  const taskId = crypto.randomUUID();
  const { error } = await supabase.rpc("create_project_task", {
    task_id: taskId,
    task_project_id: parsed.data.projectId,
    task_title: parsed.data.title,
    task_description: parsed.data.description,
    task_priority: parsed.data.priority,
    task_due_date: parsed.data.dueDate || null,
    task_assignee_ids: parsed.data.assigneeIds,
  });
  if (error) redirect(`/projects/${parsed.data.projectId}?error=TASK_CREATION_FAILED`);
  revalidatePath(`/projects/${parsed.data.projectId}`);
  redirect(`/projects/${parsed.data.projectId}/tasks/${taskId}`);
}

export async function updateTaskStatus(formData: FormData) {
  const parsed = taskStatusInputSchema.safeParse({
    projectId: value(formData, "projectId"), taskId: value(formData, "taskId"), status: value(formData, "status"),
  });
  if (!parsed.success) redirect(`/projects/${value(formData, "projectId")}?error=INVALID_STATUS`);
  const { supabase } = await authenticatedClient();
  const { error } = await supabase.from("tasks").update({ status: parsed.data.status }).eq("id", parsed.data.taskId).eq("project_id", parsed.data.projectId);
  if (error) redirect(`/projects/${parsed.data.projectId}/tasks/${parsed.data.taskId}?error=STATUS_UPDATE_FORBIDDEN`);
  revalidatePath(`/projects/${parsed.data.projectId}`);
  revalidatePath(`/projects/${parsed.data.projectId}/tasks/${parsed.data.taskId}`);
  redirect(`/projects/${parsed.data.projectId}/tasks/${parsed.data.taskId}?status=UPDATED`);
}
