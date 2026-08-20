import Link from "next/link";

import { logout } from "@/app/auth/actions";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type ProjectSummary = {
  id: string;
  name: string;
  visibility: "private" | "public";
  owner_id: string;
};

export default async function DashboardPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data } = await supabase
    .from("projects")
    .select("id, name, visibility, owner_id")
    .order("created_at", { ascending: false });
  const projects = (data ?? []) as ProjectSummary[];

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-slate-50">
      <div className="mx-auto max-w-6xl">
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
            <p className="mt-3 text-3xl font-semibold text-slate-500">—</p>
            <p className="mt-2 text-xs text-slate-500">Disponible au Jalon 3</p>
          </article>
        </section>

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
