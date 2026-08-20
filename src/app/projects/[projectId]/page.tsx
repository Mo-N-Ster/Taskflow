import Link from "next/link";
import { notFound } from "next/navigation";

import { createSupabaseServerClient } from "@/lib/supabase/server";

type ProjectPageProps = {
  params: Promise<{ projectId: string }>;
};

export default async function ProjectPage({ params }: ProjectPageProps) {
  const { projectId } = await params;
  const supabase = await createSupabaseServerClient();
  const { data: project } = await supabase.from("projects").select("id, name, description, visibility, owner_id").eq("id", projectId).maybeSingle();

  if (!project) {
    notFound();
  }

  const { data: members } = await supabase.from("project_members").select("user_id, role, profiles(display_name)").eq("project_id", project.id).order("joined_at");

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-slate-50">
      <div className="mx-auto max-w-6xl">
        <header className="mb-6 rounded-3xl border border-slate-800 bg-slate-900/80 p-5">
          <Link href="/dashboard" className="text-sm text-cyan-300 hover:text-cyan-200">← Dashboard</Link>
          <p className="mt-4 text-xs uppercase tracking-[0.22em] text-slate-400">Projet {project.visibility === "private" ? "privé" : "public"}</p>
          <h1 className="mt-2 text-3xl font-semibold text-white">{project.name}</h1>
          <p className="mt-2 text-sm text-slate-400">{project.description || "Aucune description."}</p>
        </header>

        <section className="grid gap-4 md:grid-cols-2">
          <article className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
            <p className="text-sm text-slate-400">Membres</p>
            <p className="mt-3 text-3xl font-semibold text-cyan-300">{members?.length ?? 0}</p>
          </article>
          <article className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
            <p className="text-sm text-slate-400">Tâches</p>
            <p className="mt-3 text-3xl font-semibold text-slate-500">—</p>
            <p className="mt-2 text-xs text-slate-500">Disponible au Jalon 3</p>
          </article>
        </section>

        <section className="mt-8 rounded-3xl border border-slate-800 bg-slate-900 p-5">
          <h2 className="text-xl font-semibold text-white">Équipe</h2>
          <div className="mt-5 divide-y divide-slate-800">
            {(members ?? []).map((member) => {
              const profile = Array.isArray(member.profiles) ? member.profiles[0] : member.profiles;
              return (
                <div key={member.user_id} className="flex items-center justify-between gap-4 py-4">
                  <p className="text-slate-200">{profile?.display_name ?? "Utilisateur"}</p>
                  <span className="rounded-full bg-cyan-500/10 px-2 py-1 text-xs text-cyan-200">{member.role}</span>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </main>
  );
}
