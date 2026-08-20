import Link from "next/link";

export default function TaskPage() {
  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-slate-50">
      <div className="mx-auto max-w-4xl">
        <Link href="/projects/taskflow-mvp" className="text-sm text-cyan-300 hover:text-cyan-200">← Retour au projet</Link>
        <section className="mt-5 rounded-3xl border border-slate-800 bg-slate-900 p-6">
          <div className="flex flex-col gap-4 border-b border-slate-800 pb-6 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">T-103 · TaskFlow MVP</p>
              <h1 className="mt-2 text-3xl font-semibold text-white">Créer le shell dashboard</h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">Structurer le tableau de pilotage, ses indicateurs et les accès aux parcours produit.</p>
            </div>
            <span className="rounded-full bg-blue-500/15 px-3 py-1.5 text-sm font-medium text-blue-300">En cours</span>
          </div>

          <div className="grid gap-4 py-6 sm:grid-cols-3">
            <div><p className="text-xs uppercase tracking-[0.16em] text-slate-500">Assignée à</p><p className="mt-2 text-sm text-slate-200">Amina</p></div>
            <div><p className="text-xs uppercase tracking-[0.16em] text-slate-500">Priorité</p><p className="mt-2 text-sm text-rose-300">Haute</p></div>
            <div><p className="text-xs uppercase tracking-[0.16em] text-slate-500">Échéance</p><p className="mt-2 text-sm text-slate-200">24 août 2026</p></div>
          </div>

          <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-950/60 p-5">
            <p className="text-sm font-medium text-white">Commentaires</p>
            <p className="mt-2 text-sm text-slate-500">Aucun commentaire pour le moment.</p>
          </div>
        </section>
      </div>
    </main>
  );
}
