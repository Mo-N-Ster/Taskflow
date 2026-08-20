import Link from "next/link";

import { login } from "@/app/auth/actions";

type LoginPageProps = {
  searchParams: Promise<{ error?: string; status?: string }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { error, status } = await searchParams;

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-10 text-slate-50">
      <div className="w-full max-w-md rounded-3xl border border-slate-800 bg-slate-900/80 p-6 shadow-2xl shadow-slate-950/60">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-cyan-300">TaskFlow</p>
        <h1 className="mt-3 text-3xl font-semibold text-white">Connexion</h1>
        <p className="mt-2 text-sm text-slate-400">Accédez à vos projets et à votre activité autorisée.</p>

        {status === "SIGNED_OUT" ? (
          <p role="status" className="mt-5 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-200">
            Vous êtes maintenant déconnecté.
          </p>
        ) : null}

        {error ? (
          <p role="alert" className="mt-5 rounded-2xl border border-rose-500/30 bg-rose-500/10 p-3 text-sm text-rose-200">
            Email ou mot de passe incorrect.
          </p>
        ) : null}

        <form action={login} className="mt-6 space-y-4">
          <label className="block">
            <span className="mb-2 block text-sm text-slate-300">Email</span>
            <input
              type="email"
              name="email"
              autoComplete="email"
              required
              className="w-full rounded-2xl border border-slate-700 bg-slate-950/70 px-3 py-2.5 text-slate-100 outline-none ring-0 transition focus:border-cyan-400"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm text-slate-300">Mot de passe</span>
            <input
              type="password"
              name="password"
              autoComplete="current-password"
              required
              className="w-full rounded-2xl border border-slate-700 bg-slate-950/70 px-3 py-2.5 text-slate-100 outline-none ring-0 transition focus:border-cyan-400"
            />
          </label>

          <button
            type="submit"
            className="w-full rounded-2xl bg-cyan-400 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300"
          >
            Se connecter
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-slate-400">
          Pas encore de compte ?{" "}
          <Link href="/register" className="font-medium text-cyan-300 hover:text-cyan-200">
            Créer un compte
          </Link>
        </p>
        <p className="mt-3 text-center text-sm">
          <Link href="/" className="text-slate-400 transition hover:text-white">
            Retour à l’accueil
          </Link>
        </p>
      </div>
    </main>
  );
}
