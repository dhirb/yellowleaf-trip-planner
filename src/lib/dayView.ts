import type { Day, Item } from "../types";
import { ACC, SOFT } from "./ui";
import { localizeItem } from "./localize";
import { safeImageUrl } from "./url";

export interface ViewItem {
  item: Item;
  index: number;
  title: string;
  place: string;
  /** Activity image URL, or null when the item has no thumbnail. */
  thumb: string | null;
  accent: string;
  soft: string;
  tag: string;
  isLast: boolean;
}

/**
 * The item's image URL, or null when none is set or it is not a safe `https:`
 * URL. Every render path (day list thumbnails, detail banner, admin preview)
 * goes through here, so sanitising at this chokepoint keeps unsafe values out
 * of the CSS `url("...")` backgrounds they feed.
 */
export function imgFor(item: Item): string | null {
  return safeImageUrl(item.image);
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
