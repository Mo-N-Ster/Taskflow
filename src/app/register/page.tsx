import Link from "next/link";

import { register } from "@/app/auth/actions";

type RegisterPageProps = {
  searchParams: Promise<{ error?: string }>;
};

export default async function RegisterPage({ searchParams }: RegisterPageProps) {
  const { error } = await searchParams;

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-10 text-slate-50">
      <div className="w-full max-w-lg rounded-3xl border border-slate-800 bg-slate-900/80 p-6 shadow-2xl shadow-slate-950/60">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-cyan-300">TaskFlow</p>
        <h1 className="mt-3 text-3xl font-semibold text-white">Créer un compte</h1>
        <p className="mt-2 text-sm text-slate-400">Lancez votre premier projet en moins de deux minutes.</p>

        {error ? (
          <p role="alert" className="mt-5 rounded-2xl border border-rose-500/30 bg-rose-500/10 p-3 text-sm text-rose-200">
            Impossible de créer le compte. Vérifiez les informations saisies.
          </p>
        ) : null}

        <form action={register} className="mt-6 grid gap-4 sm:grid-cols-2">
          <label className="block sm:col-span-1">
            <span className="mb-2 block text-sm text-slate-300">Prénom</span>
            <input
              type="text"
              name="firstName"
              autoComplete="given-name"
              required
              className="w-full rounded-2xl border border-slate-700 bg-slate-950/70 px-3 py-2.5 text-slate-100 outline-none transition focus:border-cyan-400"
            />
          </label>
          <label className="block sm:col-span-1">
            <span className="mb-2 block text-sm text-slate-300">Nom</span>
            <input
              type="text"
              name="lastName"
              autoComplete="family-name"
              required
              className="w-full rounded-2xl border border-slate-700 bg-slate-950/70 px-3 py-2.5 text-slate-100 outline-none transition focus:border-cyan-400"
            />
          </label>

          <label className="block sm:col-span-2">
            <span className="mb-2 block text-sm text-slate-300">Email professionnel</span>
            <input
              type="email"
              name="email"
              autoComplete="email"
              required
              className="w-full rounded-2xl border border-slate-700 bg-slate-950/70 px-3 py-2.5 text-slate-100 outline-none transition focus:border-cyan-400"
            />
          </label>

          <label className="block sm:col-span-1">
            <span className="mb-2 block text-sm text-slate-300">Mot de passe</span>
            <input
              type="password"
              name="password"
              autoComplete="new-password"
              minLength={8}
              required
              className="w-full rounded-2xl border border-slate-700 bg-slate-950/70 px-3 py-2.5 text-slate-100 outline-none transition focus:border-cyan-400"
            />
          </label>

          <label className="block sm:col-span-1">
            <span className="mb-2 block text-sm text-slate-300">Confirmer</span>
            <input
              type="password"
              name="passwordConfirmation"
              autoComplete="new-password"
              minLength={8}
              required
              className="w-full rounded-2xl border border-slate-700 bg-slate-950/70 px-3 py-2.5 text-slate-100 outline-none transition focus:border-cyan-400"
            />
          </label>

          <button
            type="submit"
            className="sm:col-span-2 w-full rounded-2xl bg-cyan-400 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300"
          >
            Créer mon compte
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-slate-400">
          Vous avez déjà un compte ?{" "}
          <Link href="/login" className="font-medium text-cyan-300 hover:text-cyan-200">
            Me connecter
          </Link>
        </p>
      </div>
    </main>
  );
}
