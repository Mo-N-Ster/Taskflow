import Link from "next/link";

type ConfirmEmailPageProps = {
  searchParams: Promise<{ email?: string }>;
};

export default async function ConfirmEmailPage({ searchParams }: ConfirmEmailPageProps) {
  const { email } = await searchParams;

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-10 text-slate-50">
      <section className="w-full max-w-md rounded-3xl border border-slate-800 bg-slate-900/80 p-6 text-center shadow-2xl shadow-slate-950/60">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-cyan-300">TaskFlow</p>
        <div className="mx-auto mt-8 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/15 text-2xl text-emerald-300">✓</div>
        <h1 className="mt-5 text-2xl font-semibold text-white">Vérifiez votre email</h1>
        <p className="mt-3 text-sm leading-6 text-slate-400">
          Un lien de confirmation vient d’être envoyé. Il vous permettra d’activer votre session et d’accéder à votre dashboard.
        </p>
        {email ? <p className="mt-2 text-sm text-slate-300">Adresse : {email}</p> : null}
        <div className="mt-6 flex flex-col gap-3">
          <Link href="/login" className="rounded-2xl bg-cyan-400 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300">
            Retour à la connexion
          </Link>
        </div>
      </section>
    </main>
  );
}
