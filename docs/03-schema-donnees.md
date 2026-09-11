# Chronova — Schéma de base de données

PostgreSQL + Prisma. 34 modèles répartis en 7 domaines. Tous les montants sont des **centimes entiers**.

## Vue d'ensemble

| Domaine | Modèles |
|---|---|
| Comptes | `User` `Account` `Session` `VerificationToken` `Address` `CustomerTag` `ConsentLog` |
| Catalogue | `WatchModel` `OptionGroup` `ModelOptionGroup` `Option` `CompatibilityRule` |
| Stock | `Supplier` `Part` `StockMovement` `PurchaseOrder` `PurchaseOrderLine` |
| Commerce | `Configuration` `Cart` `CartItem` `Order` `OrderItem` `OrderItemPart` `OrderEvent` |
| Atelier | `AssemblyTask` `QualityControl` `OrderPhoto` |
| Relation client | `Inquiry` `Quote` `ServiceCase` `Warranty` `InternalNote` |
| Contenu | `EmailTemplate` `Setting` `Testimonial` `FaqEntry` `AuditLog` |

## Décisions structurantes

1. **Instantané figé.** `Configuration.snapshot` et `OrderItem.snapshot` conservent libellés, teintes et prix **au moment de la commande**. L'horloger peut renommer une option ou changer un prix : les commandes passées restent exactes.
2. **Le stock est un journal.** `Part.quantityOnHand` et `quantityReserved` sont des caches ; la vérité est la somme de `StockMovement`. Toute écriture passe par une transaction qui insère le mouvement et met à jour le cache. Un écart est donc détectable.
3. **La nomenclature est dérivée, puis figée.** `OrderItemPart` est générée depuis la configuration au paiement, ce qui réserve le stock et fige le coût d'achat — d'où une **marge** juste, même si les prix fournisseurs bougent ensuite.
4. **Les règles de compatibilité sont des données.** Une seule forme (`sujet` + `exige l'une de` / `exclut`) couvre les deux cas cités (aiguille GMT ⇒ NH34 ; lunette plongée ⇒ 40 mm) et tout ce que l'horloger ajoutera, avec le message affiché au client.
5. **RGPD.** `User.anonymizedAt` permet l'effacement sur demande sans détruire la comptabilité : les commandes restent, les données personnelles sont écrasées. Les consentements sont horodatés dans `ConsentLog`.
6. **Traçabilité.** `AuditLog` enregistre chaque écriture du CRM (qui, quoi, différentiel).

## Schéma Prisma (projet)

