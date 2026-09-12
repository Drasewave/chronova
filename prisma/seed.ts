/**
 * Données d'exemple.
 *
 * Tout ce que ce fichier insère est FICTIF et porte `isSample: true` : le site
 * l'affiche avec une pastille « Exemple », et le CRM permettra de tout modifier
 * ou supprimer sans toucher au code.
 *
 * Le catalogue n'est pas réinventé ici : il est repris tel quel des fixtures
 * TypeScript qui ont servi aux phases 2 et 3, ce qui garantit que la base et le
 * configurateur décrivent exactement la même chose.
 *
 * Idempotent : relancer le seed met à jour plutôt que de dupliquer.
 */
// `tsx` ne charge pas les fichiers .env : on le fait explicitement.
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";
import { PARTS, RULES, SAMPLE_CATALOGUE, STEPS } from "@/lib/data/catalogue";
import { SAMPLE_MODELS } from "@/lib/data/models";
import { FAQ } from "@/lib/content/home";
import { buildConfiguration } from "@/lib/configurateur/configuration";
import { recomposerStock } from "@/lib/atelier/stock";
import { getSampleModel } from "@/lib/data/models";
import type { Selections } from "@/lib/configurateur/types";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL manquante.");
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

const JOUR = 24 * 60 * 60 * 1000;
const ilYA = (jours: number) => new Date(Date.now() - jours * JOUR);
const dans = (jours: number) => new Date(Date.now() + jours * JOUR);

const CATEGORIES = {
  boitier: "BOITIER",
  cadran: "CADRAN",
  aiguilles: "AIGUILLES",
  lunette: "LUNETTE",
  insert: "INSERT",
  couronne: "COURONNE",
  bracelet: "BRACELET",
  verre: "VERRE",
  mouvement: "MOUVEMENT",
  fond: "FOND",
} as const;

const SELECTION = { unique: "UNIQUE", texte: "TEXTE", mesure: "MESURE" } as const;
const STYLES = { plongee: "PLONGEE", terrain: "TERRAIN", gmt: "GMT", habillee: "HABILLEE" } as const;

/** Étapes d'assemblage : la même liste pour toutes les commandes. */
const CHECKLIST = [
  "Contrôle des pièces à réception",
  "Pose du cadran et des index",
  "Chassage des aiguilles",
  "Emboîtage du mouvement",
  "Pose du verre et du joint",
  "Vissage du fond",
  "Test d'étanchéité",
  "Marche suivie sur 72 h",
  "Nettoyage et mise en écrin",
];

async function main() {
  console.log("→ Paramètres de l'atelier");
  await parametres();

  console.log("→ Fournisseurs et pièces");
  const pieces = await stock();

  console.log("→ Catalogue : étapes, groupes, options, règles");
  await catalogue(pieces);

  console.log("→ Modèles");
  await modeles();

  console.log("→ Gabarits d'e-mails et questions fréquentes");
  await contenus();

  console.log("→ Clients d'exemple");
  const clients = await clientsExemple();

  console.log("→ Commandes d'exemple");
  await commandes(clients, pieces);

  console.log("→ Demandes et après-vente");
  await demandes(clients);

  console.log("→ Journal de stock");
  await journalStock(pieces);

  console.log("Terminé.");
}

/**
 * Ferme le journal de stock.
 *
 * Les commandes d'exemple ont écrit leurs réservations et leurs sorties
 * d'assemblage ; il manque l'entrée d'inventaire qui les rend possibles. On la
 * calcule à rebours pour que les tiroirs finissent exactement sur la quantité
 * annoncée par la fixture, puis on aligne les deux compteurs de la pièce sur la
 * somme du journal — celui-ci reste la seule vérité, comme en production.
 */
