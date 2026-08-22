import Link from "next/link";
import { notFound } from "next/navigation";

import { createTask, inviteMember, leaveProject } from "@/app/projects/collaboration-actions";
import { taskPriorityLabels, taskStatusLabels } from "@/lib/collaboration";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type Props = { params: Promise<{ projectId: string }>; searchParams: Promise<{ error?: string; status?: string; invitation?: string; email?: string }> };

export default async function ProjectPage({ params, searchParams }: Props) {
  const { projectId } = await params;
  const query = await searchParams;
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: project } = await supabase.from("projects").select("id,name,description,visibility").eq("id", projectId).maybeSingle();
  if (!project || !user) notFound();

  const [{ data: members }, { data: tasks }, { data: activity }] = await Promise.all([
    supabase.from("project_members").select("user_id,role,profiles(display_name)").eq("project_id", projectId).order("joined_at"),
    supabase.from("tasks").select("id,title,status,priority,due_date").eq("project_id", projectId).order("created_at", { ascending: false }),
    supabase.from("activity_events").select("id,event_type,created_at,profiles(display_name)").eq("project_id", projectId).order("created_at", { ascending: false }).limit(20),
  ]);
  const role = members?.find((member) => member.user_id === user.id)?.role;
  const canManage = role === "owner" || role === "project_manager";
  const done = tasks?.filter((task) => task.status === "done").length ?? 0;
  const progress = tasks?.length ? Math.round(done / tasks.length * 100) : 0;

  return <main className="min-h-screen bg-slate-950 px-4 py-8 text-slate-50"><div className="mx-auto max-w-6xl">
    {query.error ? <p role="alert" className="mb-5 rounded-2xl border border-rose-500/30 bg-rose-500/10 p-3 text-sm text-rose-200">Action refusée ou données invalides ({query.error}).</p> : null}
    {query.status === "INVITATION_ACCEPTED" ? <p role="status" className="mb-5 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-200">Invitation acceptée.</p> : null}
    {query.invitation ? <div role="status" className="mb-5 rounded-2xl border border-cyan-500/30 bg-cyan-500/10 p-4 text-sm text-cyan-100"><b>{query.email === "SENT" ? "Invitation envoyée par email." : "Invitation créée, mais email non envoyé : configurez Resend. Copiez ce lien de secours :"}</b><code className="mt-2 block break-all rounded bg-slate-950 p-2">/invitations/accept?token={query.invitation}</code></div> : null}
    <header className="rounded-3xl border border-slate-800 bg-slate-900/80 p-5"><div className="flex flex-wrap items-center justify-between gap-3"><Link href="/dashboard" className="text-sm text-cyan-300">← Dashboard</Link>{role && role !== "owner" ? <form action={leaveProject}><input type="hidden" name="projectId" value={projectId} /><button className="rounded-xl border border-rose-500/50 px-3 py-2 text-sm text-rose-200">Quitter le projet</button></form> : null}</div><p className="mt-4 text-xs uppercase tracking-[0.22em] text-slate-400">Projet {project.visibility} · {role}</p><h1 className="mt-2 text-3xl font-semibold">{project.name}</h1><p className="mt-2 text-sm text-slate-400">{project.description || "Aucune description."}</p></header>
    <section className="mt-6 grid gap-4 md:grid-cols-3"><Metric label="Membres" value={members?.length ?? 0} /><Metric label="Tâches" value={tasks?.length ?? 0} /><Metric label="Avancement" value={`${progress}%`} /></section>

    {canManage ? <section className="mt-8 rounded-3xl border border-slate-800 bg-slate-900 p-5"><h2 className="text-xl font-semibold">Créer une tâche</h2><form action={createTask} className="mt-5 grid gap-4 md:grid-cols-2">
      <input type="hidden" name="projectId" value={projectId} /><Field label="Titre"><input aria-label="Titre" required maxLength={160} name="title" className="control" /></Field>
      <Field label="Priorité"><select aria-label="Priorité" name="priority" className="control"><option value="low">Basse</option><option value="medium">Moyenne</option><option value="high">Haute</option></select></Field>
      <label className="md:col-span-2"><span className="mb-2 block text-sm text-slate-300">Description de la tâche</span><textarea name="description" maxLength={5000} rows={3} className="control" /></label>
      <Field label="Échéance"><input aria-label="Échéance" type="date" name="dueDate" className="control" /></Field>
      <fieldset><legend className="mb-2 text-sm text-slate-300">Assignation</legend><div className="max-h-32 space-y-2 overflow-auto rounded-xl border border-slate-700 bg-slate-950 p-3">{(members ?? []).filter((m) => m.role !== "observer").map((m) => <label key={m.user_id} className="flex gap-2 text-sm"><input type="checkbox" name="assigneeIds" value={m.user_id} />{profileName(m.profiles)}</label>)}</div></fieldset>
      <button className="rounded-xl bg-cyan-400 px-4 py-3 font-semibold text-slate-950 md:col-span-2">Créer la tâche</button>
    </form></section> : null}

    <section className="mt-8 rounded-3xl border border-slate-800 bg-slate-900 p-5"><h2 className="text-xl font-semibold">Tâches</h2>{!tasks?.length ? <p className="mt-4 text-sm text-slate-400">Aucune tâche pour le moment.</p> : <div className="mt-5 space-y-3">{tasks.map((task) => <Link key={task.id} href={`/projects/${projectId}/tasks/${task.id}`} className="block rounded-2xl border border-slate-800 bg-slate-950 p-4 hover:border-cyan-500/40"><div className="flex flex-wrap justify-between gap-3"><p className="font-medium">{task.title}</p><div className="flex gap-2"><Badge>{taskPriorityLabels[task.priority as keyof typeof taskPriorityLabels]}</Badge><Badge>{taskStatusLabels[task.status as keyof typeof taskStatusLabels]}</Badge></div></div></Link>)}</div>}</section>

    <section className="mt-8 grid gap-6 lg:grid-cols-2"><article className="rounded-3xl border border-slate-800 bg-slate-900 p-5"><h2 className="text-xl font-semibold">Équipe</h2><div className="mt-4 divide-y divide-slate-800">{members?.map((m) => <div key={m.user_id} className="flex justify-between py-3"><p>{profileName(m.profiles)}</p><span className="text-xs text-cyan-200">{m.role}</span></div>)}</div></article>
      {role === "owner" ? <article className="rounded-3xl border border-slate-800 bg-slate-900 p-5"><h2 className="text-xl font-semibold">Inviter un membre</h2><form action={inviteMember} className="mt-4 space-y-4"><input type="hidden" name="projectId" value={projectId} /><Field label="Email"><input aria-label="Email du membre" type="email" name="email" required className="control" /></Field><Field label="Rôle"><select aria-label="Rôle" name="role" className="control"><option value="member">Membre</option><option value="project_manager">Chef de projet</option><option value="observer">Observateur</option></select></Field><button className="w-full rounded-xl border border-cyan-400 px-4 py-2 text-cyan-200">Créer le lien d’invitation</button></form></article> : null}
    </section>
    <section className="mt-8 rounded-3xl border border-slate-800 bg-slate-900 p-5"><h2 className="text-xl font-semibold">Activité récente</h2><div className="mt-4 space-y-3">{!activity?.length ? <p className="text-sm text-slate-400">Aucune activité.</p> : activity.map((event) => { const actor = Array.isArray(event.profiles) ? event.profiles[0] : event.profiles; return <article key={event.id} className="rounded-2xl border border-slate-800 bg-slate-950 p-3"><p className="text-sm"><b>{actor?.display_name ?? "Système"}</b> · {activityLabel(event.event_type)}</p><time className="mt-1 block text-xs text-slate-500">{new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium", timeStyle: "short" }).format(new Date(event.created_at))}</time></article>; })}</div></section>
  </div></main>;
}

function profileName(profiles: { display_name: string } | { display_name: string }[] | null) { return (Array.isArray(profiles) ? profiles[0] : profiles)?.display_name ?? "Utilisateur"; }
function Metric({ label, value }: { label: string; value: string | number }) { return <article className="rounded-2xl border border-slate-800 bg-slate-900 p-5"><p className="text-sm text-slate-400">{label}</p><p className="mt-3 text-3xl font-semibold text-cyan-300">{value}</p></article>; }
function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label className="block"><span className="mb-2 block text-sm text-slate-300">{label}</span>{children}</label>; }
function Badge({ children }: { children: React.ReactNode }) { return <span className="rounded-full bg-cyan-500/10 px-2 py-1 text-xs text-cyan-200">{children}</span>; }
function activityLabel(type: string) { return ({ "evaluation.created": "a ajouté une évaluation", "task.created": "a créé une tâche", "task.status_changed": "a modifié le statut d’une tâche", "task.assignees_changed": "a modifié les assignations", "comment.created": "a ajouté un commentaire", "member.invited": "a invité un membre", "member.joined": "a rejoint le projet", "member.left": "a quitté le projet" } as Record<string, string>)[type] ?? "a effectué une action"; }
