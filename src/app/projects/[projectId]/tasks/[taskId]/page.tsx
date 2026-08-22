import Link from "next/link";
import { notFound } from "next/navigation";

import { addTaskComment, reassignTask, updateTaskStatus } from "@/app/projects/collaboration-actions";
import { PendingSubmitButton } from "@/components/pending-submit-button";
import { taskPriorityLabels, taskStatusLabels } from "@/lib/collaboration";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type Props = { params: Promise<{ projectId: string; taskId: string }>; searchParams: Promise<{ error?: string; status?: string }> };

export default async function TaskPage({ params, searchParams }: Props) {
  const { projectId, taskId } = await params;
  const query = await searchParams;
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: task } = await supabase.from("tasks").select("id,title,description,status,priority,due_date,projects(name),task_assignees(user_id,profiles(display_name))").eq("id", taskId).eq("project_id", projectId).maybeSingle();
  if (!task || !user) notFound();
  const { data: members } = await supabase.from("project_members").select("user_id,role,profiles(display_name)").eq("project_id", projectId).order("joined_at");
  const currentRole = members?.find((member) => member.user_id === user.id)?.role;
  const assignedIds = new Set((task.task_assignees ?? []).map((item) => item.user_id));
  const canManage = currentRole === "owner" || currentRole === "project_manager";
  const canUpdateStatus = canManage || (currentRole === "member" && assignedIds.has(user.id));
  const canComment = currentRole !== "observer";
  const { data: comments } = await supabase.from("comments").select("id,body,created_at,author_id,profiles(display_name)").eq("task_id", taskId).order("created_at");
  const project = Array.isArray(task.projects) ? task.projects[0] : task.projects;
  const names = (task.task_assignees ?? []).map((item) => (Array.isArray(item.profiles) ? item.profiles[0] : item.profiles)?.display_name ?? "Utilisateur");
  return <main className="min-h-screen bg-slate-950 px-4 py-8 text-slate-50"><div className="mx-auto max-w-4xl"><Link href={`/projects/${projectId}`} className="text-sm text-cyan-300">← Retour au projet</Link>
    {query.error ? <p role="alert" className="mt-5 rounded-2xl border border-rose-500/30 bg-rose-500/10 p-3 text-sm text-rose-200">Vous n’êtes pas autorisé à effectuer cette modification.</p> : null}{query.status === "UPDATED" ? <p role="status" className="mt-5 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-200">Statut mis à jour.</p> : null}{query.status === "REASSIGNED" ? <p role="status" className="mt-5 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-200">Assignations mises à jour.</p> : null}
    <section className="mt-5 rounded-3xl border border-slate-800 bg-slate-900 p-6"><p className="text-xs uppercase tracking-[0.2em] text-slate-500">{project?.name}</p><h1 className="mt-2 text-3xl font-semibold">{task.title}</h1><p className="mt-4 whitespace-pre-wrap text-slate-300">{task.description || "Aucune description."}</p>
      <dl className="mt-6 grid gap-4 sm:grid-cols-3"><Info label="Priorité" value={taskPriorityLabels[task.priority as keyof typeof taskPriorityLabels]} /><Info label="Statut" value={taskStatusLabels[task.status as keyof typeof taskStatusLabels]} /><Info label="Échéance" value={task.due_date ?? "Non définie"} /></dl><p className="mt-6 text-sm text-slate-300">Assignés : {names.join(", ") || "Personne"}</p>
      {canUpdateStatus ? <form action={updateTaskStatus} className="mt-8 flex flex-col gap-3 sm:flex-row"><input type="hidden" name="projectId" value={projectId} /><input type="hidden" name="taskId" value={taskId} /><label className="flex-1"><span className="mb-2 block text-sm">Nouveau statut</span><select name="status" defaultValue={task.status} className="control"><option value="todo">À faire</option><option value="in_progress">En cours</option><option value="in_review">En revue</option><option value="done">Terminée</option></select></label><button className="self-end rounded-xl bg-cyan-400 px-5 py-2 font-semibold text-slate-950">Mettre à jour</button></form> : null}
      {canManage ? <form action={reassignTask} className="mt-8 rounded-2xl border border-slate-700 p-4"><input type="hidden" name="projectId" value={projectId} /><input type="hidden" name="taskId" value={taskId} /><fieldset><legend className="font-medium">Réassigner la tâche</legend><p className="mt-1 text-xs text-slate-400">Une tâche libérée après le départ d’un membre peut être attribuée immédiatement.</p><div className="mt-3 grid gap-2 sm:grid-cols-2">{(members ?? []).filter((member) => member.role !== "observer").map((member) => { const profile = Array.isArray(member.profiles) ? member.profiles[0] : member.profiles; return <label key={member.user_id} className="flex items-center gap-2 text-sm"><input type="checkbox" name="assigneeIds" value={member.user_id} defaultChecked={assignedIds.has(member.user_id)} />{profile?.display_name ?? "Utilisateur"}</label>; })}</div></fieldset><button className="mt-4 rounded-xl border border-cyan-400 px-4 py-2 text-sm text-cyan-200">Enregistrer les assignations</button></form> : null}
    </section>
    <section className="mt-8 rounded-3xl border border-slate-800 bg-slate-900 p-6"><h2 className="text-xl font-semibold">Commentaires</h2>
      {canComment ? <form action={addTaskComment} className="mt-5"><input type="hidden" name="projectId" value={projectId} /><input type="hidden" name="taskId" value={taskId} /><label><span className="mb-2 block text-sm text-slate-300">Nouveau commentaire</span><textarea aria-label="Nouveau commentaire" name="body" required maxLength={5000} rows={3} className="control" /></label><PendingSubmitButton pendingLabel="Publication…" className="mt-3 rounded-xl bg-cyan-400 px-4 py-2 font-semibold text-slate-950 disabled:opacity-60">Publier</PendingSubmitButton></form> : <p className="mt-4 text-sm text-slate-400">Les observateurs peuvent lire la discussion mais pas commenter.</p>}
      <div className="mt-6 space-y-3">{!comments?.length ? <p className="text-sm text-slate-400">Aucun commentaire.</p> : comments.map((comment) => { const profile = Array.isArray(comment.profiles) ? comment.profiles[0] : comment.profiles; return <article key={comment.id} className="rounded-2xl border border-slate-800 bg-slate-950 p-4"><div className="flex justify-between gap-3 text-xs text-slate-400"><span>{profile?.display_name ?? "Utilisateur"}</span><time>{new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium", timeStyle: "short" }).format(new Date(comment.created_at))}</time></div><p className="mt-3 whitespace-pre-wrap text-sm text-slate-200">{comment.body}</p></article>; })}</div>
    </section></div></main>;
}
function Info({ label, value }: { label: string; value: string }) { return <div><dt className="text-xs text-slate-500">{label}</dt><dd>{value}</dd></div>; }
