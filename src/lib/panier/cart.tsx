"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { SummaryLine } from "@/lib/configurateur/configuration";
import { bornerQuantite } from "./quantite";
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
  /** Dernière ligne retirée, restaurable quelques secondes. */
  retire: { item: CartItem } | null;
  annulerRetrait: () => void;
  setQuantity: (id: string, quantity: number) => void;
  clear: () => void;
}

const DELAI_ANNULATION_MS = 6000;

const Contexte = createContext<CartApi | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [ready, setReady] = useState(false);
  const [isOpen, setOpen] = useState(false);
  const [retire, setRetire] = useState<{ item: CartItem; index: number } | null>(null);
  const minuteur = useRef<number | undefined>(undefined);

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
          item.id === existante.id ? { ...item, quantity: bornerQuantite(item.quantity + 1, item.quantity) } : item,
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

  const remove = useCallback(
    (id: string) => {
      const index = items.findIndex((item) => item.id === id);
      const item = items[index];
      if (!item) return;
      setItems((prev) => prev.filter((item) => item.id !== id));
      setRetire({ item, index });
      window.clearTimeout(minuteur.current);
      minuteur.current = window.setTimeout(() => setRetire(null), DELAI_ANNULATION_MS);
    },
    [items],
  );

  const annulerRetrait = useCallback(() => {
    if (!retire) return;
    window.clearTimeout(minuteur.current);
    setItems((prev) =>
      prev.some((item) => item.id === retire.item.id)
        ? prev
        : [...prev.slice(0, retire.index), retire.item, ...prev.slice(retire.index)],
    );
    setRetire(null);
  }, [retire]);

  /**
   * Ne supprime JAMAIS une ligne (audit A-02) : une quantité vide, nulle ou
   * invalide laisse la ligne telle quelle. Retirer une montre = `remove`.
   */
  const setQuantity = useCallback((id: string, quantity: number) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, quantity: bornerQuantite(quantity, item.quantity) } : item,
      ),
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
      retire: retire && { item: retire.item },
      annulerRetrait,
      setQuantity,
      clear,
    }),
    [items, ready, isOpen, add, remove, retire, annulerRetrait, setQuantity, clear],
  );

  return <Contexte.Provider value={valeur}>{children}</Contexte.Provider>;
}

export function useCart(): CartApi {
  const api = useContext(Contexte);
  if (!api) throw new Error("useCart doit être utilisé à l'intérieur de <CartProvider>.");
  return api;
}
