import type { Metadata, Viewport } from "next";
import { Hanken_Grotesk, IBM_Plex_Mono, Newsreader } from "next/font/google";
import { Grain } from "@/components/layout/grain";
import { INTRO_BOOT } from "@/components/intro/intro-boot";
import "./globals.css";

const newsreader = Newsreader({
  subsets: ["latin"],
  weight: ["400", "500"],
  style: ["normal", "italic"],
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
  weight: ["400", "500"],
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
        {children}
        <Grain />
      </body>
    </html>
  );
}
