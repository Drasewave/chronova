import type { NextConfig } from "next";

const config: NextConfig = {
  reactStrictMode: true,
  // Le serveur de développement bloque par défaut les ressources internes
  // demandées depuis une autre origine que localhost ; les outils de capture
  // d'écran s'y connectent en 127.0.0.1.
  allowedDevOrigins: ["127.0.0.1"],
  images: {
    // Les photos réelles arriveront plus tard ; on prévoit déjà les formats modernes.
    formats: ["image/avif", "image/webp"],
  },
  // Le site est entièrement en français : on le déclare une fois pour toutes.
  env: { NEXT_PUBLIC_LOCALE: "fr-FR" },
};

export default config;
