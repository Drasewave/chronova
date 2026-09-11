/**
 * Grain papier : une seule instance pour tout le document, en overlay fixe.
 * Bruit SVG encodé en data-URI — aucune requête réseau, aucun blocage du rendu.
 */
const NOISE =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='180'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='180' height='180' filter='url(%23n)'/%3E%3C/svg%3E";

export function Grain() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-50 opacity-[0.035] mix-blend-multiply"
      style={{ backgroundImage: `url("${NOISE}")`, backgroundSize: "180px 180px" }}
    />
  );
}
