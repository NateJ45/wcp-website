import { onPageLoad } from './_page-load';
import { formatMoney, yearCost } from '@/lib/tuition';

// =============================================================================
// Tuition calculator — live total as the visitor ticks classes
// =============================================================================
// Prices are baked into the markup as data-* numbers (from Classes + Tuition &
// Fees). This sums the checked ones and hands the arithmetic to yearCost() in
// src/lib/tuition.ts — the SAME function the class cards and the section
// itself use, so the calculator can never disagree with the prices printed a
// band above it. That module is unit-tested against the school's own published
// annual figures.
//
// Registration and the deposit are charged once per FAMILY, not per class, so
// they are added once as soon as anything is ticked rather than per checkbox.
//
// No-JS visitors still see every class and its monthly price; only the live
// totals need the script.
// =============================================================================

onPageLoad(() => {
  const root = document.querySelector<HTMLElement>('[data-tuition-calc]');
  if (!root) return;

  const boxes = Array.from(root.querySelectorAll<HTMLInputElement>('[data-calc-class]'));
  const registration = Number(root.dataset.reg ?? '0');
  const deposit = Number(root.dataset.participation ?? '0');
  const oneTime = Number(root.dataset.onetime ?? '0');

  const out = (name: string) => root.querySelector<HTMLElement>(`[data-calc-${name}]`);
  const outMonthly = out('monthly');
  const outTuition = out('tuition');
  const outOneTime = out('onetime');
  const outStudent = out('studentfee');
  const outTotal = out('total');
  const outRefund = out('refund');
  const outNet = out('net');
  const empty = root.querySelector<HTMLElement>('[data-calc-empty]');

  const set = (el: HTMLElement | null, n: number) => {
    if (el) el.textContent = formatMoney(n);
  };

  const recalc = () => {
    let monthly = 0;
    let studentFee = 0;
    let any = false;
    for (const box of boxes) {
      if (!box.checked) continue;
      any = true;
      monthly += Number(box.dataset.monthly ?? '0');
      studentFee += Number(box.dataset.studentfee ?? '0');
    }

    const cost = yearCost({
      monthly,
      studentFee,
      // Nothing ticked means nothing owed, including the one-time fees.
      registration: any ? registration : 0,
      deposit: any ? deposit : 0,
    });

    set(outMonthly, monthly);
    set(outTuition, cost.tuition);
    set(outOneTime, any ? oneTime : 0);
    set(outStudent, studentFee);
    set(outTotal, cost.total);
    set(outRefund, cost.refundable);
    set(outNet, cost.net);
    if (empty) empty.hidden = any;
  };

  boxes.forEach((b) => b.addEventListener('change', recalc));
  recalc();
});
