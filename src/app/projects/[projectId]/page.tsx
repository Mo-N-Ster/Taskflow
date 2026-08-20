import Link from "next/link";

const tasks = [
  { id: "T-103", title: "Créer le shell dashboard", status: "En cours", assignee: "Amina", priority: "Haute" },
  { id: "T-104", title: "Rédiger la politique de sécurisation", status: "En relecture", assignee: "Noah", priority: "Moyenne" },
  { id: "T-105", title: "Préparer la base de données", status: "À faire", assignee: "Sara", priority: "Moyenne" },
];

export default function ProjectPage() {
  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-slate-50">
      <div className="mx-auto max-w-6xl">
        <header className="mb-6 flex flex-col gap-4 rounded-3xl border border-slate-800 bg-slate-900/80 p-5 md:flex-row md:items-center md:justify-between">
          <div>
            <Link href="/dashboard" className="text-sm text-cyan-300 hover:text-cyan-200">← Dashboard</Link>
            <p className="mt-4 text-xs uppercase tracking-[0.22em] text-slate-400">Projet privé · Owner</p>
            <h1 className="mt-2 text-3xl font-semibold text-white">TaskFlow MVP</h1>
            <p className="mt-2 text-sm text-slate-400">Le parcours de livraison du produit collaboratif.</p>
          </div>
          <Link href="/projects/taskflow-mvp/tasks/T-103" className="rounded-2xl bg-cyan-400 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300">
            Ouvrir une tâche
          </Link>
        </header>

        <section className="grid gap-4 md:grid-cols-3">
          {[
            { label: "Progression", value: "50%" },
            { label: "Membres", value: "6" },
            { label: "Tâches ouvertes", value: "4" },
          ].map((stat) => (
            <article key={stat.label} className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
              <p className="text-sm text-slate-400">{stat.label}</p>
              <p className="mt-3 text-3xl font-semibold text-cyan-300">{stat.value}</p>
            </article>
          ))}
        </section>

        <section className="mt-8 rounded-3xl border border-slate-800 bg-slate-900 p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm text-slate-400">Tâches du projet</p>
              <h2 className="mt-1 text-xl font-semibold text-white">Suivi opérationnel</h2>
            </div>
            <button type="button" className="rounded-2xl border border-slate-700 px-3 py-2 text-sm text-slate-200">+ Nouvelle tâche</button>
          </div>

          <div className="mt-5 divide-y divide-slate-800">
            {tasks.map((task) => (
              <Link key={task.id} href={`/projects/taskflow-mvp/tasks/${task.id}`} className="flex flex-col gap-3 py-4 transition hover:bg-slate-950/60 sm:flex-row sm:items-center sm:justify-between sm:px-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-500">{task.id}</p>
                  <p className="mt-1 font-medium text-white">{task.title}</p>
                </div>
                <div className="flex items-center gap-3 text-sm text-slate-400">
                  <span>{task.assignee}</span>
                  <span className="rounded-full bg-cyan-500/10 px-2 py-1 text-cyan-200">{task.status}</span>
                  <span>{task.priority}</span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
