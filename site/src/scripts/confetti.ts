// ============================================================================
// Confetti burst
// ============================================================================
// A little star + circle burst on hover of any [data-confetti] element (the
// testimonial cards). Purely delightful, never essential. Carried over from the
// old site's canvas burst, rebuilt cleanly:
//   - fully skipped under prefers-reduced-motion
//   - a cooldown so rapid hovers don't spam bursts
//   - the canvas is aria-hidden + pointer-events:none and removes itself
//   - re-binds on each View Transition navigation via onPageLoad
// ============================================================================
import { onPageLoad } from './_page-load';

const COLORS = ['#ffa334', '#ffd700', '#ff8c00', '#40aaed', '#22c55e', '#ffffff'];
const COOLDOWN_MS = 2500;
let lastBurst = 0;

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  star: boolean;
  rot: number;
  vr: number;
}

function drawStar(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, rot: number) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  ctx.beginPath();
  for (let i = 0; i < 5; i++) {
    const a = (i * 4 * Math.PI) / 5 - Math.PI / 2;
    const fn = i === 0 ? 'moveTo' : 'lineTo';
    ctx[fn](Math.cos(a) * size, Math.sin(a) * size);
  }
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function burst(origin: HTMLElement) {
  const rect = origin.getBoundingClientRect();
  const canvas = document.createElement('canvas');
  canvas.setAttribute('aria-hidden', 'true');
  canvas.style.cssText =
    'position:fixed;inset:0;width:100vw;height:100vh;pointer-events:none;z-index:9999;';
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  document.body.appendChild(canvas);

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    canvas.remove();
    return;
  }

  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;
  const particles: Particle[] = [];

  for (let i = 0; i < 46; i++) {
    const angle = (i / 46) * Math.PI * 2;
    const radius = Math.random() * (rect.width / 2);
    const px = cx + Math.cos(angle) * radius * 0.65;
    const py = cy + Math.sin(angle) * radius * 0.45;
    const out = Math.atan2(py - cy, px - cx);
    particles.push({
      x: px,
      y: py,
      vx: Math.cos(out) * (Math.random() * 2 + 1),
      vy: Math.sin(out) * (Math.random() * 2 + 1) - 1.5,
      size: Math.random() * 4 + 2,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      alpha: 1,
      star: Math.random() > 0.45,
      rot: Math.random() * Math.PI * 2,
      vr: (Math.random() - 0.5) * 0.2,
    });
  }

  function frame() {
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    let alive = false;
    for (const p of particles) {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.08; // gravity
      p.vx *= 0.99;
      p.alpha -= 0.012;
      p.rot += p.vr;
      if (p.alpha <= 0) continue;
      alive = true;
      ctx.globalAlpha = Math.max(0, p.alpha);
      ctx.fillStyle = p.color;
      if (p.star) {
        drawStar(ctx, p.x, p.y, p.size, p.rot);
      } else {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * 0.7, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.globalAlpha = 1;
    if (alive) requestAnimationFrame(frame);
    else canvas.remove();
  }
  requestAnimationFrame(frame);
}

function init() {
  const cards = document.querySelectorAll<HTMLElement>('[data-confetti]');
  if (!cards.length) return;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');

  const fire = (el: HTMLElement) => {
    if (reduce.matches) return;
    const now = performance.now();
    if (now - lastBurst < COOLDOWN_MS) return;
    lastBurst = now;
    burst(el);
  };

  cards.forEach((card) => {
    card.addEventListener('mouseenter', () => fire(card));
    card.addEventListener('focusin', () => fire(card));
  });
}

onPageLoad(init);

export {};
