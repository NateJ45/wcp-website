import { expect, test } from '@playwright/test';
import { routes } from './routes';

// =============================================================================
// Seam colour continuity
// =============================================================================
// A seam is a sweep that lets one band arc into the next. Its filled side is
// painted with a band's OWN colour, so if the code computing that fill and the
// code deciding what actually renders ever disagree, you get a wedge of the
// wrong colour at the boundary — which is exactly what happened: `finalBandBg`
// re-implemented a PARTIAL copy of the doctrine pipeline (drops and appends,
// but not hoists or inserts), so on /enroll the footer seam painted grey
// against a cream band (Nathan, 2026-07-20).
//
// Both now go through applyDoctrine(). These tests are the alarm that was
// missing: they compare painted colours in the browser, so they fail on ANY
// future divergence, including ones introduced in Sanity content rather than
// in code.
// =============================================================================

/** Resolve a `fill` attribute (often `var(--color-x)`) to a real rgb string. */
async function resolveFill(page: import('@playwright/test').Page, fill: string) {
  return page.evaluate((f) => {
    const probe = document.createElement('div');
    probe.style.color = f;
    document.body.appendChild(probe);
    const v = getComputedStyle(probe).color;
    probe.remove();
    return v;
  }, fill);
}

test.describe('Footer seam continues the last band', () => {
  for (const route of routes) {
    test(`${route} footer seam matches the band above it`, async ({ page }) => {
      await page.goto(route, { waitUntil: 'load' });

      const fillAttr = await page.locator('footer svg path[fill]').first().getAttribute('fill');
      test.skip(!fillAttr, 'no footer seam on this route');

      const seamColor = await resolveFill(page, fillAttr!);

      // The band whose bottom edge actually meets the footer.
      const lastBand = await page.evaluate(() => {
        const footer = document.querySelector('footer');
        if (!footer) return null;
        const footerTop = footer.getBoundingClientRect().top + window.scrollY;
        const bands = [...document.querySelectorAll('main section, main nav')]
          .map((el) => {
            const r = el.getBoundingClientRect();
            return { el, bottom: r.bottom + window.scrollY, h: r.height };
          })
          .filter((b) => b.h > 40)
          .sort((a, b) => a.bottom - b.bottom);
        const last = bands[bands.length - 1];
        if (!last) return null;
        return {
          bg: getComputedStyle(last.el).backgroundColor,
          cls: String(last.el.className).slice(0, 80),
          touches: Math.abs(last.bottom - footerTop) < 4,
        };
      });

      test.skip(!lastBand, 'no bands on this route');

      // Only meaningful when the band genuinely abuts the footer.
      test.skip(!lastBand!.touches, 'last band does not meet the footer');

      expect(
        lastBand!.bg,
        `footer seam paints ${seamColor} but the band it continues (${lastBand!.cls}) is ${lastBand!.bg}`,
      ).toBe(seamColor);
    });
  }
});

test.describe('Section seams continue their own band', () => {
  for (const route of routes) {
    test(`${route} section seams match their band`, async ({ page }) => {
      await page.goto(route, { waitUntil: 'load' });

      const seams = page.locator('.wcp-seam');
      const count = await seams.count();
      test.skip(count === 0, 'no section seams on this route');

      const bad: string[] = [];
      for (let i = 0; i < count; i++) {
        const svg = seams.nth(i);
        const fillAttr = await svg.locator('path[fill]').first().getAttribute('fill');
        if (!fillAttr || fillAttr === 'none') continue;
        const seamColor = await resolveFill(page, fillAttr);
        const bandBg = await svg.evaluate(
          (el) => getComputedStyle(el.parentElement as HTMLElement).backgroundColor,
        );
        if (bandBg !== seamColor) bad.push(`seam ${i}: fill ${seamColor} vs band ${bandBg}`);
      }

      expect(bad, `seam/band colour mismatches:\n${bad.join('\n')}`).toEqual([]);
    });
  }
});
