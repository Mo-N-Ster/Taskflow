import Link from "next/link";

import { logout } from "@/app/auth/actions";
import { acceptInvitationFromDashboard, declineInvitationFromDashboard, openNotification } from "@/app/projects/collaboration-actions";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { PendingSubmitButton } from "@/components/pending-submit-button";

type ProjectSummary = {
  id: string;
  name: string;
  visibility: "private" | "public";
  owner_id: string;
};

type DashboardPageProps = {
  searchParams: Promise<{ error?: string; status?: string }>;
};

type PendingInvitation = { id: string; project_id: string; project_name: string; role: string; expires_at: string };

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const { error, status } = await searchParams;
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data } = await supabase
    .from("projects")
    .select("id, name, visibility, owner_id")
    .order("created_at", { ascending: false });
  const projects = (data ?? []) as ProjectSummary[];
  const { count: activeTaskCount } = await supabase
    .from("tasks")
    .select("id", { count: "exact", head: true })
    .neq("status", "done");
  const { data: invitationData } = await supabase.rpc("list_my_pending_invitations");
  const invitations = (invitationData ?? []) as PendingInvitation[];
  const { data: notifications } = await supabase.from("notifications").select("id,project_id,task_id,event_type,read_at,created_at,projects(name),tasks(title)").order("created_at", { ascending: false }).limit(20);

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-slate-50">
      <div className="mx-auto max-w-6xl">
        {error === "LOGOUT_FAILED" ? (
          <p role="alert" className="mb-6 rounded-2xl border border-rose-500/30 bg-rose-500/10 p-3 text-sm text-rose-200">
            La déconnexion a échoué. Veuillez réessayer.
          </p>
        ) : null}
        {error === "INVITATION_EMAIL_MISMATCH" ? <p role="alert" className="mb-6 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-100">Cette invitation appartient à une autre adresse. Vous êtes actuellement connecté avec {user?.email}. Déconnectez-vous, puis utilisez exactement l’adresse destinataire de l’invitation.</p> : null}
        {error && !["LOGOUT_FAILED", "INVITATION_EMAIL_MISMATCH"].includes(error) ? <p role="alert" className="mb-6 rounded-2xl border border-rose-500/30 bg-rose-500/10 p-3 text-sm text-rose-200">Cette invitation est expirée, refusée ou n’est plus active.</p> : null}
        {status === "INVITATION_DECLINED" ? <p role="status" className="mb-6 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-200">Invitation refusée.</p> : null}
        {status === "PROJECT_LEFT" ? <p role="status" className="mb-6 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-200">Vous avez quitté le projet. Vos anciennes assignations ont été libérées.</p> : null}
        <header className="mb-6 flex flex-col gap-4 rounded-3xl border border-slate-800 bg-slate-900/80 p-5 backdrop-blur-sm md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-cyan-300">TaskFlow</p>
            <h1 className="mt-2 text-3xl font-semibold text-white">Dashboard</h1>
            <p className="mt-2 text-sm text-slate-400">{user?.email}</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Link href="/projects/new" className="rounded-full bg-cyan-400 px-4 py-2 text-sm font-medium text-slate-950 transition hover:bg-cyan-300">+ Nouveau projet</Link>
            <form action={logout}>
              <button type="submit" className="rounded-full border border-slate-700 px-4 py-2 text-sm text-slate-200 transition hover:border-slate-500">Déconnexion</button>
            </form>
          </div>
        </header>

        <section className="grid gap-4 md:grid-cols-3">
          <article className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
            <p className="text-sm text-slate-400">Projets accessibles</p>
            <p className="mt-3 text-3xl font-semibold text-cyan-300">{projects.length}</p>
          </article>
          <article className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
            <p className="text-sm text-slate-400">Projets possédés</p>
            <p className="mt-3 text-3xl font-semibold text-violet-300">{projects.filter((project) => project.owner_id === user?.id).length}</p>
          </article>
          <article className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
            <p className="text-sm text-slate-400">Tâches actives</p>
            <p className="mt-3 text-3xl font-semibold text-emerald-300">{activeTaskCount ?? 0}</p>
          </article>
        </section>

        {invitations.length > 0 ? <section className="mt-8 rounded-3xl border border-cyan-500/30 bg-cyan-500/10 p-5">
          <h2 className="text-lg font-semibold text-cyan-100">Invitations en attente</h2>
          <div className="mt-4 space-y-3">{invitations.map((invitation) => <article key={invitation.id} className="rounded-2xl border border-cyan-500/20 bg-slate-950/70 p-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-medium text-white">{invitation.project_name}</p><p className="mt-1 text-xs text-slate-400">Rôle : {invitation.role} · expire le {new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium" }).format(new Date(invitation.expires_at))}</p></div><div className="flex gap-2">
              <form action={acceptInvitationFromDashboard}><input type="hidden" name="invitationId" value={invitation.id} /><PendingSubmitButton pendingLabel="Acceptation…" className="rounded-xl bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950 disabled:cursor-wait disabled:opacity-60">Accepter</PendingSubmitButton></form>
              <form action={declineInvitationFromDashboard}><input type="hidden" name="invitationId" value={invitation.id} /><PendingSubmitButton pendingLabel="Refus…" className="rounded-xl border border-slate-600 px-4 py-2 text-sm text-slate-200 disabled:cursor-wait disabled:opacity-60">Refuser</PendingSubmitButton></form>
            </div></div>
          </article>)}</div>
        </section> : null}

        {notifications?.length ? <section className="mt-8 rounded-3xl border border-violet-500/30 bg-violet-500/10 p-5"><h2 className="text-lg font-semibold text-violet-100">Notifications</h2><div className="mt-4 space-y-3">{notifications.map((notification) => { const project = Array.isArray(notification.projects) ? notification.projects[0] : notification.projects; const task = Array.isArray(notification.tasks) ? notification.tasks[0] : notification.tasks; return <form action={openNotification} key={notification.id} className={`rounded-2xl border p-4 ${notification.read_at ? "border-slate-800 bg-slate-950/50" : "border-violet-400/40 bg-slate-950"}`}><input type="hidden" name="notificationId" value={notification.id} /><input type="hidden" name="projectId" value={notification.project_id} /><input type="hidden" name="taskId" value={notification.task_id ?? ""} /><div className="flex items-center justify-between gap-3"><div><p className="text-sm text-white">Nouveau commentaire sur {task?.title ?? "une tâche"}</p><p className="mt-1 text-xs text-slate-400">{project?.name} · {new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium", timeStyle: "short" }).format(new Date(notification.created_at))}</p></div><button className="text-sm text-violet-200">Ouvrir</button></div></form>; })}</div></section> : null}

        <section className="mt-8 rounded-3xl border border-slate-800 bg-slate-900 p-5">
          <h2 className="text-lg font-semibold text-white">Mes projets</h2>
          {projects.length === 0 ? (
            <div className="mt-5 rounded-2xl border border-dashed border-slate-700 bg-slate-950/60 p-6 text-center">
              <p className="text-slate-300">Aucun projet accessible.</p>
              <Link href="/projects/new" className="mt-3 inline-block text-sm text-cyan-300 hover:text-cyan-200">Créer le premier projet</Link>
            </div>
          ) : (
            <div className="mt-5 space-y-4">
              {projects.map((project) => (
                <Link href={`/projects/${project.id}`} key={project.id} className="block rounded-2xl border border-slate-800 bg-slate-950/70 p-4 transition hover:border-cyan-400/40">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-lg font-medium text-white">{project.name}</p>
                    <span className="rounded-full bg-cyan-500/10 px-2 py-1 text-xs uppercase tracking-[0.16em] text-cyan-200">{project.visibility === "private" ? "Privé" : "Public"}</span>
                  </div>
                  <p className="mt-2 text-sm text-slate-400">{project.owner_id === user?.id ? "Propriétaire" : "Membre"}</p>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
