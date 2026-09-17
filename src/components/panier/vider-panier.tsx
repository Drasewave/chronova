"use client";

import { useEffect } from "react";
import { useCart } from "@/lib/panier/cart";

/**
 * Vide le panier une fois la commande enregistrée.
 *
 * Volontairement ici, sur la page de confirmation, et pas au départ vers le
 * paiement : un client qui renonce au dernier moment retrouve son panier intact.
 */
export function ViderPanier() {
  const { clear, ready, items } = useCart();

  useEffect(() => {
    if (ready && items.length > 0) clear();
  }, [ready, items.length, clear]);

  return null;
}
