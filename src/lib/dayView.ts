import type { Day, Item } from "../types";
import { ACC, SOFT } from "./ui";
import { fallbackImage } from "./ids";
import { localizeItem } from "./localize";

export interface ViewItem {
  item: Item;
  index: number;
  title: string;
  place: string;
  thumb: string;
  accent: string;
  soft: string;
  tag: string;
  isLast: boolean;
}

/** Image for an item, falling back to a deterministic placeholder. */
export function imgFor(item: Item, w = 320, h = 240): string {
  const url = item.image?.trim();
  return url ? url : fallbackImage(item.title, w, h);
}

/**
 * Build the day's display items, applying the chosen language's translations
 * where available.
 */
export function buildViewItems(day: Day, lang: string): ViewItem[] {
  const items = day.items ?? [];
  return items.map((raw, index) => {
    const item = localizeItem(raw, lang);
    return {
      item,
      index,
      title: item.title,
      place: item.place ?? "",
      thumb: imgFor(item),
      accent: ACC[item.kind],
      soft: SOFT[item.kind],
      tag: item.tag ?? "",
      isLast: index === items.length - 1,
    };
  });
}
