"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return <html lang="fr"><body><main><h1>Une erreur est survenue</h1><p>Réessayez. Si le problème persiste, contactez le support.</p><button type="button" onClick={reset}>Réessayer</button></main></body></html>;
}
