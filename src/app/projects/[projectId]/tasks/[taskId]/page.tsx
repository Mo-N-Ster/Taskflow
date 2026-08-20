import Link from "next/link";
import { notFound } from "next/navigation";

import { createSupabaseServerClient } from "@/lib/supabase/server";

type TaskPageProps = {
  params: Promise<{ projectId: string; taskId: string }>;
};

export default async function TaskPage({ params }: TaskPageProps) {
  const { projectId, taskId } = await params;
  const supabase = await createSupabaseServerClient();
  const { data: project } = await supabase.from("projects").select("id, name").eq("id", projectId).maybeSingle();

  if (!project) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-slate-50">
      <div className="mx-auto max-w-4xl">
        <Link href={`/projects/${project.id}`} className="text-sm text-cyan-300 hover:text-cyan-200">← Retour au projet</Link>
        <section className="mt-5 rounded-3xl border border-slate-800 bg-slate-900 p-6">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">{taskId} · {project.name}</p>
          <h1 className="mt-2 text-3xl font-semibold text-white">Tâches disponibles au Jalon 3</h1>
          <p className="mt-3 text-sm leading-6 text-slate-400">
            Cette route reste réservée aux membres du projet. Les données de tâche ne seront affichées qu’après création du schéma, des permissions et des tests associés.
          </p>
        </section>
      </div>
    </main>
  );
}
