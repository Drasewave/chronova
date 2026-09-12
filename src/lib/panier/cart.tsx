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
import { buildConfiguration, type Configuration } from "@/lib/configurateur/configuration";
import { decodeConfig } from "@/lib/configurateur/url";
import { getSampleModel, type SampleModel } from "@/lib/data/models";

const CLE = "chronova:panier";

/**
 * Une ligne de panier ne stocke QUE la référence de la configuration : le modèle
 * et le paramètre de partage. Prix, rendu et nomenclature sont recalculés à la
 * lecture par `buildConfiguration`, donc toujours cohérents avec le catalogue.
 *
 * Au paiement (phase 4), le serveur figera un instantané : c'est à ce moment-là,
 * et seulement là, que le prix cesse de suivre le catalogue.
 */
export interface CartItem {
  id: string;
  modelSlug: string;
  shareParam: string;
  quantity: number;
}

export interface CartLine extends CartItem {
  model: SampleModel;
  configuration: Configuration;
}

interface CartApi {
  lines: CartLine[];
  count: number;
  totalCents: number;
  ready: boolean;
  isOpen: boolean;
  open: () => void;
  close: () => void;
  add: (modelSlug: string, shareParam: string) => void;
  remove: (id: string) => void;
  setQuantity: (id: string, quantity: number) => void;
}

const Contexte = createContext<CartApi | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [ready, setReady] = useState(false);
  const [isOpen, setOpen] = useState(false);

  useEffect(() => {
    try {
      const brut = localStorage.getItem(CLE);
      if (brut) setItems(JSON.parse(brut) as CartItem[]);
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

  const add = useCallback((modelSlug: string, shareParam: string) => {
    setItems((prev) => {
      const existante = prev.find((item) => item.modelSlug === modelSlug && item.shareParam === shareParam);
      if (existante) {
        return prev.map((item) =>
          item.id === existante.id ? { ...item, quantity: item.quantity + 1 } : item,
        );
      }
      return [
        ...prev,
        { id: `${modelSlug}-${Date.now().toString(36)}`, modelSlug, shareParam, quantity: 1 },
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
        : prev.map((item) => (item.id === id ? { ...item, quantity } : item)),
    );
  }, []);

  const lines = useMemo(() => {
    return items.flatMap((item) => {
      const model = getSampleModel(item.modelSlug);
      if (!model) return [];
      return [{ ...item, model, configuration: buildConfiguration(model, decodeConfig(item.shareParam)) }];
    });
  }, [items]);

  const valeur = useMemo<CartApi>(
    () => ({
      lines,
      count: lines.reduce((somme, ligne) => somme + ligne.quantity, 0),
      totalCents: lines.reduce(
        (somme, ligne) => somme + ligne.configuration.price.totalCents * ligne.quantity,
        0,
      ),
      ready,
      isOpen,
      open: () => setOpen(true),
      close: () => setOpen(false),
      add,
      remove,
      setQuantity,
    }),
    [lines, ready, isOpen, add, remove, setQuantity],
  );

  return <Contexte.Provider value={valeur}>{children}</Contexte.Provider>;
}

export function useCart(): CartApi {
  const api = useContext(Contexte);
  if (!api) throw new Error("useCart doit être utilisé à l'intérieur de <CartProvider>.");
  return api;
}
