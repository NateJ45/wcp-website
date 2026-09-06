// ============================================================================
// hub-celebrate — a one-time confetti burst when a family reaches a milestone
// ============================================================================
// Reuses the existing celebrate() burst (scripts/confetti.ts) for the genuinely
// joyful, EARNED moments a co-op has: a family hitting its co-op-hours goal, the
// school crossing its fundraising goal. The milestone element carries:
//   data-celebrate               — fire when it first scrolls into view
//   data-celebrate-once="<id>"   — (optional) fire only ONCE per browser for
//                                  this id, so a persistent "goal met" state
//                                  celebrates the achievement without nagging on
//                                  every later visit. The id encodes the goal
//                                  (e.g. hours-Nixon-30, fund-year-5700) so a
//                                  genuinely NEW goal re-earns its burst.
// Reduced-motion users get nothing (celebrate() no-ops). Progressive
// enhancement: no JS just shows the static goal-met state. View-Transitions
// safe via onPageLoad; fires from the element's own position so the burst lands
// where the achievement is, not off-screen.
// ============================================================================
import { onPageLoad } from './_page-load';
import { celebrate } from './confetti';

function init() {
  const els = Array.from(document.querySelectorAll<HTMLElement>('[data-celebrate]'));
  if (!els.length || !('IntersectionObserver' in window)) return;

  let store: Storage | null = null;
  try {
    store = window.localStorage;
  } catch {
    store = null; // private mode — celebrations just aren't remembered
  }

  const io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        const el = entry.target as HTMLElement;
        io.unobserve(el);

        const onceId = el.dataset.celebrateOnce;
        const key = onceId ? `wcp-celebrated:${onceId}` : '';
        if (key) {
          try {
            if (store?.getItem(key)) continue; // already celebrated this milestone
          } catch {
            /* ignore */
          }
        }
        // A short beat so the burst lands after the card has settled in view.
        window.setTimeout(() => celebrate(el), 350);
        if (key) {
          try {
            store?.setItem(key, '1');
          } catch {
            /* ignore */
          }
        }
      }
    },
    { threshold: 0.6 },
  );

  els.forEach((el) => io.observe(el));
}

onPageLoad(init);
