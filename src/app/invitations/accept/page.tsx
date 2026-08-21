import Link from "next/link";

import { acceptInvitation } from "@/app/projects/collaboration-actions";

type AcceptInvitationPageProps = { searchParams: Promise<{ token?: string; error?: string }> };

export default async function AcceptInvitationPage({ searchParams }: AcceptInvitationPageProps) {
  const { token = "", error } = await searchParams;
  return (
    <main className="min-h-screen bg-slate-950 px-4 py-10 text-slate-50">
      <section className="mx-auto max-w-xl rounded-3xl border border-slate-800 bg-slate-900 p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-cyan-300">TaskFlow</p>
        <h1 className="mt-2 text-3xl font-semibold">Invitation à un projet</h1>
        <p className="mt-3 text-sm text-slate-400">Connectez-vous avec l’adresse invitée, puis acceptez cette invitation à usage unique.</p>
        {error ? <p role="alert" className="mt-5 rounded-2xl border border-rose-500/30 bg-rose-500/10 p-3 text-sm text-rose-200">L’invitation est invalide, expirée, déjà utilisée ou ne correspond pas à votre compte.</p> : null}
        {token ? (
          <form action={acceptInvitation} className="mt-6">
            <input type="hidden" name="token" value={token} />
            <button className="w-full rounded-2xl bg-cyan-400 px-4 py-3 font-semibold text-slate-950 hover:bg-cyan-300">Accepter l’invitation</button>
          </form>
        ) : <p className="mt-5 text-sm text-rose-200">Le lien d’invitation est incomplet.</p>}
        <Link href="/login" className="mt-5 inline-block text-sm text-cyan-300">Se connecter</Link>
      </section>
    </main>
  );
}
