import Link from "next/link";

import { acceptInvitation, declineInvitationByToken } from "@/app/projects/collaboration-actions";
import { PendingSubmitButton } from "@/components/pending-submit-button";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type AcceptInvitationPageProps = { searchParams: Promise<{ token?: string; error?: string }> };

export default async function AcceptInvitationPage({ searchParams }: AcceptInvitationPageProps) {
  const { token = "", error } = await searchParams;
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  return (
    <main className="min-h-screen bg-slate-950 px-4 py-10 text-slate-50">
      <section className="mx-auto max-w-xl rounded-3xl border border-slate-800 bg-slate-900 p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-cyan-300">TaskFlow</p>
        <h1 className="mt-2 text-3xl font-semibold">Invitation à un projet</h1>
        <p className="mt-3 text-sm text-slate-400">Connectez-vous avec l’adresse invitée, puis acceptez cette invitation.</p>
        {user?.email ? <p className="mt-3 rounded-xl bg-slate-950/70 p-3 text-sm text-slate-300">Compte actuellement connecté : <strong className="text-white">{user.email}</strong></p> : null}
        {error === "INVITATION_EMAIL_MISMATCH" ? <p role="alert" className="mt-5 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-100">Cette adresse ne correspond pas au destinataire de l’invitation. Déconnectez-vous, puis reconnectez-vous avec l’adresse qui a reçu l’e-mail.</p> : null}
        {error && error !== "INVITATION_EMAIL_MISMATCH" ? <p role="alert" className="mt-5 rounded-2xl border border-rose-500/30 bg-rose-500/10 p-3 text-sm text-rose-200">L’invitation est expirée, refusée ou n’est plus active.</p> : null}
        {token ? (
          <>
            <form action={acceptInvitation} className="mt-6">
              <input type="hidden" name="token" value={token} />
              <PendingSubmitButton pendingLabel="Acceptation en cours…" className="w-full rounded-2xl bg-cyan-400 px-4 py-3 font-semibold text-slate-950 hover:bg-cyan-300 disabled:cursor-wait disabled:opacity-60">Accepter l’invitation</PendingSubmitButton>
            </form>
            <form action={declineInvitationByToken} className="mt-3">
              <input type="hidden" name="token" value={token} />
              <PendingSubmitButton pendingLabel="Refus en cours…" className="w-full rounded-2xl border border-slate-600 px-4 py-3 font-semibold text-slate-200 hover:border-slate-400 disabled:cursor-wait disabled:opacity-60">Refuser l’invitation</PendingSubmitButton>
            </form>
          </>
        ) : <p className="mt-5 text-sm text-rose-200">Le lien d’invitation est incomplet.</p>}
        <Link href="/login" className="mt-5 inline-block text-sm text-cyan-300">Se connecter</Link>
      </section>
    </main>
  );
}
