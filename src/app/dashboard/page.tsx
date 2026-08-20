import Link from "next/link";

const projects = [
  { name: "TaskFlow MVP", visibility: "Privé", progress: 72, owner: "Alex" },
  { name: "Campus Sprint", visibility: "Public", progress: 58, owner: "Mila" },
  { name: "Ops QA", visibility: "Privé", progress: 34, owner: "Noah" },
];

const recentActivity = [
  "Amina a commencé la préparation du dashboard.",
  "Marie a validé le périmètre du sprint.",
  "Noah a ajouté une revue de sécurité.",
];

export default function DashboardPage() {
  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-slate-50">
      <div className="mx-auto max-w-6xl">
        <header className="mb-6 flex flex-col gap-4 rounded-3xl border border-slate-800 bg-slate-900/80 p-5 backdrop-blur-sm md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-cyan-300">TaskFlow</p>
            <h1 className="mt-2 text-3xl font-semibold text-white">Dashboard</h1>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link href="/projects/new" className="rounded-full bg-cyan-400 px-4 py-2 text-sm font-medium text-slate-950 transition hover:bg-cyan-300">
              + Nouveau projet
            </Link>
          </div>
        </header>

        <section className="grid gap-4 md:grid-cols-3">
          {[
            { label: "Projets actifs", value: "3" },
            { label: "Tâches en cours", value: "12" },
            { label: "Progression moyenne", value: "68%" },
          ].map((stat) => (
            <article key={stat.label} className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
              <p className="text-sm text-slate-400">{stat.label}</p>
              <p className="mt-3 text-3xl font-semibold text-cyan-300">{stat.value}</p>
            </article>
          ))}
        </section>

        <section className="mt-8 grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
          <div className="rounded-3xl border border-slate-800 bg-slate-900 p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">Mes projets</h2>
              <span className="text-sm text-slate-400">Dernière mise à jour</span>
            </div>

            <div className="space-y-4">
              {projects.map((project) => (
                <div key={project.name} className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-lg font-medium text-white">{project.name}</p>
                      <p className="text-xs uppercase tracking-[0.18em] text-slate-400">{project.visibility} • {project.owner}</p>
                    </div>
                    <span className="rounded-full bg-cyan-500/10 px-2 py-0.5 text-xs font-medium text-cyan-200">
                      {project.progress}%
                    </span>
                  </div>

                  <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-800">
                    <div className="h-full rounded-full bg-gradient-to-r from-cyan-400 via-violet-400 to-emerald-400" style={{ width: `${project.progress}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <aside className="rounded-3xl border border-slate-800 bg-slate-900 p-5">
            <p className="text-sm text-slate-400">Activité récente</p>
            <ul className="mt-4 space-y-4 text-sm text-slate-200">
              {recentActivity.map((entry) => (
                <li key={entry} className="flex gap-3">
                  <span className="mt-1.5 h-2.5 w-2.5 rounded-full bg-cyan-400" />
                  <span>{entry}</span>
                </li>
              ))}
            </ul>
          </aside>
        </section>
      </div>
    </main>
  );
}
