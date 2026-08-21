import Link from "next/link";
import { notFound } from "next/navigation";

import { updateTaskStatus } from "@/app/projects/collaboration-actions";
import { taskPriorityLabels, taskStatusLabels } from "@/lib/collaboration";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type Props = { params: Promise<{ projectId: string; taskId: string }>; searchParams: Promise<{ error?: string; status?: string }> };

export default async function TaskPage({ params, searchParams }: Props) {
  const { projectId, taskId } = await params;
  const query = await searchParams;
  const supabase = await createSupabaseServerClient();
  const { data: task } = await supabase.from("tasks").select("id,title,description,status,priority,due_date,projects(name),task_assignees(user_id,profiles(display_name))").eq("id", taskId).eq("project_id", projectId).maybeSingle();
  if (!task) notFound();
  const project = Array.isArray(task.projects) ? task.projects[0] : task.projects;
  const names = (task.task_assignees ?? []).map((item) => (Array.isArray(item.profiles) ? item.profiles[0] : item.profiles)?.display_name ?? "Utilisateur");
  return <main className="min-h-screen bg-slate-950 px-4 py-8 text-slate-50"><div className="mx-auto max-w-4xl"><Link href={`/projects/${projectId}`} className="text-sm text-cyan-300">← Retour au projet</Link>
    {query.error ? <p role="alert" className="mt-5 rounded-2xl border border-rose-500/30 bg-rose-500/10 p-3 text-sm text-rose-200">Vous n’êtes pas autorisé à modifier ce statut.</p> : null}{query.status === "UPDATED" ? <p role="status" className="mt-5 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-200">Statut mis à jour.</p> : null}
    <section className="mt-5 rounded-3xl border border-slate-800 bg-slate-900 p-6"><p className="text-xs uppercase tracking-[0.2em] text-slate-500">{project?.name}</p><h1 className="mt-2 text-3xl font-semibold">{task.title}</h1><p className="mt-4 whitespace-pre-wrap text-slate-300">{task.description || "Aucune description."}</p>
      <dl className="mt-6 grid gap-4 sm:grid-cols-3"><Info label="Priorité" value={taskPriorityLabels[task.priority as keyof typeof taskPriorityLabels]} /><Info label="Statut" value={taskStatusLabels[task.status as keyof typeof taskStatusLabels]} /><Info label="Échéance" value={task.due_date ?? "Non définie"} /></dl><p className="mt-6 text-sm text-slate-300">Assignés : {names.join(", ") || "Personne"}</p>
      <form action={updateTaskStatus} className="mt-8 flex flex-col gap-3 sm:flex-row"><input type="hidden" name="projectId" value={projectId} /><input type="hidden" name="taskId" value={taskId} /><label className="flex-1"><span className="mb-2 block text-sm">Nouveau statut</span><select name="status" defaultValue={task.status} className="control"><option value="todo">À faire</option><option value="in_progress">En cours</option><option value="in_review">En revue</option><option value="done">Terminée</option></select></label><button className="self-end rounded-xl bg-cyan-400 px-5 py-2 font-semibold text-slate-950">Mettre à jour</button></form>
    </section></div></main>;
}
function Info({ label, value }: { label: string; value: string }) { return <div><dt className="text-xs text-slate-500">{label}</dt><dd>{value}</dd></div>; }
