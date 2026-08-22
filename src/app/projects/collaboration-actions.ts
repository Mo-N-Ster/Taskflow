"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  hashInvitationToken,
  invitationDecisionSchema,
  invitationInputSchema,
  invitationTokenSchema,
  projectMembershipActionSchema,
  taskReassignmentSchema,
  taskInputSchema,
  taskStatusInputSchema,
  commentInputSchema,
  notificationActionSchema,
} from "@/lib/collaboration";
import { getAppUrl } from "@/lib/app-url";
import { sendInvitationEmail } from "@/lib/invitation-email";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function value(formData: FormData, name: string) {
  const entry = formData.get(name);
  return typeof entry === "string" ? entry : "";
}

function invitationErrorCode(message?: string) {
  if (message?.includes("INVITATION_EMAIL_MISMATCH")) return "INVITATION_EMAIL_MISMATCH";
  if (message?.includes("INVITATION_ALREADY_ACCEPTED")) return "INVITATION_ALREADY_ACCEPTED";
  if (message?.includes("INVITATION_INACTIVE") || message?.includes("INVITATION_REVOKED")) return "INVITATION_INACTIVE";
  if (message?.includes("INVITATION_EXPIRED")) return "INVITATION_EXPIRED";
  return "INVITATION_REJECTED";
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

  const { supabase } = await authenticatedClient();
  const token = Array.from(crypto.getRandomValues(new Uint8Array(32)), (byte) => byte.toString(16).padStart(2, "0")).join("");
  const tokenHash = await hashInvitationToken(token);
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
  const { error } = await supabase.rpc("create_or_refresh_project_invitation", {
    invitation_project_id: parsed.data.projectId,
    invitation_email: parsed.data.email,
    invitation_role: parsed.data.role,
    invitation_token_hash: tokenHash,
    invitation_expires_at: expiresAt,
  });
  if (error) redirect(`/projects/${parsed.data.projectId}?error=INVITATION_FAILED`);
  const { data: project } = await supabase.from("projects").select("name").eq("id", parsed.data.projectId).maybeSingle();
  const invitationUrl = `${getAppUrl()}/invitations/accept?token=${token}`;
  const emailResult = await sendInvitationEmail({
    to: parsed.data.email,
    projectName: project?.name ?? "TaskFlow",
    invitationUrl,
    role: parsed.data.role,
  });
  revalidatePath(`/projects/${parsed.data.projectId}`);
  redirect(`/projects/${parsed.data.projectId}?invitation=${token}&email=${emailResult.sent ? "SENT" : "NOT_SENT"}`);
}

export async function acceptInvitation(formData: FormData) {
  const token = value(formData, "token");
  const parsed = invitationTokenSchema.safeParse(token);
  if (!parsed.success) redirect("/invitations/accept?error=INVALID_INVITATION");
  const { supabase } = await authenticatedClient();
  const tokenHash = await hashInvitationToken(parsed.data);
  const { data: projectId, error } = await supabase.rpc("accept_project_invitation", { invitation_token_hash: tokenHash });
  if (error || typeof projectId !== "string") redirect(`/invitations/accept?token=${token}&error=${invitationErrorCode(error?.message)}`);
  revalidatePath("/dashboard");
  redirect(`/projects/${projectId}?status=INVITATION_ACCEPTED`);
}

