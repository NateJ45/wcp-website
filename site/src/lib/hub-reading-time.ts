// =============================================================================
// hub-reading-time.ts — an honest "X min read" estimate for a handbook page
// =============================================================================
// The class handbooks / Getting Started are long editorial pages; a reading-time
// hint in the header sets expectations the way a real docs surface does. We only
// count the text a family actually READS — section headings/leads, prose bodies,
// and FAQ question/answer pairs — and deliberately skip scannable blocks
// (schedules, step lists, tables, card grids): those are looked up, not read, so
// counting them would inflate the number. Pure function → unit-tested.
// =============================================================================
import { portableTextToPlain } from '@/lib/portable-text';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Section = Record<string, any>;

const WORDS_PER_MINUTE = 200; // comfortable adult prose pace

function countWords(text: string): number {
  const t = text.trim();
  return t ? t.split(/\s+/).length : 0;
}

/** Total readable words across a section run (headings + prose + FAQ text). */
export function readableWordCount(sections: Section[] | undefined): number {
  if (!sections?.length) return 0;
  let words = 0;
  for (const s of sections) {
    if (!s) continue;
    if (s.header?.title) words += countWords(s.header.title);
    if (s.header?.lead) words += countWords(s.header.lead);
    // proseSection body (Portable Text)
    if (Array.isArray(s.body)) words += countWords(portableTextToPlain(s.body));
    // faqSection items: question (string) + answer (Portable Text)
    if (Array.isArray(s.items)) {
      for (const qa of s.items) {
        if (!qa) continue;
        if (typeof qa.question === 'string') words += countWords(qa.question);
        if (Array.isArray(qa.answer)) words += countWords(portableTextToPlain(qa.answer));
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
