"use client";

import { EcranErreur } from "@/components/ui/ecran-erreur";
import "./globals.css";

/** Dernier recours : remplace le gabarit racine, d'où `<html>` et `<body>`. */
export default function ErreurGlobale({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  return (
    <html lang="fr">
      <body>
        <EcranErreur error={error} retry={retry} />
      </body>
    </html>
  );
}
