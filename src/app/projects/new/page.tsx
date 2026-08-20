import Link from "next/link";

export default function NewProjectPage() {
  return (
    <main className="min-h-screen bg-slate-950 px-4 py-10 text-slate-50">
      <div className="mx-auto max-w-2xl rounded-3xl border border-slate-800 bg-slate-900/80 p-6 shadow-2xl shadow-slate-950/60">
        <div className="mb-6 flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-cyan-300">TaskFlow</p>
            <h1 className="mt-2 text-3xl font-semibold text-white">Nouveau projet</h1>
          </div>
          <Link href="/dashboard" className="text-sm text-cyan-300 hover:text-cyan-200">
            Retour
          </Link>
        </div>

        <form className="space-y-5">
          <label className="block">
            <span className="mb-2 block text-sm text-slate-300">Nom du projet</span>
            <input
              type="text"
              defaultValue="TaskFlow MVP"
              className="w-full rounded-2xl border border-slate-700 bg-slate-950/70 px-3 py-2.5 text-slate-100 outline-none transition focus:border-cyan-400"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm text-slate-300">Description</span>
            <textarea
              rows={4}
              defaultValue="Suivi de livraison et pilotage des tâches de l'équipe produit."
              className="w-full rounded-2xl border border-slate-700 bg-slate-950/70 px-3 py-2.5 text-slate-100 outline-none transition focus:border-cyan-400"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm text-slate-300">Visibilité</span>
            <select className="w-full rounded-2xl border border-slate-700 bg-slate-950/70 px-3 py-2.5 text-slate-100 outline-none transition focus:border-cyan-400">
              <option>Privé</option>
              <option>Public</option>
            </select>
          </label>

          <button
            type="submit"
            className="w-full rounded-2xl bg-cyan-400 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300"
          >
            Créer le projet
          </button>
        </form>
      </div>
    </main>
  );
}
