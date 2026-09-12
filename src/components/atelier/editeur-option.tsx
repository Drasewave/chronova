"use client";

import { useState } from "react";
import { enregistrerOption } from "@/app/actions/atelier-catalogue";
import { Bouton, Champ, Liste, Saisie, Zone } from "@/components/atelier/formulaire";
import { WatchSvg } from "@/watch/watch-svg";
import type { WatchRender } from "@/watch/types";

export interface OptionEditable {
  id: string;
  key: string;
  label: string;
  description: string | null;
  colorName: string | null;
  colorHex: string | null;
  priceDeltaCents: number;
  leadDaysDelta: number | null;
  partId: string | null;
  isActive: boolean;
  /** Les clés du correctif de rendu qui portent une couleur, s'il y en a. */
  clesCouleur: string[];
}

/**
 * Édition d'une option, avec aperçu.
 *
 * La couleur saisie est appliquée à la montre avant d'être enregistrée : on
 * voit la teinte sur le cadran, pas seulement dans une pastille. C'est le seul
 * moyen de juger une couleur — un hexadécimal ne dit rien de ce que donne un
 * soleillé sous un saphir bombé.
 */
export function EditeurOption({
  option,
  pieces,
  apercu,
}: {
  option: OptionEditable;
  pieces: { id: string; reference: string; name: string }[];
  /** Rendu de base sur lequel appliquer la couleur essayée. */
  apercu?: WatchRender;
}) {
  const [hex, setHex] = useState(option.colorHex ?? "");
  const valide = /^#[0-9a-fA-F]{6}$/.test(hex);

  const rendu: WatchRender | undefined =
    apercu && valide && option.clesCouleur.length > 0
      ? { ...apercu, ...Object.fromEntries(option.clesCouleur.map((cle) => [cle, hex])) }
      : apercu;

  return (
    <form action={enregistrerOption} className="flex flex-col gap-4">
      <input type="hidden" name="option" value={option.id} />

      <div className="flex flex-wrap gap-4">
        <Champ label="Intitulé" className="min-w-[14rem] flex-1">
          <Saisie name="label" defaultValue={option.label} />
        </Champ>
        <Champ label="Supplément (€)" className="w-36">
          <Saisie
            name="supplement"
            type="number"
            step="0.01"
            defaultValue={(option.priceDeltaCents / 100).toFixed(2)}
          />
        </Champ>
        <Champ label="Délai (+ j)" aide="Vide si sans effet." className="w-32">
          <Saisie name="delai" type="number" step="1" defaultValue={option.leadDaysDelta ?? ""} />
        </Champ>
      </div>

      <Champ label="Description" aide="Une phrase, affichée sous l'option.">
        <Zone name="description" rows={2} defaultValue={option.description ?? ""} />
      </Champ>

      {(option.colorHex !== null || option.clesCouleur.length > 0) && (
        <div className="flex flex-wrap items-start gap-4">
          <Champ label="Nom de la teinte" aide="Toujours affiché : la couleur seule ne suffit pas." className="min-w-[12rem] flex-1">
            <Saisie name="nomTeinte" defaultValue={option.colorName ?? ""} />
          </Champ>
          {/* Deux champs, deux étiquettes : un <label> qui envelopperait le
              nuancier et la saisie ne nommerait que le premier des deux. */}
          <div className="w-48">
            <label htmlFor={`hex-${option.id}`} className="type-caption text-fg-soft">
              Couleur
            </label>
            <span className="mt-1 flex items-center gap-2">
              <input
                type="color"
                value={valide ? hex : "#888888"}
                onChange={(evenement) => setHex(evenement.target.value)}
                aria-label="Nuancier"
                className="h-11 w-11 shrink-0 cursor-pointer rounded-field border border-rule bg-bg p-1"
              />
              <Saisie
                id={`hex-${option.id}`}
                name="hex"
                value={hex}
                onChange={(evenement) => setHex(evenement.target.value)}
                placeholder="#000000"
                spellCheck={false}
                className="type-mono"
              />
            </span>
          </div>
        </div>
      )}

      <Champ label="Pièce de stock" aide="Une rupture rend l'option non sélectionnable sur le site.">
        <Liste name="piece" defaultValue={option.partId ?? ""}>
          <option value="">Aucune pièce liée</option>
          {pieces.map((piece) => (
            <option key={piece.id} value={piece.id}>
              {piece.reference} · {piece.name}
            </option>
          ))}
        </Liste>
      </Champ>

      <label className="flex items-center gap-3">
        <input
          type="checkbox"
          name="actif"
          defaultChecked={option.isActive}
          className="size-5 accent-[var(--accent)]"
        />
        <span className="type-ui text-fg">Proposée dans le configurateur</span>
      </label>

      {rendu && (
        <div>
          <p className="type-caption mb-2 text-fg-soft">
            Aperçu {valide && option.clesCouleur.length > 0 ? "avec la teinte essayée" : "du modèle"}{" "}
            — non enregistré tant que le bouton n&apos;est pas cliqué.
          </p>
          <div className="max-w-64 border border-rule bg-bg-alt p-3">
            <WatchSvg
              id={`apercu-${option.id}`}
              render={rendu}
              label="Aperçu de l'option"
              className="h-auto w-full"
            />
          </div>
        </div>
      )}

      <Bouton>Enregistrer l&apos;option</Bouton>
    </form>
  );
}
