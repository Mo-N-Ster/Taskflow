import {
  getProjectProgress,
  getTaskStatusCounts,
  getTaskSummary,
  type ProjectTask,
  type TaskStatus,
} from "../lib/taskflow";

const tasks: ProjectTask[] = [
  { id: "T-101", title: "Définir le scope MVP", status: "done", assignee: "Marie", priority: "High" },
  { id: "T-102", title: "Valider les parcours utilisateur", status: "done", assignee: "Léo", priority: "High" },
  { id: "T-103", title: "Créer le shell dashboard", status: "in_progress", assignee: "Amina", priority: "High" },
  { id: "T-104", title: "Rédiger la politique de sécurisation", status: "review", assignee: "Noah", priority: "Medium" },
  { id: "T-105", title: "Préparer la base de données", status: "todo", assignee: "Sara", priority: "Medium" },
  { id: "T-106", title: "Tester les permissions projet", status: "todo", assignee: "Ibrahim", priority: "Low" },
];

const statusLabels: Record<TaskStatus, string> = {
  todo: "À faire",
  in_progress: "En cours",
  review: "En relecture",
  done: "Terminé",
};

const statusClasses: Record<TaskStatus, string> = {
  todo: "bg-slate-100 text-slate-700",
  in_progress: "bg-blue-100 text-blue-700",
  review: "bg-amber-100 text-amber-700",
  done: "bg-emerald-100 text-emerald-700",
};

export default function Home() {
  const completion = getProjectProgress(tasks);
  const statusCounts = getTaskStatusCounts(tasks);
  const summary = getTaskSummary(tasks);

  return (
    <main className="min-h-screen bg-slate-950 text-slate-50">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <header className="mb-8 flex flex-col gap-4 rounded-3xl border border-slate-800 bg-slate-900/70 p-6 shadow-2xl shadow-slate-950/50 backdrop-blur-sm md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.22em] text-cyan-300">TaskFlow</p>
            <h1 className="mt-2 text-3xl font-semibold text-white">Tableau de pilotage du projet</h1>
          </div>
          <div className="flex items-center gap-3">
            <div className="rounded-full border border-cyan-400/30 bg-cyan-500/10 px-3 py-1 text-sm text-cyan-200">
              Sprint actuel
            </div>
            <button className="rounded-full bg-cyan-400 px-4 py-2 text-sm font-medium text-slate-950 transition hover:bg-cyan-300">
              + Nouvelle tâche
            </button>
          </div>
        </header>

        <section className="mb-8 grid gap-4 md:grid-cols-4">
          {[
            { label: "Progression", value: `${completion}%`, accent: "text-cyan-300" },
            { label: "Tâches actives", value: String(summary.inProgress + summary.review), accent: "text-violet-300" },
            { label: "Membres", value: "6", accent: "text-emerald-300" },
            { label: "Retards", value: "2", accent: "text-amber-300" },
          ].map((stat) => (
            <article key={stat.label} className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
              <p className="text-sm text-slate-400">{stat.label}</p>
              <p className={`mt-3 text-3xl font-semibold ${stat.accent}`}>{stat.value}</p>
            </article>
          ))}
        </section>

        <section className="grid gap-8 lg:grid-cols-[1.5fr_0.8fr]">
          <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Suivi des tâches</p>
                <h2 className="text-xl font-semibold text-white">Backlog produit</h2>
              </div>
              <span className="rounded-full bg-emerald-500/15 px-2.5 py-1 text-xs font-medium text-emerald-300">
                {completion}% terminé
              </span>
            </div>

            <div className="mb-6 overflow-hidden rounded-full bg-slate-800">
              <div className="h-2.5 rounded-full bg-gradient-to-r from-cyan-400 via-violet-400 to-emerald-400" style={{ width: `${completion}%` }} />
            </div>

            <div className="mb-6 grid gap-3 sm:grid-cols-4">
              {[
                { label: "À faire", value: statusCounts.todo },
                { label: "En cours", value: statusCounts.in_progress },
                { label: "En relecture", value: statusCounts.review },
                { label: "Terminées", value: statusCounts.done },
              ].map((item) => (
                <div key={item.label} className="rounded-2xl border border-slate-800 bg-slate-950/70 p-3 text-center">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-400">{item.label}</p>
                  <p className="mt-2 text-2xl font-semibold text-white">{item.value}</p>
                </div>
              ))}
            </div>

            <div className="space-y-3">
              {tasks.map((task) => (
                <div key={task.id} className="flex flex-col gap-3 rounded-2xl border border-slate-800 bg-slate-950/60 p-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-medium uppercase tracking-[0.18em] text-slate-400">{task.id}</span>
                      <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${statusClasses[task.status]}`}>
                        {statusLabels[task.status]}
                      </span>
                    </div>
                    <p className="mt-2 text-base font-medium text-white">{task.title}</p>
                  </div>

                  <div className="flex items-center gap-3 md:justify-end">
                    <span className="rounded-full border border-slate-700 px-2.5 py-1 text-xs text-slate-300">
                      {task.priority}
                    </span>
                    <span className="text-sm text-slate-300">{task.assignee}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <aside className="space-y-6">
            <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6">
              <p className="text-sm text-slate-400">Activité récente</p>
              <ul className="mt-4 space-y-4 text-sm text-slate-200">
                {[
                  "Amina a mis à jour le shell de dashboard.",
                  "Noah a validé la politique de sécurité.",
                  "Marie a clôturé la définition du scope MVP.",
                ].map((entry) => (
                  <li key={entry} className="flex gap-3">
                    <span className="mt-1 h-2.5 w-2.5 rounded-full bg-cyan-400" />
                    <span>{entry}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6">
              <p className="text-sm text-slate-400">Points de vigilance</p>
              <div className="mt-4 space-y-3">
                {[
                  { label: "Validation sécurisé", value: "OK" },
                  { label: "RLS Supabase", value: "À configurer" },
                  { label: "Déploiement preview", value: "Planifié" },
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between rounded-2xl bg-slate-950/60 p-3">
                    <span className="text-slate-300">{item.label}</span>
                    <span className={item.value === "OK" ? "text-emerald-300" : "text-amber-300"}>{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </section>
      </div>
    </main>
  );
}
