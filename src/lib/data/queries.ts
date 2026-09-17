import "server-only";
import { cache } from "react";
import { prisma } from "@/lib/db";
import { createCatalogue, type Catalogue } from "@/lib/configurateur/catalogue";
import type {
  CatalogueOption,
  CompatibilityRule,
  OptionGroup,
  Part,
  PartCategory,
  SelectionType,
  Step,
} from "@/lib/configurateur/types";
import type { WatchModelView } from "./models";
import { STYLE_LABELS, type WatchStyleKey } from "./types";
import type { Selections } from "@/lib/configurateur/types";
import type { WatchRender } from "@/watch/types";

/**
 * Lecture du catalogue depuis la base.
 *
 * Produit exactement la même structure que la fixture `SAMPLE_CATALOGUE`, ce qui
 * permet aux tests de rester hors-ligne pendant que les pages, elles, lisent ce
 * que l'horloger a saisi dans le CRM.
 *
 * `cache()` déduplique l'appel à l'intérieur d'un même rendu. Les pages qui en
 * dépendent déclarent `revalidate` : les modifications du catalogue apparaissent
 * dans la minute, et le CRM (phase 5) forcera la revalidation à l'enregistrement.
 */
export const getCatalogue = cache(async (): Promise<Catalogue> => {
  const [etapes, regles, pieces] = await Promise.all([
    prisma.configStep.findMany({
      orderBy: { sortIndex: "asc" },
      include: {
        groups: {
          orderBy: { sortIndex: "asc" },
          include: {
            options: {
              where: { isActive: true },
              orderBy: { sortIndex: "asc" },
              include: { part: { select: { reference: true } } },
            },
          },
        },
      },
    }),
    prisma.compatibilityRule.findMany({
      where: { isActive: true },
      include: { subject: { include: { group: { select: { key: true } } } } },
    }),
    prisma.part.findMany({
      orderBy: { reference: "asc" },
      include: { supplier: { select: { name: true } } },
    }),
  ]);

  const steps: Step[] = etapes.map((etape) => ({
    key: etape.key,
    label: etape.label,
    intro: etape.intro,
    groups: etape.groups.map(
      (groupe): OptionGroup => ({
        key: groupe.key,
        label: groupe.label,
        help: groupe.help ?? undefined,
        selection: SELECTION_VERS_APP[groupe.selection] ?? "unique",
        optional: groupe.isOptional,
        maxLength: groupe.maxLength ?? undefined,
        filledPriceCents: groupe.filledPriceCents ?? undefined,
        filledLeadDays: groupe.filledLeadDays ?? undefined,
        options: groupe.options.map(
          (option): CatalogueOption => ({
            key: option.key,
            label: option.label,
            description: option.description ?? undefined,
            colorName: option.colorName ?? undefined,
            colorHex: option.colorHex ?? undefined,
            priceDeltaCents: option.priceDeltaCents,
            leadDaysDelta: option.leadDaysDelta ?? undefined,
            partRef: option.part?.reference ?? undefined,
            render: (option.renderPatch as Partial<WatchRender> | null) ?? undefined,
          }),
        ),
      }),
    ),
  }));

  const rules: CompatibilityRule[] = regles.map((regle) => ({
    subject: `${regle.subject.group.key}:${regle.subject.key}`,
    kind: regle.kind === "EXIGE_UNE_DE" ? "exige-une-de" : "exclut",
    targets: regle.targetRefs,
    message: regle.message,
  }));

  const parts: Part[] = pieces.map((piece) => ({
    ref: piece.reference,
    name: piece.name,
    category: CATEGORIE_VERS_APP[piece.category] ?? "divers",
    supplier: piece.supplier?.name ?? "",
    purchasePriceCents: piece.purchasePriceCents,
    quantityOnHand: piece.quantityOnHand,
    quantityReserved: piece.quantityReserved,
    reorderThreshold: piece.reorderThreshold,
    restockDays: piece.restockDays,
  }));

  return createCatalogue({ steps, rules, parts });
});

export const getModels = cache(async (): Promise<WatchModelView[]> => {
  const modeles = await prisma.watchModel.findMany({
    where: { isPublished: true },
    orderBy: { sortIndex: "asc" },
  });
  return modeles.map(versVue);
});

export const getModel = cache(async (slug: string): Promise<WatchModelView | null> => {
  const modele = await prisma.watchModel.findUnique({ where: { slug } });
  return modele && modele.isPublished ? versVue(modele) : null;
});

type ModeleEnBase = Awaited<ReturnType<typeof prisma.watchModel.findFirstOrThrow>>;

function versVue(modele: ModeleEnBase): WatchModelView {
  const style = modele.style.toLowerCase() as WatchStyleKey;
  return {
    slug: modele.slug,
    name: modele.name,
    style,
    styleLabel: STYLE_LABELS[style],
    tagline: modele.tagline,
    summary: modele.summary,
    diameterMm: modele.diameterMm,
    availableSizes: modele.availableSizes,
    lugToLugMm: modele.lugToLugMm,
    thicknessMm: modele.thicknessMm,
    lugWidthMm: modele.lugWidthMm,
    waterResistM: modele.waterResistM,
    movementNote: modele.movementNote,
    basePriceCents: modele.basePriceCents,
    assemblyDays: modele.assemblyDays,
    isSample: modele.isSample,
    defaultSelections: modele.defaultSelections as Selections,
    altSelections: modele.altSelections as Selections,
  };
}

const SELECTION_VERS_APP: Record<string, SelectionType> = {
  UNIQUE: "unique",
  TEXTE: "texte",
  MESURE: "mesure",
};

const CATEGORIE_VERS_APP: Record<string, PartCategory> = {
  BOITIER: "boitier",
  CADRAN: "cadran",
  AIGUILLES: "aiguilles",
  LUNETTE: "lunette",
  INSERT: "insert",
  COURONNE: "couronne",
  BRACELET: "bracelet",
  VERRE: "verre",
  MOUVEMENT: "mouvement",
  FOND: "fond",
  DIVERS: "divers",
};
