/** Squelette de chargement : réserve la hauteur de la page pour ne pas décaler la mise en page. */
export default function Chargement() {
  return (
    <div role="status" aria-live="polite" className="min-h-[60dvh]">
      <span className="sr-only">Chargement…</span>
      <div className="h-8 w-1/3 rounded-sm bg-bg-alt motion-safe:animate-pulse" />
      <div className="mt-6 h-[40dvh] w-full rounded-sm bg-bg-alt motion-safe:animate-pulse" />
    </div>
  );
}
