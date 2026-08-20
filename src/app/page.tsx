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

const projects = [
  { name: "TaskFlow MVP", role: "Owner", active: true },
  { name: "Campus Sprint", role: "Chef de projet", active: false },
  { name: "Ops QA", role: "Observateur", active: false },
];

const boardColumns: TaskStatus[] = ["todo", "in_progress", "review", "done"];

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
        <header className="mb-6 flex flex-col gap-4 rounded-3xl border border-slate-800 bg-slate-900/80 p-5 shadow-2xl shadow-slate-950/60 backdrop-blur-sm lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-cyan-300">TaskFlow</p>
            <h1 className="mt-2 text-3xl font-semibold text-white">Tableau de pilotage</h1>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="rounded-full border border-slate-700 bg-slate-950/70 px-3 py-1.5 text-sm text-slate-200">
              Sprint R-18
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

        <section className="grid gap-6 xl:grid-cols-[260px_minmax(0,1fr)_300px]">
          <aside className="rounded-3xl border border-slate-800 bg-slate-900 p-4">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm uppercase tracking-[0.18em] text-slate-400">Projets</h2>
              <button className="text-xs text-cyan-300">+ Nouveau</button>
            </div>

            <div className="space-y-3">
              {projects.map((project) => (
                <button
                  key={project.name}
                  className={`w-full rounded-2xl border p-3 text-left transition ${
                    project.active
                      ? "border-cyan-400/40 bg-cyan-500/10"
                      : "border-slate-800 bg-slate-950/60 hover:border-slate-700"
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-medium text-white">{project.name}</p>
                    {project.active ? (
                      <span className="rounded-full bg-cyan-500/15 px-2 py-0.5 text-[10px] uppercase tracking-[0.18em] text-cyan-200">
                        actif
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-2 text-xs text-slate-400">Rôle : {project.role}</p>
                </button>
              ))}
            </div>
          </aside>

          <div className="rounded-3xl border border-slate-800 bg-slate-900 p-5">
            <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm text-slate-400">Backlog produit</p>
                <h2 className="text-xl font-semibold text-white">TaskFlow MVP</h2>
              </div>

              <div className="flex items-center gap-3">
                <span className="rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-300">
                  {completion}% terminé
                </span>
                <button className="rounded-full border border-slate-700 px-3 py-1.5 text-sm text-slate-200">
                  Filtrer
                </button>
              </div>
            </div>

            <div className="mb-6 overflow-hidden rounded-full bg-slate-800">
              <div className="h-2.5 rounded-full bg-gradient-to-r from-cyan-400 via-violet-400 to-emerald-400" style={{ width: `${completion}%` }} />
            </div>

            <div className="grid gap-4 xl:grid-cols-4">
              {boardColumns.map((column) => {
                const columnTasks = tasks.filter((task) => task.status === column);

                return (
                  <div key={column} className="rounded-2xl border border-slate-800 bg-slate-950/60 p-3">
                    <div className="mb-3 flex items-center justify-between">
                      <h3 className="text-sm font-medium text-slate-200">{statusLabels[column]}</h3>
                      <span className="rounded-full bg-slate-800 px-2 py-0.5 text-xs text-slate-300">
                        {columnTasks.length}
                      </span>
                    </div>

                    <div className="space-y-3">
                      {columnTasks.length === 0 ? (
                        <div className="rounded-xl border border-dashed border-slate-700 p-3 text-xs text-slate-500">
                          Aucune tâche
                        </div>
                      ) : (
                        columnTasks.map((task) => (
                          <article key={task.id} className="rounded-xl border border-slate-800 bg-slate-900 p-3">
                            <div className="flex items-start justify-between gap-3">
                              <span className="text-[10px] uppercase tracking-[0.18em] text-slate-400">{task.id}</span>
                              <span className={`inline-flex rounded-full px-2 py-1 text-[10px] font-medium ${statusClasses[task.status]}`}>
                                {statusLabels[task.status]}
                              </span>
                            </div>
                            <p className="mt-2 text-sm font-medium text-white">{task.title}</p>
                            <div className="mt-3 flex items-center justify-between text-xs text-slate-400">
                              <span>{task.assignee}</span>
                              <span>{task.priority}</span>
                            </div>
                          </article>
                        ))
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <aside className="space-y-6">
            <div className="rounded-3xl border border-slate-800 bg-slate-900 p-5">
              <p className="text-sm text-slate-400">Vue d’ensemble</p>
              <div className="mt-4 space-y-3">
                {[
                  { label: "À faire", value: statusCounts.todo },
                  { label: "En cours", value: statusCounts.in_progress },
                  { label: "Validation", value: statusCounts.review },
                  { label: "Terminé", value: statusCounts.done },
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between rounded-2xl bg-slate-950/70 p-3">
                    <span className="text-slate-300">{item.label}</span>
                    <span className="font-medium text-white">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-3xl border border-slate-800 bg-slate-900 p-5">
              <p className="text-sm text-slate-400">Activité récente</p>
              <ul className="mt-4 space-y-4 text-sm text-slate-200">
                {[
                  "Amina a commencé la préparation du dashboard.",
                  "Noah a validé la politique de sécurité.",
                  "Marie a clos le périmètre MVP.",
                ].map((entry) => (
                  <li key={entry} className="flex gap-3">
                    <span className="mt-1.5 h-2.5 w-2.5 rounded-full bg-cyan-400" />
                    <span>{entry}</span>
                  </li>
                ))}
              </ul>
            </div>
          </aside>
        </section>
      </div>
    </main>
  );
}