async function journalStock(pieces: Map<string, string>) {
  const debut = ilYA(400);

  for (const piece of PARTS) {
    const partId = pieces.get(piece.ref);
    if (!partId) continue;

    const mouvements = await prisma.stockMovement.findMany({
      where: { partId },
      select: { type: true, quantity: true },
    });
    const sansInventaire = recomposerStock(mouvements);

    // `enRayon` est ici négatif ou nul : il ne contient que les sorties.
    const inventaire = piece.quantityOnHand - sansInventaire.enRayon;
    await prisma.stockMovement.create({
      data: {
        partId,
        type: "ENTREE",
        quantity: inventaire,
        reason: "Inventaire de départ (donnée d'exemple)",
        createdAt: debut,
      },
    });

    const etat = recomposerStock([...mouvements, { type: "ENTREE", quantity: inventaire }]);
    if (etat.enRayon !== piece.quantityOnHand) {
      throw new Error(
        `Journal incohérent pour ${piece.ref} : rayon ${etat.enRayon}, attendu ${piece.quantityOnHand}`,
      );
    }

    await prisma.part.update({
      where: { id: partId },
      data: { quantityOnHand: etat.enRayon, quantityReserved: etat.reserve },
    });
  }
}

async function parametres() {
  const entrees: { key: string; label: string; value: unknown }[] = [
    { key: "atelier.delai_base_jours", label: "Délai d'assemblage de base (jours)", value: 14 },
    { key: "atelier.controle_heures", label: "Durée du contrôle de marche (heures)", value: 72 },
    {
      key: "livraison.frais_cents",
      label: "Frais de port France (centimes)",
      value: { cents: 1500, exemple: true },
    },
    {
      key: "livraison.franco_cents",
      label: "Montant à partir duquel le port est offert (centimes)",
      value: { cents: 100000, exemple: true },
    },
    { key: "garantie.duree_mois", label: "Durée de garantie (mois)", value: { aRemplir: true } },
    {
      key: "legal.identite",
      label: "Identité légale de l'atelier",
      value: { raisonSociale: "", siret: "", tva: "", adresse: "", aRemplir: true },
    },
    { key: "stock.seuil_alerte_defaut", label: "Seuil d'alerte par défaut", value: 3 },
  ];

  for (const entree of entrees) {
    await prisma.setting.upsert({
      where: { key: entree.key },
      update: { label: entree.label, value: entree.value as never },
      create: { key: entree.key, label: entree.label, value: entree.value as never },
    });
  }
}

async function stock() {
  const noms = [...new Set(PARTS.map((piece) => piece.supplier))];
  const fournisseurs = new Map<string, string>();

  for (const nom of noms) {
    const delai = Math.max(...PARTS.filter((p) => p.supplier === nom).map((p) => p.restockDays));
    const cree = await prisma.supplier.upsert({
      where: { name: nom },
      update: { leadTimeDays: delai },
      create: { name: nom, leadTimeDays: delai },
    });
    fournisseurs.set(nom, cree.id);
  }

  const pieces = new Map<string, string>();
  for (const piece of PARTS) {
    const donnees = {
      name: piece.name,
      category: CATEGORIES[piece.category as keyof typeof CATEGORIES],
      supplierId: fournisseurs.get(piece.supplier) ?? null,
      purchasePriceCents: piece.purchasePriceCents,
      quantityOnHand: piece.quantityOnHand,
      // Zéro réservé à la création : les réservations sont écrites par les
      // commandes ci-dessous, comme en production. Les fixer à la main
      // produirait des compteurs qui ne correspondent à aucune commande.
      quantityReserved: 0,
      reorderThreshold: piece.reorderThreshold,
      restockDays: piece.restockDays,
      isSample: true,
    };
    const cree = await prisma.part.upsert({
      where: { reference: piece.ref },
      update: donnees as never,
      create: { reference: piece.ref, ...donnees } as never,
    });
    pieces.set(piece.ref, cree.id);
  }

  return pieces;
}

