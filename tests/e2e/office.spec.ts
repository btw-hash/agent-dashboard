import { test, expect, type Page } from '@playwright/test';

// The office on simulated agents, so the test does not depend on what runs on this machine.
async function open(page: Page) {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await page.goto('/?sim&debug');
  await page.waitForFunction(() => (window as any).__office?.office.P.length > 0);
  return errors;
}
const office = (page: Page, fn: string) =>
  page.evaluate(`(() => { const o = window.__office; return ${fn}; })()`);

test('the office opens with people at desks and on a break', async ({ page }) => {
  const errors = await open(page);
  const s: any = await office(
    page,
    '({ n: o.office.P.length, seated: o.office.P.filter((p) => p.seat).length, mode: o.net.mode })'
  );
  expect(s.n).toBeGreaterThan(5);
  expect(s.seated).toBeGreaterThan(0);
  expect(s.seated).toBeLessThan(s.n);
  await expect(page.locator('#count')).toContainText('working');
  await expect(page.locator('#modeTag')).toBeVisible();
  // the canvas is painted, not blank
  const colours = await page.evaluate(() => {
    const d = (window as any).__office.office.base
      .getContext('2d')
      .getImageData(0, 0, 640, 360).data;
    const seen = new Set<number>();
    for (let i = 0; i < d.length; i += 4 * 97) seen.add((d[i] << 16) | (d[i + 1] << 8) | d[i + 2]);
    return seen.size;
  });
  expect(colours).toBeGreaterThan(40);
  expect(errors).toEqual([]);
});

test('team list, agent card and TV mode', async ({ page }) => {
  const errors = await open(page);
  await page.click('#teamBtn');
  await page.locator('#list .who').first().click();
  await expect(page.locator('#card h3')).not.toBeEmpty();
  await page.click('#cx');
  await expect(page.locator('#card')).toBeHidden();
  await page.click('#tvBtn');
  await expect(page.locator('#tvcap')).toBeVisible();
  await expect(page.locator('.bar')).toHaveCSS('opacity', '0');
  await page.keyboard.press('Escape');
  await expect(page.locator('#tvcap')).toBeHidden();
  expect(errors).toEqual([]);
});

test('a game opens in the cabinet, plays and keeps its score', async ({ page }) => {
  const errors = await open(page);
  await page.click('#gamesBtn');
  await expect(page.locator('.gamelist .gm')).toHaveCount(18);
  await page.locator('.gamelist .gm', { hasText: 'Snake' }).click();
  await expect(page.locator('#cabT')).toHaveText('SNAKE');
  await page.click('#go');
  // straight into the wall
  await expect(page.locator('#slate')).toContainText('GAME OVER', { timeout: 15000 });
  const stored = await page.evaluate(() => localStorage.getItem('agent_office_scores'));
  expect(JSON.parse(stored!).Snake).toHaveLength(1);
  await page.keyboard.press('Escape');
  await expect(page.locator('.cabveil')).toBeHidden();
  expect(errors).toEqual([]);
});

test('an agent reported from outside walks in and sits down', async ({ page }) => {
  const errors = await open(page);
  await page.click('#connectBtn');
  await page.fill('#tryName', 'smoke-bot');
  await page.click('.st[data-s="working"]');
  await expect(page.locator('#tryMsg')).toContainText('smoke-bot');
  await page.click('#shX');
  await page.waitForFunction(
    () => (window as any).__office.office.P.some((p: any) => p.name === 'smoke-bot' && p.seat),
    null,
    { timeout: 30000 }
  );
  expect(errors).toEqual([]);
});

test('fits a phone', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 780 });
  const errors = await open(page);
  const over = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth);
  expect(over).toBe(false);
  await page.click('#gamesBtn');
  await page.locator('.gamelist .gm', { hasText: 'Reaction test' }).click();
  const box = await page.locator('.cab').boundingBox();
  expect(box!.x).toBeGreaterThanOrEqual(0);
  expect(box!.x + box!.width).toBeLessThanOrEqual(391);
  expect(box!.y + box!.height).toBeLessThanOrEqual(781);
  expect(errors).toEqual([]);
});
