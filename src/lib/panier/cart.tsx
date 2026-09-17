"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { SummaryLine } from "@/lib/configurateur/configuration";
import type { WatchRender } from "@/watch/types";

const CLE = "chronova:panier";

/**
 * Instantané d'une configuration au moment où elle est mise au panier.
 *
 * Le panier ne recalcule rien : il affiche ce qui a été vu au moment du choix.
 * C'est ce qui lui permet de vivre dans le navigateur, sans catalogue, et donc
 * de ne ralentir aucune page. Le prix qui fera foi est recalculé côté serveur au
 * moment du paiement, à partir de `shareParam` — un panier ancien ne peut donc
 * pas faire passer un tarif périmé.
 */
export interface CartSnapshot {
  modelName: string;
  summary: SummaryLine[];
  priceCents: number;
  leadTimeDays: number;
  render: WatchRender;
}

export interface CartItem {
  id: string;
  modelSlug: string;
  /** La configuration, sous la forme du paramètre `?c=` : elle est rejouable. */
  shareParam: string;
  quantity: number;
  snapshot: CartSnapshot;
}

interface CartApi {
  items: CartItem[];
  count: number;
  totalCents: number;
  ready: boolean;
  isOpen: boolean;
  open: () => void;
  close: () => void;
  add: (modelSlug: string, shareParam: string, snapshot: CartSnapshot) => void;
  remove: (id: string) => void;
  setQuantity: (id: string, quantity: number) => void;
  clear: () => void;
}

const Contexte = createContext<CartApi | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [ready, setReady] = useState(false);
  const [isOpen, setOpen] = useState(false);

  useEffect(() => {
    try {
      const brut = localStorage.getItem(CLE);
      if (brut) {
        const lus = JSON.parse(brut) as CartItem[];
        // Une ligne écrite par une version antérieure n'a pas d'instantané :
        // on l'ignore plutôt que de faire planter le panier.
        setItems(lus.filter((item) => item?.snapshot?.render));
      }
    } catch {
      // Stockage indisponible : le panier reste en mémoire pour la session.
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(CLE, JSON.stringify(items));
    } catch {
      /* ignoré */
    }
  }, [items, ready]);

  const add = useCallback((modelSlug: string, shareParam: string, snapshot: CartSnapshot) => {
    setItems((prev) => {
      const existante = prev.find(
        (item) => item.modelSlug === modelSlug && item.shareParam === shareParam,
      );
      if (existante) {
        return prev.map((item) =>
          item.id === existante.id ? { ...item, quantity: item.quantity + 1 } : item,
        );
      }
      return [
        ...prev,
        {
          id: `${modelSlug}-${Date.now().toString(36)}`,
          modelSlug,
          shareParam,
          quantity: 1,
          snapshot,
        },
      ];
    });
    setOpen(true);
  }, []);

  const remove = useCallback((id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const setQuantity = useCallback((id: string, quantity: number) => {
    setItems((prev) =>
      quantity <= 0
        ? prev.filter((item) => item.id !== id)
        : prev.map((item) => (item.id === id ? { ...item, quantity: Math.min(9, quantity) } : item)),
    );
  }, []);

  const clear = useCallback(() => setItems([]), []);

  const valeur = useMemo<CartApi>(
    () => ({
      items,
      count: items.reduce((somme, item) => somme + item.quantity, 0),
      totalCents: items.reduce((somme, item) => somme + item.snapshot.priceCents * item.quantity, 0),
      ready,
      isOpen,
      open: () => setOpen(true),
      close: () => setOpen(false),
      add,
      remove,
      setQuantity,
      clear,
    }),
    [items, ready, isOpen, add, remove, setQuantity, clear],
  );

  return <Contexte.Provider value={valeur}>{children}</Contexte.Provider>;
}

export function useCart(): CartApi {
  const api = useContext(Contexte);
  if (!api) throw new Error("useCart doit être utilisé à l'intérieur de <CartProvider>.");
  return api;
}