async function catalogue(pieces: Map<string, string>) {
  const options = new Map<string, string>(); // `groupe:option` → id

  for (const [indexEtape, etape] of STEPS.entries()) {
    const step = await prisma.configStep.upsert({
      where: { key: etape.key },
      update: { label: etape.label, intro: etape.intro, sortIndex: indexEtape },
      create: { key: etape.key, label: etape.label, intro: etape.intro, sortIndex: indexEtape },
    });

    for (const [indexGroupe, groupe] of etape.groups.entries()) {
      const donneesGroupe = {
        stepId: step.id,
        label: groupe.label,
        help: groupe.help ?? null,
        selection: SELECTION[groupe.selection],
        isOptional: groupe.optional ?? false,
        maxLength: groupe.maxLength ?? null,
        filledPriceCents: groupe.filledPriceCents ?? null,
        filledLeadDays: groupe.filledLeadDays ?? null,
        sortIndex: indexGroupe,
      };
      const group = await prisma.optionGroup.upsert({
        where: { key: groupe.key },
        update: donneesGroupe as never,
        create: { key: groupe.key, ...donneesGroupe } as never,
      });

      for (const [indexOption, option] of groupe.options.entries()) {
        const donneesOption = {
          label: option.label,
          description: option.description ?? null,
          colorName: option.colorName ?? null,
          colorHex: option.colorHex ?? null,
          priceDeltaCents: option.priceDeltaCents,
          leadDaysDelta: option.leadDaysDelta ?? null,
          renderPatch: (option.render ?? null) as never,
          partId: option.partRef ? (pieces.get(option.partRef) ?? null) : null,
          sortIndex: indexOption,
          isSample: true,
        };
        const cree = await prisma.option.upsert({
          where: { groupId_key: { groupId: group.id, key: option.key } },
          update: donneesOption as never,
          create: { groupId: group.id, key: option.key, ...donneesOption } as never,
        });
        options.set(`${groupe.key}:${option.key}`, cree.id);
      }
    }
  }

  // Les règles sont recréées à chaque seed : elles n'ont pas de clé naturelle.
  await prisma.compatibilityRule.deleteMany({});
  for (const regle of RULES) {
    const subjectOptionId = options.get(regle.subject);
    if (!subjectOptionId) continue;
    await prisma.compatibilityRule.create({
      data: {
        subjectOptionId,
        kind: regle.kind === "exige-une-de" ? "EXIGE_UNE_DE" : "EXCLUT",
        targetRefs: [...regle.targets],
        message: regle.message,
      },
    });
  }
}

async function modeles() {
  for (const [index, modele] of SAMPLE_MODELS.entries()) {
    const donnees = {
      name: modele.name,
      tagline: modele.tagline,
      summary: modele.summary,
      style: STYLES[modele.style],
      diameterMm: modele.diameterMm,
      availableSizes: modele.availableSizes,
      lugToLugMm: modele.lugToLugMm,
      thicknessMm: modele.thicknessMm,
      lugWidthMm: modele.lugWidthMm,
      waterResistM: modele.waterResistM,
      movementNote: modele.movementNote,
      basePriceCents: modele.basePriceCents,
      assemblyDays: modele.assemblyDays,
      defaultSelections: modele.defaultSelections as never,
      altSelections: modele.altSelections as never,
      isPublished: true,
      sortIndex: index,
      isSample: true,
    };
    await prisma.watchModel.upsert({
      where: { slug: modele.slug },
      update: donnees as never,
      create: { slug: modele.slug, ...donnees } as never,
    });
  }
}

