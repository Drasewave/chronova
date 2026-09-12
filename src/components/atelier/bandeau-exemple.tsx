import { Pill } from "@/components/ui/pill";

/**
 * Rappel que des données de démonstration sont encore en base.
 *
 * Tout ce qui porte `isSample` a été inséré par le script d'amorçage : aucun de
 * ces chiffres n'est réel. Le bandeau disparaît de lui-même dès qu'il n'en
 * reste plus, sans intervention.
 */
export function BandeauExemple({ nombre, quoi }: { nombre: number; quoi: string }) {
  if (nombre === 0) return null;

  return (
    <p className="type-caption mb-6 flex flex-wrap items-center gap-x-3 gap-y-2 border border-alert px-4 py-3 text-fg-soft">
      <Pill ton="alerte">Exemple</Pill>
      <span>
        {nombre} {quoi} {nombre > 1 ? "proviennent" : "provient"} des données de démonstration :
        chiffres fictifs, à supprimer avant l&apos;ouverture.
      </span>
    </p>
  );
}
