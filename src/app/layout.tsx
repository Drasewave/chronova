import type { Metadata, Viewport } from "next";
import { IBM_Plex_Mono, Inter, Space_Grotesk } from "next/font/google";
import { INTRO_BOOT } from "@/components/intro/intro-boot";
import { CartDrawer } from "@/components/panier/cart-drawer";
import { CartProvider } from "@/lib/panier/cart";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["500", "700"],
  display: "swap",
  variable: "--font-space-grotesk",
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
  variable: "--font-inter",
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
  // [À REMPLIR : domaine définitif] — via NEXT_PUBLIC_SITE_URL, comme le sitemap,
  // robots.txt et llms.txt : une seule variable décide de toutes les URL absolues.
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://chronova.fr"),
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
    title: "Chronova — montres mécaniques assemblées à la main",
    description:
      "Chaque Chronova est composée par son futur propriétaire, puis assemblée et réglée à la main, pièce par pièce, dans un atelier indépendant.",
  },
  twitter: { card: "summary" },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#15181B",
  colorScheme: "light",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="fr"
      className={`${spaceGrotesk.variable} ${inter.variable} ${plexMono.variable}`}
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
      </body>
    </html>
  );
}