async function contenus() {
  const gabarits = [
    {
      key: "commande.payee",
      subject: "Votre commande {{numero}} est enregistrée",
      bodyMd:
        "Bonjour {{prenom}},\n\nVotre commande **{{numero}}** est bien enregistrée. Je commande les pièces manquantes cette semaine et je vous tiens informé·e à chaque étape.\n\nAssemblage estimé : {{delai}} jours.",
    },
    {
      key: "commande.pieces_recues",
      subject: "Les pièces de votre {{modele}} sont à l'atelier",
      bodyMd:
        "Bonjour {{prenom}},\n\nToutes les pièces de votre **{{modele}}** sont arrivées et contrôlées. L'assemblage commence.",
    },
    {
      key: "commande.en_assemblage",
      subject: "Votre {{modele}} est en cours d'assemblage",
      bodyMd:
        "Bonjour {{prenom}},\n\nJ'ai commencé le montage. Vous pouvez suivre l'avancement, photos comprises, depuis votre compte : {{lien_suivi}}",
    },
    {
      key: "commande.controle",
      subject: "Votre {{modele}} est au contrôle",
      bodyMd:
        "Bonjour {{prenom}},\n\nLa montre est montée. Elle passe maintenant le test d'étanchéité puis soixante-douze heures de contrôle de marche.",
    },
    {
      key: "commande.expediee",
      subject: "Votre {{modele}} part aujourd'hui",
      bodyMd:
        "Bonjour {{prenom}},\n\nVotre montre est expédiée. Numéro de suivi : {{suivi}}.\n\nÉcart de marche mesuré : {{ecart}} s/jour.",
    },
    {
      key: "commande.livree",
      subject: "Votre {{modele}} est arrivée",
      bodyMd:
        "Bonjour {{prenom}},\n\nLe transporteur indique que le colis est livré. N'hésitez pas à me dire ce que vous en pensez après quelques jours au poignet.",
    },
  ];

  for (const gabarit of gabarits) {
    await prisma.emailTemplate.upsert({
      where: { key: gabarit.key },
      update: { subject: gabarit.subject, bodyMd: gabarit.bodyMd },
      create: gabarit,
    });
  }

  await prisma.faqEntry.deleteMany({});
  for (const [index, entree] of FAQ.entries()) {
    await prisma.faqEntry.create({
      data: {
        question: entree.question,
        answer: entree.reponse,
        category: "general",
        sortIndex: index,
      },
    });
  }
}

async function clientsExemple() {
  const admin = await prisma.user.upsert({
    where: { email: "atelier@chronova.test" },
    update: { role: "ADMIN", name: "Atelier Chronova" },
    create: {
      email: "atelier@chronova.test",
      name: "Atelier Chronova",
      role: "ADMIN",
      isSample: true,
    },
  });

  const definitions = [
    {
      email: "camille.roussel@exemple.fr",
      name: "Camille Roussel",
      phone: "06 00 00 00 01",
      wristSizeMm: 168,
      preferences: "Préfère les cadrans sombres et les bracelets cuir.",
      newsletter: true,
      adresse: { fullName: "Camille Roussel", line1: "12 rue de l'Exemple", postalCode: "69004", city: "Lyon" },
      tags: ["Fidèle"],
    },
    {
      email: "yanis.berthier@exemple.fr",
      name: "Yanis Berthier",
      phone: "06 00 00 00 02",
      wristSizeMm: 190,
      preferences: "Plongée uniquement. Poignet large.",
      newsletter: false,
      adresse: { fullName: "Yanis Berthier", line1: "3 place de l'Exemple", postalCode: "44000", city: "Nantes" },
      tags: ["Première commande"],
    },
    {
      email: "margaux.delaunay@exemple.fr",
      name: "Margaux Delaunay",
      phone: "06 00 00 00 03",
      wristSizeMm: 152,
      preferences: "Petits diamètres, aiguilles bleuies.",
      newsletter: true,
      adresse: { fullName: "Margaux Delaunay", line1: "27 avenue de l'Exemple", postalCode: "33000", city: "Bordeaux" },
      tags: ["Fidèle", "Sur-mesure"],
    },
  ];

  const tags = new Map<string, string>();
  for (const label of [...new Set(definitions.flatMap((d) => d.tags))]) {
    const tag = await prisma.customerTag.upsert({
      where: { label },
      update: {},
      create: { label, tone: label === "Fidèle" ? "positif" : "neutre" },
    });
    tags.set(label, tag.id);
  }

  const clients = [];
  for (const definition of definitions) {
    const client = await prisma.user.upsert({
      where: { email: definition.email },
      update: {
        name: definition.name,
        phone: definition.phone,
        wristSizeMm: definition.wristSizeMm,
        preferences: definition.preferences,
        newsletter: definition.newsletter,
      },
      create: {
        email: definition.email,
        name: definition.name,
        phone: definition.phone,
        wristSizeMm: definition.wristSizeMm,
        preferences: definition.preferences,
        newsletter: definition.newsletter,
        isSample: true,
        role: "CLIENT",
        tags: { connect: definition.tags.map((label) => ({ id: tags.get(label)! })) },
      },
    });

    const dejaLa = await prisma.address.findFirst({ where: { userId: client.id } });
    if (!dejaLa) {
      await prisma.address.create({
        data: {
          userId: client.id,
          label: "Domicile",
          fullName: definition.adresse.fullName,
          line1: definition.adresse.line1,
          postalCode: definition.adresse.postalCode,
          city: definition.adresse.city,
          country: "FR",
          isDefaultShipping: true,
          isDefaultBilling: true,
        },
      });
    }

    if (definition.newsletter) {
      const consentement = await prisma.consentLog.findFirst({
        where: { userId: client.id, type: "NEWSLETTER" },
      });
      if (!consentement) {
        await prisma.consentLog.create({
          data: { userId: client.id, email: client.email, type: "NEWSLETTER", granted: true, source: "tunnel" },
        });
      }
    }

    clients.push(client);
  }

  return { admin, clients };
}

