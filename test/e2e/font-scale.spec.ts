/**
 * Layout validation: assert that no screen overflows its 440 px column at any
 * of the three traveler font-scale steps (standard / large / x-large).
 *
 * The test harness mounts the real TravelerApp with the chinaTrip seed data at
 * http://localhost:5173/harness.html (see harness.html + test/harness/main.tsx).
 *
 * Strategy
 * --------
 * - Set `localStorage["yl:fontScale"]` in an initScript so `useFontScale` picks
 *   up the desired step on first render (avoids a post-hydration override race).
 * - Also write `--font-scale` directly to `document.documentElement` as an
 *   early hint before React hydrates (belt-and-suspenders).
 * - For each scale, exercise: day list → Settings → Help → activity detail.
 * - On each screen, assert that the #app-viewport root doesn't overflow (the
 *   primary check) and that no element with uncontained overflow-x:visible has
 *   scrollWidth > clientWidth + 1 (secondary diagnostic check, excludes elements
 *   whose overflow is already visually clipped by an ancestor).
 */

import { test, expect, type Page } from "@playwright/test";

const SCALES = [
  { step: "standard", value: 1 },
  { step: "large", value: 1.15 },
  { step: "xlarge", value: 1.3 },
] as const;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function gotoAtScale(page: Page, step: string, value: number) {
  await page.addInitScript(
    ({ s, v }: { s: string; v: number }) => {
      // Prime localStorage so useFontScale() initialises at the right step.
      localStorage.setItem("yl:fontScale", s);
      // Belt-and-suspenders: set the CSS variable before React hydrates so
      // the first paint is already at the target scale.
      document.documentElement.style.setProperty("--font-scale", String(v));
    },
    { s: step, v: value },
  );
  await page.goto("/harness.html");
  await expect(page.locator("#app-viewport")).toBeVisible();
}

async function expectNoHorizontalOverflow(page: Page, label: string) {
  const overflow = await page.evaluate(() => {
    const root = document.getElementById("app-viewport")!;
    const bad: string[] = [];

    /**
     * Returns true when any ancestor between `el` and the root has a computed
     * overflow-x that is not "visible" (hidden / auto / scroll / clip). Such an
     * ancestor clips horizontal overflow before it can escape to the user, so
     * the element's own scrollWidth > clientWidth is not a visible layout bug.
     * This avoids false positives from the SwipePager carousel (its outer div
     * has overflow-x:hidden which clips the off-screen panel at translateX(100%)).
     */
    function isContainedByAncestor(el: HTMLElement): boolean {
      let node: HTMLElement | null = el.parentElement;
      while (node && node !== root) {
        if (window.getComputedStyle(node).overflowX !== "visible") return true;
        node = node.parentElement;
      }
      return false;
    }

    root.querySelectorAll<HTMLElement>("*").forEach((el) => {
      // Skip zero-width / zero-height elements (off-screen, hidden, or collapsed).
      if (el.clientWidth === 0 || el.clientHeight === 0) return;
      const ox = window.getComputedStyle(el).overflowX;
      // Skip elements that manage their own overflow (not overflow:visible).
      // Includes hidden (text-overflow:ellipsis), auto/scroll (intentional
      // scrollers like DayStrip), and clip.
      if (ox !== "visible") return;
      // Skip elements whose overflow is already contained by an ancestor's
      // clip/hidden overflow — those overflows are not user-visible.
      if (isContainedByAncestor(el)) return;
      if (el.scrollWidth > el.clientWidth + 1) {
        const id = el.id ? `#${el.id}` : "";
        const cls = [...el.classList].filter(Boolean).slice(0, 4).join(".");
        bad.push(`${el.tagName}${id}.${cls}`.slice(0, 100));
      }
    });
    return {
      rootScroll: root.scrollWidth,
      rootClient: root.clientWidth,
      offenders: bad.slice(0, 10),
    };
  });

  expect(
    overflow.rootScroll,
    `[${label}] root element overflows: ${JSON.stringify(overflow)}`,
  ).toBeLessThanOrEqual(overflow.rootClient + 1);

  expect(
    overflow.offenders,
    `[${label}] elements with scrollWidth > clientWidth: ${JSON.stringify(overflow.offenders)}`,
  ).toEqual([]);
}

