import type { MetadataRoute } from "next";

const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://chronova.fr";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Le CRM, le compte client et le panier n'ont rien à faire dans un index.
      disallow: ["/atelier", "/atelier/", "/compte", "/compte/", "/panier", "/api/"],
    },
    sitemap: `${BASE}/sitemap.xml`,
  };
}
