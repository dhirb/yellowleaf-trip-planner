import type { Day, Item } from "../types";
import { ACC, SOFT } from "./ui";
import { fallbackImage } from "./ids";

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
 * Build the day's display items, swapping in native-language titles when the
 * traveler has chosen the destination language (matches the prototype).
 */
export function buildViewItems(day: Day, useLocalLang: boolean): ViewItem[] {
  const items = day.items ?? [];
  return items.map((item, index) => {
    const showLocal = useLocalLang && !!item.local;
    return {
      item,
      index,
      title: showLocal ? (item.local as string) : item.title,
      place: showLocal ? item.title : item.place ?? "",
      thumb: imgFor(item),
      accent: ACC[item.kind],
      soft: SOFT[item.kind],
      tag: item.tag ?? "",
      isLast: index === items.length - 1,
    };
  });
}
