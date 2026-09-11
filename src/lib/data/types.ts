export type { WatchRender } from "@/watch/types";

export type WatchStyleKey = "plongee" | "terrain" | "gmt" | "habillee";

export const STYLE_LABELS: Record<WatchStyleKey, string> = {
  plongee: "Plongée",
  terrain: "Terrain",
  gmt: "GMT",
  habillee: "Habillée",
};
