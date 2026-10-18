/**
 * Maps in the day view. The harness mounts the china seed trip: four located
 * stays (the route), a KUL→CAN flight on day one, and a run of pinned
 * attractions and meals on day two.
 *
 * The pager keeps neighbouring days mounted, so each day's card is addressed
 * by its position among the mounted panels (ascending day order).
 */

import { test, expect } from "./fixtures";

test("day one shows the route map with one numbered pin per base", async ({
  page,
}) => {
  await page.goto("/harness.html");
  const route = page.getByTestId("route-map");
  await expect(route).toHaveCount(1);
  const pins = route.locator(".yl-pin--city");
  await expect(pins).toHaveCount(4);
  await expect(pins).toHaveText(["1", "2", "3", "4"]);
});

test("the route map is not repeated on later days", async ({ page }) => {
  await page.goto("/harness.html");
  await page.getByRole("button", { name: "Next day" }).first().click();
  // Day one stays mounted as the previous panel, so exactly one route card.
  await expect(page.getByTestId("route-map")).toHaveCount(1);
});

test("day one pins the local airport and the night's hotel", async ({
  page,
}) => {
  await page.goto("/harness.html");
  const dayMap = page.getByTestId("day-map").first();
  await expect(dayMap.locator(".yl-pin--stay")).toHaveCount(1);
  await expect(dayMap.locator(".yl-pin--airport")).toHaveCount(1);
  // Leaflet puts the title on the marker wrapper, not on our inner disc.
  await expect(
    dayMap.locator(".leaflet-marker-icon:has(.yl-pin--airport)"),
  ).toHaveAttribute("title", "Guangzhou (CAN)");
});

test("day two pins attractions and meals with their own icons", async ({
  page,
}) => {
  await page.goto("/harness.html");
  await page.getByRole("button", { name: "Next day" }).first().click();
  const dayMap = page.getByTestId("day-map").nth(1);
  await expect(dayMap.locator(".yl-pin--attraction")).toHaveCount(3);
  await expect(dayMap.locator(".yl-pin--meal")).toHaveCount(1);
  await expect(dayMap.locator(".yl-pin--stay")).toHaveCount(1);
});

test("expanding the day map opens it full screen, and a pin opens its card", async ({
  page,
}) => {
  await page.goto("/harness.html");
  await page.getByRole("button", { name: "Next day" }).first().click();
  await page.getByRole("button", { name: "Open today's map" }).nth(1).click();

  const screen = page.getByTestId("day-map-screen");
  await expect(screen).toBeVisible();
  await expect(screen.locator(".leaflet-tooltip")).toHaveCount(5);

  await screen.locator(".yl-pin--attraction").first().click();
  await expect(page.getByText("Temple of the Six Banyan Trees")).toBeVisible();
});

test("the route map expands to a full screen with a card per base", async ({
  page,
}) => {
  await page.goto("/harness.html");
  await page.getByRole("button", { name: "Open your route" }).click();
  const card = page.getByTestId("map-card");
  await expect(card).toContainText("Guangzhou");
  await page.getByRole("button", { name: "Next base" }).click();
  await expect(card).toContainText("Yangshuo");
  await page.getByRole("button", { name: "Back" }).click();
  await expect(page.getByTestId("route-map")).toBeVisible();
});