```prisma
generator client { provider = "prisma-client-js" }
datasource db  { provider = "postgresql"; url = env("DATABASE_URL") }

// ─────────────────────────── Comptes ───────────────────────────

enum Role { CLIENT ADMIN }

model User {
  id               String    @id @default(cuid())
  email            String    @unique
  emailVerified    DateTime?
  name             String?
  phone            String?
  role             Role      @default(CLIENT)
  wristSizeMm      Int?                      // tour de poignet
  preferences      String?                   // notes libres du client
  crmNotes         String?                   // notes internes, jamais exposées
  stripeCustomerId String?   @unique
  newsletter       Boolean   @default(false)
  anonymizedAt     DateTime?                 // RGPD : effacement sans perte comptable
  createdAt        DateTime  @default(now())
  updatedAt        DateTime  @updatedAt

  accounts   Account[]
  sessions   Session[]
  addresses  Address[]
  orders     Order[]
  carts      Cart[]
  inquiries  Inquiry[]
  cases      ServiceCase[]
  consents   ConsentLog[]
  tags       CustomerTag[] @relation("UserTags")
  notes      InternalNote[]
  @@index([role])
}

model Account          { /* adaptateur Auth.js */ }
model Session          { /* adaptateur Auth.js */ }
model VerificationToken{ /* adaptateur Auth.js */ }

model Address {
  id         String  @id @default(cuid())
  userId     String
  label      String?            // « Domicile », « Bureau »
  fullName   String
  line1      String
  line2      String?
  postalCode String
  city       String
  country    String  @default("FR")
  phone      String?
  isDefaultShipping Boolean @default(false)
  isDefaultBilling  Boolean @default(false)
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  @@index([userId])
}

model CustomerTag {
  id    String @id @default(cuid())
  label String @unique
  color String                   // token, pas un hex libre
  users User[] @relation("UserTags")
}

enum ConsentType { NEWSLETTER COOKIES_MESURE COOKIES_MARKETING }

model ConsentLog {
  id        String      @id @default(cuid())
  userId    String?
  email     String?
  type      ConsentType
  granted   Boolean
  source    String                      // « bandeau », « compte », « tunnel »
  createdAt DateTime    @default(now())
  user User? @relation(fields: [userId], references: [id], onDelete: SetNull)
  @@index([email, type])
}

// ────────────────────────── Catalogue ──────────────────────────

enum WatchStyle { PLONGEE TERRAIN GMT HABILLEE }

model WatchModel {
  id            String     @id @default(cuid())
  slug          String     @unique
  name          String                        // « Abysse 40 »
  tagline       String
  description   String                        // Markdown
  style         WatchStyle
  diameterMm    Int
  basePriceCents Int                          // [EXEMPLE] modifiable dans le CRM
  assemblyDays  Int        @default(14)
  waterResistM  Int?
  isPublished   Boolean    @default(false)
  sortIndex     Int        @default(0)
  seoTitle      String?
  seoDescription String?
  isSample      Boolean    @default(false)    // donnée de démonstration
  createdAt     DateTime   @default(now())
  updatedAt     DateTime   @updatedAt

  groups         ModelOptionGroup[]
  configurations Configuration[]
  rules          CompatibilityRule[]
}

enum GroupKey { BOITIER CADRAN INDEX AIGUILLES LUNETTE INSERT COURONNE BRACELET VERRE MOUVEMENT FOND GRAVURE }
enum SelectionType { UNIQUE UNIQUE_OU_AUCUN TEXTE }

model OptionGroup {
  id            String        @id @default(cuid())
  key           GroupKey      @unique
  label         String                        // « Cadran »
  helpText      String?
  selectionType SelectionType @default(UNIQUE)
  renderLayer   String                        // calque SVG piloté
  stepIndex     Int                           // ordre dans le configurateur
  options       Option[]
  models        ModelOptionGroup[]
}

model ModelOptionGroup {
  id              String @id @default(cuid())
  modelId         String
  groupId         String
  defaultOptionId String?
  sortIndex       Int    @default(0)
  isRequired      Boolean @default(true)
  model WatchModel  @relation(fields: [modelId], references: [id], onDelete: Cascade)
  group OptionGroup @relation(fields: [groupId], references: [id])
  @@unique([modelId, groupId])
}

model Option {
  id              String  @id @default(cuid())
  groupId         String
  key             String                       // « bleu-abysse »
  label           String                       // « Bleu abysse »
  description     String?
  colorHex        String?                      // teinte de la pastille
  colorName       String?                      // toujours affiché, jamais la couleur seule
  svgPartKey      String                       // pièce du registre de rendu
  renderMeta      Json?                        // finition, texture, luminova…
  priceDeltaCents Int     @default(0)
  partId          String?                      // pièce de stock liée
  isActive        Boolean @default(true)
  sortIndex       Int     @default(0)
  isSample        Boolean @default(false)
  group   OptionGroup @relation(fields: [groupId], references: [id], onDelete: Cascade)
  part    Part?       @relation(fields: [partId], references: [id], onDelete: SetNull)
  rules   CompatibilityRule[] @relation("RuleSubject")
  @@unique([groupId, key])
  @@index([partId])
}

enum RuleKind { EXIGE_UNE_DE EXCLUT }

model CompatibilityRule {
  id           String   @id @default(cuid())
  modelId      String?                       // null = règle globale
  subjectId    String                        // l'option contrainte
  kind         RuleKind
  targetIds    String[]                      // options concernées
  message      String                        // « Nécessite le mouvement GMT »
  isActive     Boolean  @default(true)
  model   WatchModel? @relation(fields: [modelId], references: [id], onDelete: Cascade)
  subject Option      @relation("RuleSubject", fields: [subjectId], references: [id], onDelete: Cascade)
  @@index([modelId])
}

// ──────────────────────────── Stock ────────────────────────────

enum PartCategory { BOITIER CADRAN AIGUILLES LUNETTE INSERT COURONNE BRACELET VERRE MOUVEMENT FOND DIVERS }

model Supplier {
  id           String @id @default(cuid())
  name         String
  contactName  String?
  email        String?
  phone        String?
  website      String?
  address      String?
  leadTimeDays Int    @default(21)
  notes        String?
  parts  Part[]
  orders PurchaseOrder[]
}

model Part {
  id                String       @id @default(cuid())
  reference         String       @unique       // « CAD-BLE-38 »
  name              String
  category          PartCategory
  supplierId        String?
  purchasePriceCents Int         @default(0)
  quantityOnHand    Int          @default(0)   // cache du journal
  quantityReserved  Int          @default(0)   // commandes en cours
  reorderThreshold  Int          @default(2)
  storageLocation   String?                    // « tiroir B3 »
  notes             String?
  isSample          Boolean      @default(false)
  supplier  Supplier?  @relation(fields: [supplierId], references: [id], onDelete: SetNull)
  options   Option[]
  movements StockMovement[]
  orderParts OrderItemPart[]
  poLines   PurchaseOrderLine[]
  @@index([category])
}

enum MovementType { ENTREE RESERVATION LIBERATION SORTIE_ASSEMBLAGE PERTE AJUSTEMENT }

model StockMovement {
  id        String       @id @default(cuid())
  partId    String
  type      MovementType
  quantity  Int                            // signé
  orderId   String?
  actorId   String?
  reason    String?
  createdAt DateTime     @default(now())
  part  Part   @relation(fields: [partId], references: [id], onDelete: Cascade)
  order Order? @relation(fields: [orderId], references: [id], onDelete: SetNull)
  @@index([partId, createdAt])
}

enum PurchaseStatus { BROUILLON ENVOYEE PARTIELLE RECUE ANNULEE }

model PurchaseOrder {
  id         String         @id @default(cuid())
  reference  String         @unique
  supplierId String
  status     PurchaseStatus @default(BROUILLON)
  orderedAt  DateTime?
  expectedAt DateTime?
  receivedAt DateTime?
  notes      String?
  supplier Supplier @relation(fields: [supplierId], references: [id])
  lines    PurchaseOrderLine[]
}

model PurchaseOrderLine {
  id               String @id @default(cuid())
  purchaseOrderId  String
  partId           String
  quantity         Int
  quantityReceived Int    @default(0)
  unitCostCents    Int
  purchaseOrder PurchaseOrder @relation(fields: [purchaseOrderId], references: [id], onDelete: Cascade)
  part          Part          @relation(fields: [partId], references: [id])
}

// ─────────────────────────── Commerce ──────────────────────────

model Configuration {
  id            String   @id @default(cuid())
  shareCode     String   @unique              // code court pour l'URL de partage
  modelId       String
  selections    Json                          // { "CADRAN": "bleu-abysse", … }
  engravingText String?  @db.VarChar(30)
  wristSizeMm   Int?
  snapshot      Json                          // libellés + prix figés
  priceCents    Int
  partsCostCents Int                          // pour la marge
  leadTimeDays  Int
  createdAt     DateTime @default(now())
  model      WatchModel  @relation(fields: [modelId], references: [id])
  cartItems  CartItem[]
  orderItems OrderItem[]
  inquiries  Inquiry[]
}

model Cart {
  id        String   @id @default(cuid())
  userId    String?
  anonKey   String?  @unique                  // panier invité (cookie signé)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  user  User?      @relation(fields: [userId], references: [id], onDelete: Cascade)
  items CartItem[]
}

model CartItem {
  id              String @id @default(cuid())
  cartId          String
  configurationId String
  quantity        Int    @default(1)
  cart          Cart          @relation(fields: [cartId], references: [id], onDelete: Cascade)
  configuration Configuration @relation(fields: [configurationId], references: [id])
}

enum OrderStatus {
  EN_ATTENTE_PAIEMENT PAYEE PIECES_A_COMMANDER PIECES_RECUES
  EN_ASSEMBLAGE CONTROLE EXPEDIEE LIVREE ANNULEE REMBOURSEE
}

model Order {
  id                    String      @id @default(cuid())
  number                String      @unique          // CHR-2026-0007
  userId                String?
  email                 String
  status                OrderStatus @default(EN_ATTENTE_PAIEMENT)
  subtotalCents         Int
  shippingCents         Int         @default(0)
  totalCents            Int
  currency              String      @default("eur")
  stripeSessionId       String?     @unique
  stripePaymentIntentId String?
  shippingAddress       Json                          // instantané
  billingAddress        Json?
  carrier               String?
  trackingNumber        String?
  trackingUrl           String?
  promisedAt            DateTime?                     // date d'expédition annoncée
  paidAt                DateTime?
  shippedAt             DateTime?
  deliveredAt           DateTime?
  internalNotes         String?
  isSample              Boolean     @default(false)
  createdAt             DateTime    @default(now())
  updatedAt             DateTime    @updatedAt

  user      User?  @relation(fields: [userId], references: [id], onDelete: SetNull)
  items     OrderItem[]
  events    OrderEvent[]
  photos    OrderPhoto[]
  tasks     AssemblyTask[]
  qc        QualityControl?
  warranty  Warranty?
  cases     ServiceCase[]
  movements StockMovement[]
  @@index([status, createdAt])
}

model OrderItem {
  id              String @id @default(cuid())
  orderId         String
  configurationId String
  snapshot        Json                 // configuration figée (libellés, teintes, prix)
  quantity        Int    @default(1)
  unitPriceCents  Int
  partsCostCents  Int                  // coût figé → marge = unitPrice − partsCost
  order         Order         @relation(fields: [orderId], references: [id], onDelete: Cascade)
  configuration Configuration @relation(fields: [configurationId], references: [id])
  parts         OrderItemPart[]
}

model OrderItemPart {          // nomenclature générée automatiquement
  id            String  @id @default(cuid())
  orderItemId   String
  partId        String
  quantity      Int     @default(1)
  unitCostCents Int
  reservedAt    DateTime?
  consumedAt    DateTime?
  orderItem OrderItem @relation(fields: [orderItemId], references: [id], onDelete: Cascade)
  part      Part      @relation(fields: [partId], references: [id])
}

model OrderEvent {             // frise visible par le client
  id         String       @id @default(cuid())
  orderId    String
  fromStatus OrderStatus?
  toStatus   OrderStatus
  note       String?
  isPublic   Boolean      @default(true)
  emailSent  Boolean      @default(false)
  actorId    String?
  createdAt  DateTime     @default(now())
  order Order @relation(fields: [orderId], references: [id], onDelete: Cascade)
  @@index([orderId, createdAt])
}

// ──────────────────────────── Atelier ──────────────────────────

model AssemblyTask {
  id        String   @id @default(cuid())
  orderId   String
  label     String                        // « Pose du cadran », « Emboîtage »
  sortIndex Int      @default(0)
  isDone    Boolean  @default(false)
  doneAt    DateTime?
  order Order @relation(fields: [orderId], references: [id], onDelete: Cascade)
}

model QualityControl {
  id                  String   @id @default(cuid())
  orderId             String   @unique
  waterTestPassed     Boolean?
  waterTestBar        Int?
  rateSecondsPerDay   Float?                 // écart en s/jour
  amplitudeDegrees    Float?
  beatErrorMs         Float?
  testStartedAt       DateTime?
  testEndedAt         DateTime?              // 72 h
  passed              Boolean?
  notes               String?
  order Order @relation(fields: [orderId], references: [id], onDelete: Cascade)
}

model OrderPhoto {
  id        String   @id @default(cuid())
  orderId   String
  url       String
  alt       String
  caption   String?
  isPublic  Boolean  @default(true)          // visible par le client
  createdAt DateTime @default(now())
  order Order @relation(fields: [orderId], references: [id], onDelete: Cascade)
}

// ───────────────────── Demandes, devis, SAV ────────────────────

enum InquiryType   { CONTACT SUR_MESURE }
enum InquiryStatus { NOUVEAU LU EN_COURS DEVIS_ENVOYE CONVERTI CLOS }

model Inquiry {
  id              String        @id @default(cuid())
  type            InquiryType
  status          InquiryStatus @default(NOUVEAU)
  name            String
  email           String
  phone           String?
  message         String
  budgetCents     Int?
  configurationId String?
  userId          String?
  createdAt       DateTime      @default(now())
  user          User?          @relation(fields: [userId], references: [id], onDelete: SetNull)
  configuration Configuration? @relation(fields: [configurationId], references: [id], onDelete: SetNull)
  quotes        Quote[]
  @@index([status, createdAt])
}

enum QuoteStatus { BROUILLON ENVOYE ACCEPTE REFUSE EXPIRE }

model Quote {
  id         String      @id @default(cuid())
  reference  String      @unique
  inquiryId  String
  lines      Json                            // désignation, quantité, prix
  totalCents Int
  validUntil DateTime?
  status     QuoteStatus @default(BROUILLON)
  orderId    String?                         // commande issue du devis
  inquiry Inquiry @relation(fields: [inquiryId], references: [id], onDelete: Cascade)
}

enum CaseType   { GARANTIE REVISION REPARATION }
enum CaseStatus { RECU DIAGNOSTIC DEVIS EN_COURS TERMINE RENVOYE }

model ServiceCase {
  id          String     @id @default(cuid())
  reference   String     @unique
  userId      String?
  orderId     String?
  type        CaseType
  status      CaseStatus @default(RECU)
  description String
  diagnosis   String?
  resolution  String?
  costCents   Int?
  openedAt    DateTime   @default(now())
  closedAt    DateTime?
  user  User?  @relation(fields: [userId], references: [id], onDelete: SetNull)
  order Order? @relation(fields: [orderId], references: [id], onDelete: SetNull)
}

model Warranty {
  id        String   @id @default(cuid())
  orderId   String   @unique
  startsAt  DateTime
  endsAt    DateTime
  terms     String
  order Order @relation(fields: [orderId], references: [id], onDelete: Cascade)
  @@index([endsAt])
}

model InternalNote {
  id        String   @id @default(cuid())
  userId    String?                       // client concerné
  orderId   String?
  body      String
  actorId   String?
  createdAt DateTime @default(now())
  user User? @relation(fields: [userId], references: [id], onDelete: Cascade)
}

// ──────────────────── Contenu & paramètres ─────────────────────

model EmailTemplate {
  id        String   @id @default(cuid())
  key       String   @unique               // « commande.en_assemblage »
  subject   String
  bodyMd    String                         // variables {{prenom}}, {{numero}}…
  isActive  Boolean  @default(true)
  updatedAt DateTime @updatedAt
}

model Setting {
  key       String   @id                   // « livraison.frais », « atelier.delai_base »
  value     Json
  label     String
  updatedAt DateTime @updatedAt
}

model Testimonial {                        // uniquement de vrais avis
  id          String   @id @default(cuid())
  authorName  String
  city        String?
  body        String
  orderNumber String?
  isPublished Boolean  @default(false)
  createdAt   DateTime @default(now())
}

model FaqEntry {
  id          String  @id @default(cuid())
  question    String
  answer      String                       // Markdown
  category    String                       // garantie, mouvement, délais…
  sortIndex   Int     @default(0)
  isPublished Boolean @default(true)
}

model AuditLog {
  id        String   @id @default(cuid())
  actorId   String?
  entity    String                         // « Order », « Part »
  entityId  String
  action    String                         // « create », « update », « delete »
  diff      Json?
  createdAt DateTime @default(now())
  @@index([entity, entityId])
}
```

## Logique métier tenue hors de la base (fonctions pures, testées)

| Fonction | Rôle |
|---|---|
| `computePrice(model, selections)` | Prix de base + suppléments + gravure → total et détail ligne à ligne |
| `computeLeadTime(model, selections, stock)` | Délai annoncé = assemblage + réapprovisionnement de la pièce manquante la plus lente |
| `evaluateRules(model, selections)` | Pour chaque option : sélectionnable / grisée + **raison affichée** |
| `resolveStockState(option, part)` | `disponible` · `dernière pièce` · `de retour bientôt` (non sélectionnable) |
| `buildBom(configuration)` | Configuration → nomenclature de pièces (aussi utilisée par le CRM) |
| `encodeConfig` / `decodeConfig` | Configuration ⇄ URL partageable, tolérante aux options retirées du catalogue |

Ces six fonctions sont le cœur testable du projet : elles servent au configurateur public, au panier, au CRM et aux e-mails, sans duplication.