// ---------------------------------------------------------------------------
// Tests — one per scale, each covering all four traveler screens
// ---------------------------------------------------------------------------

for (const { step, value } of SCALES) {
  test(`no horizontal overflow — ${step} (${value}×)`, async ({
    page,
  }, testInfo) => {
    await gotoAtScale(page, step, value);

    // --- Day list (initial screen) ------------------------------------------
    // Wait for at least one activity card to be rendered.
    await expect(
      page.locator("button").filter({ hasText: "Land at CAN" }).first(),
    ).toBeVisible();
    await expectNoHorizontalOverflow(page, `${step}/day-list`);
    await page.screenshot({
      path: testInfo.outputPath(`${step}-day-list.png`),
    });

    // --- Settings screen -----------------------------------------------------
    // The Settings tab button label is "Settings" (text inside the <span>).
    await page.getByRole("button", { name: "Settings" }).click();
    // Wait for a Settings-only element: the "Text size" section label.
    await expect(page.getByText("Text size").first()).toBeVisible();
    await expectNoHorizontalOverflow(page, `${step}/settings`);
    await page.screenshot({
      path: testInfo.outputPath(`${step}-settings.png`),
    });

    // --- Help screen ---------------------------------------------------------
    await page.getByRole("button", { name: "Help" }).click();
    // Wait for a Help-only element: the subtitle beneath the "Help" heading.
    await expect(
      page.getByText("Contacts & useful phrases").first(),
    ).toBeVisible();
    await expectNoHorizontalOverflow(page, `${step}/help`);
    await page.screenshot({
      path: testInfo.outputPath(`${step}-help.png`),
    });

    // --- Activity detail screen ----------------------------------------------
    // Navigate back to the day list first.
    await page.getByRole("button", { name: "Today" }).click();
    await expect(
      page.locator("button").filter({ hasText: "Land at CAN" }).first(),
    ).toBeVisible();
    // Tap the first activity card (day 0 of the chinaTrip seed).
    await page
      .locator("button")
      .filter({ hasText: "Land at CAN" })
      .first()
      .click();
    // The detail screen shows a "Back" button (aria-label in DetailShell).
    await expect(page.getByRole("button", { name: "Back" })).toBeVisible();
    await expectNoHorizontalOverflow(page, `${step}/activity-detail`);
    await page.screenshot({
      path: testInfo.outputPath(`${step}-activity-detail.png`),
    });

    // --- Flight detail screen ------------------------------------------------
    // Go back to the day view, then tap the flight card (CZ 350 on day 0).
    await page.getByRole("button", { name: "Back" }).click();
    await expect(
      page.locator("button").filter({ hasText: "CZ 350" }).first(),
    ).toBeVisible();
    await page
      .locator("button")
      .filter({ hasText: "CZ 350" })
      .first()
      .click();
    await expect(page.getByRole("button", { name: "Back" })).toBeVisible();
    await expectNoHorizontalOverflow(page, `${step}/flight-detail`);
    await page.screenshot({
      path: testInfo.outputPath(`${step}-flight-detail.png`),
    });

    // --- Stay detail screen --------------------------------------------------
    // Go back to the day view, then tap the accommodation card.
    await page.getByRole("button", { name: "Back" }).click();
    await expect(
      page.locator("button").filter({ hasText: "Where you're staying" }).first(),
    ).toBeVisible();
    await page
      .locator("button")
      .filter({ hasText: "Where you're staying" })
      .first()
      .click();
    await expect(page.getByRole("button", { name: "Back" })).toBeVisible();
    await expectNoHorizontalOverflow(page, `${step}/stay-detail`);
    await page.screenshot({
      path: testInfo.outputPath(`${step}-stay-detail.png`),
    });
  });
}