type Clients = Awaited<ReturnType<typeof clientsExemple>>;

async function commandes(clients: Clients, pieces: Map<string, string>) {
  const scenarios = [
    { numero: "CHR-2026-0001", modele: "soiree-37", client: 2, statut: "LIVREE", jours: 46, variante: {} },
    { numero: "CHR-2026-0002", modele: "abysse-40", client: 1, statut: "EXPEDIEE", jours: 31, variante: { "insert-teinte": "noir" } },
    { numero: "CHR-2026-0003", modele: "meridien-39", client: 0, statut: "CONTROLE", jours: 24, variante: { "cadran-teinte": "saumon" } },
    { numero: "CHR-2026-0004", modele: "sentier-38", client: 2, statut: "EN_ASSEMBLAGE", jours: 16, variante: { "bracelet-teinte": "chocolat" } },
    { numero: "CHR-2026-0005", modele: "abysse-40", client: 0, statut: "PIECES_RECUES", jours: 9, variante: { "cadran-teinte": "vert-sauge" } },
    { numero: "CHR-2026-0006", modele: "sentier-38", client: 1, statut: "PIECES_A_COMMANDER", jours: 3, variante: { taille: "39", gravure: "Cap au nord" } },
    { numero: "CHR-2026-0007", modele: "meridien-39", client: 2, statut: "PAYEE", jours: 1, variante: { "bracelet-type": "cuir", "bracelet-teinte": "fauve" } },
  ] as const;

  const ORDRE = [
    "PAYEE",
    "PIECES_A_COMMANDER",
    "PIECES_RECUES",
    "EN_ASSEMBLAGE",
    "CONTROLE",
    "EXPEDIEE",
    "LIVREE",
  ];

  for (const scenario of scenarios) {
    const existante = await prisma.order.findUnique({ where: { number: scenario.numero } });
    if (existante) continue;

    const modele = getSampleModel(scenario.modele)!;
    const enBase = await prisma.watchModel.findUniqueOrThrow({ where: { slug: modele.slug } });
    const client = clients.clients[scenario.client]!;
    const adresse = await prisma.address.findFirstOrThrow({ where: { userId: client.id } });

    const selections: Selections = { ...modele.defaultSelections, ...scenario.variante };
    const configuration = buildConfiguration(SAMPLE_CATALOGUE, modele, selections);
    const creeLe = ilYA(scenario.jours);

    const config = await prisma.configuration.create({
      data: {
        shareCode: configuration.shareParam,
        modelId: enBase.id,
        selections: configuration.selections as never,
        engravingText: configuration.selections["gravure"] ?? null,
        wristSizeMm: Number(configuration.selections["poignet"] ?? 0) || null,
        // L'instantané doit suffire à réafficher la montre : il porte donc le
        // rendu, pas seulement le résumé et le prix.
        snapshot: {
          render: configuration.render,
          summary: configuration.summary,
          price: configuration.price,
          leadTime: configuration.leadTime,
        } as never,
        priceCents: configuration.price.totalCents,
        partsCostCents: configuration.partsCostCents,
        leadTimeDays: configuration.leadTime.days,
        createdAt: creeLe,
      },
    });

    const port = configuration.price.totalCents >= 100000 ? 0 : 1500;
    const etapeAtteinte = ORDRE.indexOf(scenario.statut);
    const expediee = etapeAtteinte >= ORDRE.indexOf("EXPEDIEE");
    const livree = scenario.statut === "LIVREE";

    const commande = await prisma.order.create({
      data: {
        number: scenario.numero,
        userId: client.id,
        email: client.email,
        status: scenario.statut,
        subtotalCents: configuration.price.totalCents,
        shippingCents: port,
        totalCents: configuration.price.totalCents + port,
        shippingAddress: {
          fullName: adresse.fullName,
          line1: adresse.line1,
          postalCode: adresse.postalCode,
          city: adresse.city,
          country: adresse.country,
        } as never,
        promisedAt: new Date(creeLe.getTime() + configuration.leadTime.days * JOUR),
        paidAt: creeLe,
        shippedAt: expediee ? ilYA(Math.max(1, scenario.jours - 26)) : null,
        deliveredAt: livree ? ilYA(Math.max(1, scenario.jours - 30)) : null,
        carrier: expediee ? "Colissimo" : null,
        trackingNumber: expediee ? `6A00000000${scenario.numero.slice(-1)}` : null,
        isSample: true,
        createdAt: creeLe,
        items: {
          create: {
            configurationId: config.id,
            snapshot: {
              modele: modele.name,
              render: configuration.render,
              summary: configuration.summary,
            } as never,
            quantity: 1,
            unitPriceCents: configuration.price.totalCents,
            partsCostCents: configuration.partsCostCents,
          },
        },
      },
      include: { items: true },
    });

    // Nomenclature : les pièces que l'horloger devra sortir du stock.
    // Chaque ligne écrit les mêmes mouvements que le parcours réel — réservation
    // au paiement, sortie au montage — pour que les compteurs des pièces soient
    // la somme du journal et non un chiffre décoratif.
    const ligne = commande.items[0]!;
    const monte = etapeAtteinte >= ORDRE.indexOf("EN_ASSEMBLAGE");
    const montePar = monte ? ilYA(Math.max(1, scenario.jours - 8)) : null;

    for (const entree of configuration.bom) {
      const partId = pieces.get(entree.part.ref);
      if (!partId) continue;

      await prisma.orderItemPart.create({
        data: {
          orderItemId: ligne.id,
          partId,
          quantity: entree.quantity,
          unitCostCents: entree.unitCostCents,
          reservedAt: creeLe,
          consumedAt: montePar,
        },
      });

      await prisma.stockMovement.create({
        data: {
          partId,
          type: "RESERVATION",
          quantity: -entree.quantity,
          orderId: commande.id,
          reason: `Commande ${commande.number}`,
          createdAt: creeLe,
        },
      });

      if (montePar) {
        await prisma.stockMovement.create({
          data: {
            partId,
            type: "SORTIE_ASSEMBLAGE",
            quantity: -entree.quantity,
            orderId: commande.id,
            reason: `Assemblage ${commande.number}`,
            createdAt: montePar,
          },
        });
      }

    }

    // Frise : une entrée par étape franchie, du paiement à l'étape actuelle.
    for (const [index, statut] of ORDRE.slice(0, etapeAtteinte + 1).entries()) {
      await prisma.orderEvent.create({
        data: {
          orderId: commande.id,
          fromStatus: index === 0 ? null : (ORDRE[index - 1] as never),
          toStatus: statut as never,
          emailSent: true,
          createdAt: new Date(creeLe.getTime() + index * 4 * JOUR),
        },
      });
    }

    // Checklist d'assemblage, cochée jusqu'où en est la commande.
    const cochees =
      etapeAtteinte >= ORDRE.indexOf("EXPEDIEE")
        ? CHECKLIST.length
        : etapeAtteinte >= ORDRE.indexOf("CONTROLE")
          ? CHECKLIST.length - 2
          : etapeAtteinte >= ORDRE.indexOf("EN_ASSEMBLAGE")
            ? 4
            : 1;

    for (const [index, label] of CHECKLIST.entries()) {
      await prisma.assemblyTask.create({
        data: {
          orderId: commande.id,
          label,
          sortIndex: index,
          isDone: index < cochees,
          doneAt: index < cochees ? ilYA(scenario.jours - index) : null,
        },
      });
    }

    if (etapeAtteinte >= ORDRE.indexOf("CONTROLE")) {
      await prisma.qualityControl.create({
        data: {
          orderId: commande.id,
          waterTestPassed: true,
          waterTestBar: modele.waterResistM / 10,
          rateSecondsPerDay: [2.4, -1.8, 4.1, 0.9][scenario.client] ?? 3.2,
          amplitudeDegrees: 278,
          beatErrorMs: 0.3,
          testStartedAt: ilYA(scenario.jours - 14),
          testEndedAt: ilYA(scenario.jours - 11),
          passed: expediee,
          notes: expediee ? "Écart stable sur les trois jours." : "Contrôle en cours.",
        },
      });
    }

    if (etapeAtteinte >= ORDRE.indexOf("EN_ASSEMBLAGE")) {
      await prisma.orderPhoto.create({
        data: {
          orderId: commande.id,
          url: "",
          alt: `Mouvement de la ${modele.name} avant emboîtage`,
          caption: "Mouvement contrôlé, avant emboîtage.",
          isPublic: true,
          createdAt: ilYA(scenario.jours - 10),
        },
      });
    }

    if (expediee) {
      await prisma.warranty.create({
        data: {
          orderId: commande.id,
          startsAt: ilYA(scenario.jours - 26),
          endsAt: dans(365 * 2 - scenario.jours),
          terms: "[À REMPLIR : durée et conditions de garantie]",
        },
      });
    }
  }
}