export async function declineInvitationByToken(formData: FormData) {
  const token = value(formData, "token");
  const parsed = invitationTokenSchema.safeParse(token);
  if (!parsed.success) redirect("/invitations/accept?error=INVALID_INVITATION");
  const { supabase } = await authenticatedClient();
  const tokenHash = await hashInvitationToken(parsed.data);
  const { error } = await supabase.rpc("decline_project_invitation_by_token", { invitation_token_hash: tokenHash });
  if (error) redirect(`/invitations/accept?token=${token}&error=${invitationErrorCode(error.message)}`);
  revalidatePath("/dashboard");
  redirect("/dashboard?status=INVITATION_DECLINED");
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

export async function acceptInvitationFromDashboard(formData: FormData) {
  const parsed = invitationDecisionSchema.safeParse({ invitationId: value(formData, "invitationId") });
  if (!parsed.success) redirect("/dashboard?error=INVALID_INVITATION");
  const { supabase } = await authenticatedClient();
  const { data: projectId, error } = await supabase.rpc("accept_project_invitation_by_id", { invitation_id: parsed.data.invitationId });
  if (error || typeof projectId !== "string") redirect(`/dashboard?error=${invitationErrorCode(error?.message)}`);
  revalidatePath("/dashboard");
  redirect(`/projects/${projectId}?status=INVITATION_ACCEPTED`);
}

export async function declineInvitationFromDashboard(formData: FormData) {
  const parsed = invitationDecisionSchema.safeParse({ invitationId: value(formData, "invitationId") });
  if (!parsed.success) redirect("/dashboard?error=INVALID_INVITATION");
  const { supabase } = await authenticatedClient();
  const { error } = await supabase.rpc("decline_project_invitation", { invitation_id: parsed.data.invitationId });
  if (error) redirect(`/dashboard?error=${invitationErrorCode(error.message)}`);
  revalidatePath("/dashboard");
  redirect("/dashboard?status=INVITATION_DECLINED");
}

export async function leaveProject(formData: FormData) {
  const parsed = projectMembershipActionSchema.safeParse({ projectId: value(formData, "projectId") });
  if (!parsed.success) redirect("/dashboard?error=INVALID_PROJECT");
  const { supabase } = await authenticatedClient();
  const { error } = await supabase.rpc("leave_project", { leave_project_id: parsed.data.projectId });
  if (error) redirect(`/projects/${parsed.data.projectId}?error=LEAVE_PROJECT_FAILED`);
  revalidatePath("/dashboard");
  redirect("/dashboard?status=PROJECT_LEFT");
}

export async function reassignTask(formData: FormData) {
  const parsed = taskReassignmentSchema.safeParse({
    projectId: value(formData, "projectId"),
    taskId: value(formData, "taskId"),
    assigneeIds: formData.getAll("assigneeIds").filter((id): id is string => typeof id === "string"),
  });
  if (!parsed.success) redirect(`/projects/${value(formData, "projectId")}?error=INVALID_ASSIGNMENT`);
  const { supabase } = await authenticatedClient();
  const { error } = await supabase.rpc("set_task_assignees", {
    reassigned_task_id: parsed.data.taskId,
    reassigned_user_ids: parsed.data.assigneeIds,
  });
  if (error) redirect(`/projects/${parsed.data.projectId}/tasks/${parsed.data.taskId}?error=ASSIGNMENT_FORBIDDEN`);
  revalidatePath(`/projects/${parsed.data.projectId}`);
  revalidatePath(`/projects/${parsed.data.projectId}/tasks/${parsed.data.taskId}`);
  redirect(`/projects/${parsed.data.projectId}/tasks/${parsed.data.taskId}?status=REASSIGNED`);
}

export async function addTaskComment(formData: FormData) {
  const parsed = commentInputSchema.safeParse({ projectId: value(formData, "projectId"), taskId: value(formData, "taskId"), body: value(formData, "body") });
  if (!parsed.success) redirect(`/projects/${value(formData, "projectId")}/tasks/${value(formData, "taskId")}?error=INVALID_COMMENT`);
  const { supabase } = await authenticatedClient();
  const { error } = await supabase.rpc("add_task_comment", { comment_task_id: parsed.data.taskId, comment_body: parsed.data.body });
  if (error) redirect(`/projects/${parsed.data.projectId}/tasks/${parsed.data.taskId}?error=COMMENT_FORBIDDEN`);
  revalidatePath(`/projects/${parsed.data.projectId}`); revalidatePath(`/projects/${parsed.data.projectId}/tasks/${parsed.data.taskId}`); revalidatePath("/dashboard");
  redirect(`/projects/${parsed.data.projectId}/tasks/${parsed.data.taskId}?status=COMMENT_ADDED`);
}

export async function openNotification(formData: FormData) {
  const parsed = notificationActionSchema.safeParse({ notificationId: value(formData, "notificationId"), projectId: value(formData, "projectId"), taskId: value(formData, "taskId") });
  if (!parsed.success) redirect("/dashboard?error=INVALID_NOTIFICATION");
  const { supabase } = await authenticatedClient();
  const { error } = await supabase.rpc("mark_notification_read", { notification_id: Number(parsed.data.notificationId) });
  if (error) redirect("/dashboard?error=NOTIFICATION_FORBIDDEN");
  revalidatePath("/dashboard"); redirect(`/projects/${parsed.data.projectId}/tasks/${parsed.data.taskId}`);
}
