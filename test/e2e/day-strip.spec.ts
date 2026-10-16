/**
 * Day strip scroll position must survive picking a day.
 *
 * Each SwipePager panel renders its own DayStrip, so tapping a chip swaps to a
 * different strip instance. The strip the traveler scrolled by hand must not
 * visibly jump: whatever strip is on screen after the tap has to sit at the
 * same horizontal offset as the one they tapped in.
 */

import { type Page } from "@playwright/test";
import { test, expect } from "./fixtures";

/** Horizontal offset the test scrolls the strip to before tapping. */
const SCROLLED_LEFT = 30;
/** Time allowed for any (unwanted) smooth auto-scroll to play out. */
const SETTLE_MS = 500;

/**
 * The one match for `selector` whose panel is currently on screen. Every
 * SwipePager panel renders its own copy, and the neighbours sit translated a
 * full width off to either side.
 */
function onScreen(selector: string): HTMLElement {
  const all = Array.from(document.querySelectorAll<HTMLElement>(selector));
  const hit = all.find((el) => {
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.left > -1 && r.left < window.innerWidth - 1;
  });
  if (!hit) throw new Error(`no on-screen match for ${selector}`);
  return hit;
}

/** The day strip of the panel currently on screen. */
function onScreenStrip(): HTMLElement {
  const all = Array.from(
    document.querySelectorAll<HTMLElement>('[data-testid="day-strip"]'),
  );
  const hit = all.find((el) => {
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.left > -1 && r.left < window.innerWidth - 1;
  });
  if (!hit) throw new Error("no on-screen day strip");
  return hit;
}

async function readScrollLeft(page: Page): Promise<number> {
  return page.evaluate(
    // eslint-disable-next-line @typescript-eslint/no-implied-eval
    `(${onScreenStrip.toString()})().scrollLeft`,
  );
}

async function setScrollLeft(page: Page, left: number) {
  await page.evaluate(`(${onScreenStrip.toString()})().scrollLeft = ${left}`);
  await expect.poll(() => readScrollLeft(page)).toBe(left);
}

async function tapChip(page: Page, index: number) {
  await page.evaluate(
    `(${onScreenStrip.toString()})().querySelectorAll("button")[${index}].click()`,
  );
}

test.describe("day strip keeps its scroll position", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/harness.html");
    await expect(page.locator("#app-viewport")).toBeVisible();
    await expect(page.getByText("Day 1 of 8")).toBeVisible();

    // Precondition: the strip actually overflows, else the test proves nothing.
    const overflow = await page.evaluate(
      `(() => { const s = (${onScreenStrip.toString()})(); return s.scrollWidth - s.clientWidth; })()`,
    );
    expect(overflow).toBeGreaterThan(SCROLLED_LEFT);
  });

  test("tapping a far day keeps the hand-scrolled offset", async ({ page }) => {
    await setScrollLeft(page, SCROLLED_LEFT);

    await tapChip(page, 4); // day 5 — not a pre-rendered neighbour panel
    await expect(page.getByText("Day 5 of 8")).toBeVisible();
    await page.waitForTimeout(SETTLE_MS);

    expect(await readScrollLeft(page)).toBeCloseTo(SCROLLED_LEFT, 0);
  });

  test("tapping the adjacent day keeps the hand-scrolled offset", async ({
    page,
  }) => {
    await setScrollLeft(page, SCROLLED_LEFT);

    await tapChip(page, 1); // day 2 — already mounted as the next panel
    await expect(page.getByText("Day 2 of 8")).toBeVisible();
    await page.waitForTimeout(SETTLE_MS);

    expect(await readScrollLeft(page)).toBeCloseTo(SCROLLED_LEFT, 0);
  });

  test("still nudges a chip into view once it drifts past the edge", async ({
    page,
  }) => {
    // Step to the last day with the chevron; its chip starts off-screen, so
    // the strip has to scroll (and not stay pinned at the remembered 0).
    for (let d = 2; d <= 8; d++) {
      await page.evaluate(
        `(${onScreen.toString()})('button[aria-label="Next day"]').click()`,
      );
      await expect(page.getByText(`Day ${d} of 8`)).toBeVisible();
    }
    await expect.poll(() => readScrollLeft(page)).toBeGreaterThan(0);

    const lastChipInView = await page.evaluate(
      `(() => {
        const s = (${onScreenStrip.toString()})();
        const chips = s.querySelectorAll("button");
        const r = chips[chips.length - 1].getBoundingClientRect();
        const sr = s.getBoundingClientRect();
        return r.left >= sr.left && r.right <= sr.right;
      })()`,
    );
    expect(lastChipInView).toBe(true);
  });
});
