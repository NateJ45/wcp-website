// =============================================================================
// hub-reading-time.ts — an honest "X min read" estimate for a handbook page
// =============================================================================
// The class handbooks / Getting Started are long editorial pages; a reading-time
// hint in the header sets expectations the way a real docs surface does. We count
// the text a family actually READS: section headings/leads, prose bodies, FAQ
// pairs, AND the sentence-bearing fields of cards / steps / schedule entries —
// these pages are BUILT of card grids and checklists, so skipping them (the
// original rule) put "2 min read" on a page that runs past 10,000px (2026-07-16
// audit). Pure lookup values (times, prices, stat values, link labels) still
// don't count — those are scanned, not read. Pure function → unit-tested.
// =============================================================================
import { portableTextToPlain } from '@/lib/portable-text';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Section = Record<string, any>;

const WORDS_PER_MINUTE = 200; // comfortable adult prose pace

// The repeating-item arrays a section can carry, and the item fields that hold
// read-through text (string or Portable Text). `time`, `statValue`, `linkLabel`
// and friends are deliberately absent — lookup values, not reading.
const ITEM_ARRAYS = ['cards', 'entries', 'steps', 'rows', 'items'] as const;
const ITEM_TEXT_KEYS = ['title', 'body', 'description', 'note', 'text', 'question', 'answer'];

function countWords(text: string): number {
  const t = text.trim();
  return t ? t.split(/\s+/).length : 0;
}

function countValue(v: unknown): number {
  if (typeof v === 'string') return countWords(v);
  if (Array.isArray(v)) return countWords(portableTextToPlain(v as never));
  return 0;
}

/** Total readable words across a section run (headings, prose, item text). */
export function readableWordCount(sections: Section[] | undefined): number {
  if (!sections?.length) return 0;
  let words = 0;
  for (const s of sections) {
    if (!s) continue;
    if (s.header?.title) words += countWords(s.header.title);
    if (s.header?.lead) words += countWords(s.header.lead);
    // proseSection body (Portable Text)
    if (Array.isArray(s.body)) words += countWords(portableTextToPlain(s.body));
    // Repeating items: cards, checklist steps, schedule entries, FAQ pairs.
    for (const key of ITEM_ARRAYS) {
      const arr = s[key];
      if (!Array.isArray(arr)) continue;
      for (const item of arr) {
        if (!item || typeof item !== 'object') continue;
        for (const k of ITEM_TEXT_KEYS) words += countValue(item[k]);
      }
    }
  }
  return words;
}

/** Minutes to read a section run, rounded up (min 1 when there's any text). */
export function estimateReadMinutes(sections: Section[] | undefined): number {
  const words = readableWordCount(sections);
  if (words === 0) return 0;
  return Math.max(1, Math.round(words / WORDS_PER_MINUTE));
}
