import { onPageLoad } from './_page-load';

// =============================================================================
// Tuition calculator — live total as the visitor ticks classes
// =============================================================================
// Prices are baked into the markup as data-* numbers (from Classes + Tuition &
// Fees). This just sums the checked ones: monthly tuition, the one-time start
// fees (added once when at least one class is picked), and yearly student fees.
// No-JS visitors still see every class and its price.
// =============================================================================
const money = (n: number) => `$${Math.round(n).toLocaleString('en-US')}`;

onPageLoad(() => {
  const root = document.querySelector<HTMLElement>('[data-tuition-calc]');
  if (!root) return;

  const boxes = Array.from(root.querySelectorAll<HTMLInputElement>('[data-calc-class]'));
  const oneTime = Number(root.dataset.onetime ?? '0');
  const outMonthly = root.querySelector<HTMLElement>('[data-calc-monthly]');
  const outOneTime = root.querySelector<HTMLElement>('[data-calc-onetime]');
  const outStudent = root.querySelector<HTMLElement>('[data-calc-studentfee]');
  const empty = root.querySelector<HTMLElement>('[data-calc-empty]');

  const recalc = () => {
    let monthly = 0;
    let student = 0;
    let any = false;
    for (const box of boxes) {
      if (!box.checked) continue;
      any = true;
      monthly += Number(box.dataset.monthly ?? '0');
      student += Number(box.dataset.studentfee ?? '0');
    }
    if (outMonthly) outMonthly.textContent = money(monthly);
    if (outOneTime) outOneTime.textContent = money(any ? oneTime : 0);
    if (outStudent) outStudent.textContent = money(student);
    if (empty) empty.hidden = any;
  };

  boxes.forEach((b) => b.addEventListener('change', recalc));
  recalc();
});