async function demandes(clients: Clients) {
  const existantes = await prisma.inquiry.count();
  if (existantes > 0) return;

  await prisma.inquiry.createMany({
    data: [
      {
        type: "SUR_MESURE",
        status: "NOUVEAU",
        name: "Margaux Delaunay",
        email: "margaux.delaunay@exemple.fr",
        message:
          "Serait-il possible d'avoir un cadran émail crème avec des chiffres romains appliqués, sur le boîtier 37 mm ?",
        budgetCents: 200000,
        userId: clients.clients[2]?.id ?? null,
        isSample: true,
        createdAt: ilYA(2),
      },
      {
        type: "CONTACT",
        status: "LU",
        name: "Yanis Berthier",
        email: "yanis.berthier@exemple.fr",
        message: "Le bracelet acier jubilé est-il compatible avec l'Abysse 40 ?",
        userId: clients.clients[1]?.id ?? null,
        isSample: true,
        createdAt: ilYA(6),
      },
    ],
  });

  const commande = await prisma.order.findUnique({ where: { number: "CHR-2026-0001" } });
  await prisma.serviceCase.create({
    data: {
      reference: "SAV-2026-0001",
      userId: clients.clients[2]?.id ?? null,
      orderId: commande?.id ?? null,
      type: "GARANTIE",
      status: "DIAGNOSTIC",
      description: "La trotteuse marque un léger saut à 30 secondes.",
      isSample: true,
      openedAt: ilYA(4),
    },
  });
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (erreur) => {
    console.error(erreur);
    await prisma.$disconnect();
    process.exit(1);
  });
