"use client";

import { EcranErreur } from "@/components/ui/ecran-erreur";

export default function ErreurSite({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  return <EcranErreur error={error} retry={retry} />;
}
