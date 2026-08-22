import "server-only";

type InvitationEmailInput = {
  to: string;
  projectName: string;
  invitationUrl: string;
  role: string;
};

type EmailEnvironment = {
  [key: string]: string | undefined;
  RESEND_API_KEY?: string;
  RESEND_FROM_EMAIL?: string;
};

function escapeHtml(value: string) {
  return value.replace(/[&<>'"]/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;",
  })[character] ?? character);
}

export async function sendInvitationEmail(input: InvitationEmailInput, environment: EmailEnvironment = process.env) {
  const apiKey = environment.RESEND_API_KEY?.trim();
  const from = environment.RESEND_FROM_EMAIL?.trim();
  if (!apiKey || !from) return { sent: false as const, reason: "NOT_CONFIGURED" as const };

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      signal: AbortSignal.timeout(8_000),
      body: JSON.stringify({
        from,
        to: [input.to],
        subject: `Invitation à rejoindre ${input.projectName} sur TaskFlow`,
        html: `<h1>Vous êtes invité sur TaskFlow</h1><p>Rejoignez le projet <strong>${escapeHtml(input.projectName)}</strong> avec le rôle <strong>${escapeHtml(input.role)}</strong>.</p><p><a href="${escapeHtml(input.invitationUrl)}">Accepter ou refuser l’invitation</a></p><p>Ce lien expire dans 7 jours et remplace tout lien précédent.</p>`,
      }),
    });
    return response.ok
      ? { sent: true as const }
      : { sent: false as const, reason: "PROVIDER_REJECTED" as const, status: response.status };
  } catch {
    return { sent: false as const, reason: "PROVIDER_UNAVAILABLE" as const };
  }
}
