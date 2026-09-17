export type { WatchRender } from "@/watch/types";

export type WatchStyleKey = "plongee" | "terrain" | "gmt" | "habillee" | "chronographe";

export const STYLE_LABELS: Record<WatchStyleKey, string> = {
  plongee: "Plongée",
  terrain: "Pilote",
  gmt: "GMT",
  habillee: "Habillée",
  chronographe: "Chronographe sport",
};
