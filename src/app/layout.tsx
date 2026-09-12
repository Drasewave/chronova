import type { Metadata, Viewport } from "next";
import { Hanken_Grotesk, IBM_Plex_Mono, Newsreader } from "next/font/google";
import { Grain } from "@/components/layout/grain";
import { INTRO_BOOT } from "@/components/intro/intro-boot";
import { CartDrawer } from "@/components/panier/cart-drawer";
import { CartProvider } from "@/lib/panier/cart";
import "./globals.css";

const newsreader = Newsreader({
  subsets: ["latin"],
  // Les graisses sont déclarées même si la police est variable : à poids égal
  // sur le réseau, cela empêche un `font-bold` égaré de sortir du système.
  weight: ["400", "500"],
  display: "swap",
  variable: "--font-newsreader",
});

const hanken = Hanken_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
  variable: "--font-hanken",
});

const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  // Une seule graisse : les références techniques ne sont jamais mises en gras,
  // et la 500 partait dans le navigateur sans que rien ne l'utilise.
  weight: ["400"],
  display: "swap",
  variable: "--font-plex-mono",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://chronova.fr"), // [À REMPLIR : domaine définitif]
  title: {
    default: "Chronova — montres mécaniques assemblées à la main",
    template: "%s · Chronova",
  },
  description:
    "Chaque Chronova est composée par son futur propriétaire, puis assemblée et réglée à la main, pièce par pièce, dans un atelier indépendant.",
  openGraph: {
    type: "website",
    locale: "fr_FR",
    siteName: "Chronova",
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#F5F0E8",
  colorScheme: "light",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="fr"
      className={`${newsreader.variable} ${hanken.variable} ${plexMono.variable}`}
    >
      <body>
        {/* Décide du rideau d'entrée avant que le navigateur ne peigne la page.
            En tête de <body> : le script s'exécute avant que le rideau ne soit
            analysé, donc avant tout affichage. */}
        <script dangerouslySetInnerHTML={{ __html: INTRO_BOOT }} />
        {/* Le panier est fourni à la racine : l'en-tête, et donc son bouton
            panier, apparaît aussi sur des pages hors du groupe (site) — la 404
            par exemple. */}
        <CartProvider>
          {children}
          <CartDrawer />
        </CartProvider>
        <Grain />
      </body>
    </html>
  );
}
