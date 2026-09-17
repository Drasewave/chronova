import type { Metadata } from "next";
import { PanierComplet } from "@/components/panier/panier-complet";

export const metadata: Metadata = {
  title: "Panier",
  robots: { index: false, follow: true },
};

export default function Panier() {
  return <PanierComplet />;
}
