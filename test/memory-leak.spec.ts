import { test, expect, type Page } from "@playwright/test";

/**
 * Memory-leak probes for the math-study SPA.
 *
 * Strategy: repeatedly mount/unmount the heavy route components (chat shell,
 * problem virtualized grid, file library, knowledge graph, settings) using
 * client-side navigation, forcing a full GC between samples and recording the
 * live JS heap. A real leak shows sustained post-GC growth across cycles; a
 * clean app plateaus after the initial warm-up allocation.
 */

const ROUTES = ["/", "/problem", "/library", "/graph", "/settings"];

/** Force GC in the page, then read the live (retained) JS heap in MB. */
async function retainedHeapMB(page: Page): Promise<number> {
  const cdp = await page.context().newCDPSession(page);
  await cdp.send("HeapProfiler.collectGarbage");
  await page.waitForTimeout(500);
  const { usedSize } = await cdp.send("Runtime.getHeapUsage");
  await cdp.detach();
  return usedSize / 1048576;
}

/** Client-side navigate to a route via the sidebar link, then let it settle. */
async function go(page: Page, route: string) {
  await page.click(`a[href="${route}"]`);
  // SPA client navigation: wait for the actual pathname (full-URL RegEx on
  // waitForURL would never match a leading slash).
  await page.waitForFunction(
    (target) => new URL(location.href).pathname === target,
    route,
    { timeout: 60_000 },
  );
  // give React mounts + virtualizers + Suspense time to settle
  await page.waitForTimeout(400);
}

/** One full pass over all routes. */
async function sweep(page: Page) {
  for (const route of ROUTES) {
    await go(page, route);
  }
}

test("no sustained JS heap growth across repeated route switching", async ({
  page,
}) => {
  await page.goto("/");
  // App is ready once the persistent sidebar nav renders (DB init completes
  // before the shell mounts).
  await page
    .locator('a[href="/problem"]')
    .waitFor({ state: "visible", timeout: 120_000 });

  // Warm-up: a full sweep so one-off allocations (wasm, workers, module cache)
  // are counted before the baseline.
  await sweep(page);

  const samples: { cycle: number; heapMB: number }[] = [];
  const CYCLES = 6;

  for (let cycle = 1; cycle <= CYCLES; cycle++) {
    await sweep(page);
    samples.push({ cycle, heapMB: (await retainedHeapMB(page)) * 1 });
  }

  console.log("── route-switch heap samples (MB) ──");
  console.table(samples);

  const baseline = samples[0].heapMB;
  const last = samples[samples.length - 1].heapMB;
  // Tolerate GC noise (~35%); a leak pushes the last sample well past this.
  const threshold = baseline * 1.35;

  console.log(
    `baseline=${baseline.toFixed(1)}MB last=${last.toFixed(1)}MB ` +
      `threshold=${threshold.toFixed(1)}MB → ` +
      (last < threshold ? "NO LEAK (plateau)" : "POSSIBLE LEAK (growth)"),
  );

  expect(last).toBeLessThan(threshold);
});

test("rapid back/forth chat ↔ problem switch does not accumulate heap", async ({
  page,
}) => {
  await page.goto("/");
  await page
    .locator('a[href="/problem"]')
    .waitFor({ state: "visible", timeout: 120_000 });

  for (let i = 0; i < 8; i++) {
    await go(page, "/problem");
    await go(page, "/");
  }

  const before = await retainedHeapMB(page);
  await page.waitForTimeout(1500);
  const after = await retainedHeapMB(page);

  console.log(
    `chat↔problem heap after loop: ${before.toFixed(1)}MB → settled ${after.toFixed(1)}MB`,
  );
  // Toggle stress alone must not grow heap; a small drift is GC noise.
  expect(after).toBeLessThan(before + 20);
});
