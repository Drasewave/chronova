import type { Metadata, Viewport } from "next";
import { Geist_Mono, Hanken_Grotesk, Jost } from "next/font/google";
import { INTRO_BOOT } from "@/components/intro/intro-boot";
import { SITE } from "@/lib/env";
import { HorlogeVivante } from "@/watch/horloge-vivante";
import "./globals.css";

// Jost : le géométrique des cadrans, en titrage. Variable, donc une seule
// requête pour le 300 des grands titres comme pour le 500 des intertitres.
const jost = Jost({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-jost",
});

const hanken = Hanken_Grotesk({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-hanken",
});

// Réservée aux vraies chaînes machine du CRM (identifiants, journaux).
const geistMono = Geist_Mono({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-geist-mono",
});

export const metadata: Metadata = {
  // [À REMPLIR : domaine définitif] — via src/lib/env.ts, comme le sitemap,
  // robots.txt et llms.txt : une seule variable décide de toutes les URL absolues.
  metadataBase: new URL(SITE),
  title: {
    default: "Chronova, montres mécaniques assemblées à la main",
    template: "%s · Chronova",
  },
  description:
    "Composez votre montre mécanique en ligne. L'horloger l'assemble et la règle à la main, pièce par pièce, dans son atelier indépendant.",
  openGraph: {
    type: "website",
    locale: "fr_FR",
    siteName: "Chronova",
    title: "Chronova, montres mécaniques assemblées à la main",
    description:
      "Composez votre montre mécanique en ligne. L'horloger l'assemble et la règle à la main, pièce par pièce, dans son atelier indépendant.",
  },
  twitter: { card: "summary_large_image" },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  // Alignés sur --color-papier et --color-nuit (globals.css).
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0b0d" },
  ],
  colorScheme: "light",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="fr"
      // `html` défile en douceur (ancres). Sans cet attribut, Next 16 laisse ce
      // réglage agir aussi sur le retour en haut d'une navigation : la nouvelle
      // page arrivait en train de remonter, et le morphing carte → fiche ne
      // trouvait pas sa montre, encore hors champ.
      data-scroll-behavior="smooth"
      className={`${jost.variable} ${hanken.variable} ${geistMono.variable}`}
    >
      <body>
        {/* Décide du rideau d'entrée avant que le navigateur ne peigne la page.
            En tête de <body> : le script s'exécute avant que le rideau ne soit
            analysé, donc avant tout affichage. */}
        <script dangerouslySetInnerHTML={{ __html: INTRO_BOOT }} />
        {/* Le panier vit dans (site)/layout.tsx et not-found.tsx : le CRM n'en charge pas le JS. */}
        {children}
        {/* Met toutes les montres du site (public et atelier) à l'heure du visiteur, d'un même battement. */}
        <HorlogeVivante />
      </body>
    </html>
  );
}
