import type { Template } from 'sanity';

// =============================================================================
// Page "＋ New" starting points (initial-value templates)
// =============================================================================
// Clicking ＋ on Pages (or Hub pages) offers these pre-filled layouts next to
// the blank "Page" option — the Squarespace "pick a layout" moment, so a
// volunteer edits real content instead of composing from a blank canvas.
// Placeholder copy is [bracketed] so nothing reads as finished; required-but-
// empty spots (a gallery's photos) rely on their own validation message to say
// what to add before Publish. Registered in sanity.config.ts schema.templates,
// same pattern as ANNOUNCEMENT_TEMPLATES.
//
// Array items carry explicit _key values (stable strings are fine here — each
// new document gets its own copy, so the keys never collide across docs).
// =============================================================================

// One placeholder paragraph of portable text.
const para = (key: string, text: string) => ({
  _type: 'block',
  _key: key,
  style: 'normal',
  markDefs: [],
  children: [{ _type: 'span', _key: `${key}s`, marks: [], text }],
});

export const PAGE_TEMPLATES: Template[] = [
  {
    id: 'page-standard-info',
    title: 'Page: standard info page',
    description: 'Headline, a story section, common questions, and a closing invite.',
    schemaType: 'page',
    icon: () => '📄',
    value: {
      title: '[New page]',
      hero: {
        _type: 'heroObject',
        title: '[Page headline goes here]',
        lead: '[One warm sentence about what this page covers.]',
        mediaType: 'none',
        height: 'medium',
      },
      sections: [
        {
          _type: 'proseSection',
          _key: 'tpl-story',
          background: 'white',
          narrow: true,
          header: { _type: 'sectionHeader', title: '[Section heading]', align: 'center' },
          body: [
            para(
              'tpl-story-p1',
              '[Write the main story of this page here. Two or three short paragraphs is plenty.]',
            ),
          ],
        },
        {
          _type: 'faqSection',
          _key: 'tpl-faq',
          background: 'grey',
          source: 'inline',
          header: { _type: 'sectionHeader', title: 'Common questions', align: 'center' },
          inlineItems: [
            {
              _type: 'qa',
              _key: 'tpl-qa1',
              question: '[A question families often ask about this topic?]',
              answer: [para('tpl-qa1-a', '[The friendly answer.]')],
            },
            {
              _type: 'qa',
              _key: 'tpl-qa2',
              question: '[Another common question?]',
              answer: [para('tpl-qa2-a', '[The friendly answer.]')],
            },
          ],
        },
        {
          _type: 'ctaSection',
          _key: 'tpl-cta',
          tone: 'navy',
          title: 'Come see us in person',
          lead: 'The best way to know if WCP fits your family is a visit.',
        },
      ],
    },
  },
  {
    id: 'page-photo-story',
    title: 'Page: photo story page',
    description: 'A photo gallery with a big quote — for pages the pictures should carry.',
    schemaType: 'page',
    icon: () => '📸',
    value: {
      title: '[New photo page]',
      hero: {
        _type: 'heroObject',
        title: '[Page headline goes here]',
        lead: '[One line inviting people to look around.]',
        mediaType: 'none',
        height: 'medium',
      },
      sections: [
        {
          _type: 'gallerySection',
          _key: 'tpl-gallery',
          background: 'white',
          header: { _type: 'sectionHeader', title: '[A peek inside]', align: 'center' },
          // Left empty on purpose: the gallery's own "add at least one" note
          // tells the editor what this page needs before it can publish.
          photos: [],
        },
        {
          _type: 'pullQuoteSection',
          _key: 'tpl-quote',
          background: 'cream',
          quote: '[A favorite line from a parent or teacher about this.]',
          attribution: '[Who said it]',
        },
        {
          _type: 'ctaSection',
          _key: 'tpl-cta',
          tone: 'navy',
          title: 'Want to see it for yourself?',
          lead: 'Tours are casual and stroller-friendly.',
        },
      ],
    },
  },
  {
    id: 'page-event-program',
    title: 'Page: event or program page',
    description: 'Quick facts, a schedule, and how-to-join steps — for a camp, class, or event.',
    schemaType: 'page',
    icon: () => '📅',
    value: {
      title: '[New program page]',
      hero: {
        _type: 'heroObject',
        title: '[Program name goes here]',
        lead: '[One sentence on who this is for and why it is fun.]',
        mediaType: 'none',
        height: 'medium',
      },
      sections: [
        {
          _type: 'quickFactsSection',
          _key: 'tpl-facts',
          background: 'grey',
          header: { _type: 'sectionHeader', title: 'The basics', align: 'center' },
          facts: [
            {
              _type: 'fact',
              _key: 'tpl-f1',
              icon: 'users',
              value: '[Ages]',
              label: 'Who it is for',
            },
            { _type: 'fact', _key: 'tpl-f2', icon: 'clock', value: '[Times]', label: 'When' },
            {
              _type: 'fact',
              _key: 'tpl-f3',
              icon: 'circle-dollar-sign',
              value: '[Cost]',
              label: 'Cost',
            },
          ],
        },
        {
          _type: 'scheduleSection',
          _key: 'tpl-schedule',
          background: 'white',
          header: { _type: 'sectionHeader', title: 'How it flows', align: 'center' },
          entries: [
            {
              _type: 'entry',
              _key: 'tpl-s1',
              time: '[Time]',
              title: '[What happens first]',
              description: '[A detail or two.]',
            },
            {
              _type: 'entry',
              _key: 'tpl-s2',
              time: '[Time]',
              title: '[What happens next]',
            },
          ],
        },
        {
          _type: 'stepListSection',
          _key: 'tpl-steps',
          background: 'cream',
          header: { _type: 'sectionHeader', title: 'How to join', align: 'center' },
          steps: [
            { _type: 'step', _key: 'tpl-st1', title: '[First step]', body: '[What to do.]' },
            { _type: 'step', _key: 'tpl-st2', title: '[Second step]', body: '[What to do.]' },
          ],
        },
        {
          _type: 'ctaSection',
          _key: 'tpl-cta',
          tone: 'navy',
          title: '[Ready to join us?]',
          lead: '[One closing line.]',
        },
      ],
    },
  },
  {
    id: 'hub-page-info',
    title: 'Hub page: info page',
    description: 'A families-only page: a story section plus common questions.',
    schemaType: 'hubPage',
    icon: () => '🔒',
    value: {
      title: '[New hub page]',
      heading: '[Page heading goes here]',
      intro: '[One sentence about what families find on this page.]',
      sections: [
        {
          _type: 'proseSection',
          _key: 'tpl-story',
          background: 'white',
          narrow: true,
          header: { _type: 'sectionHeader', title: '[Section heading]', align: 'center' },
          body: [para('tpl-story-p1', '[Write the details families need here.]')],
        },
        {
          _type: 'faqSection',
          _key: 'tpl-faq',
          background: 'grey',
          source: 'inline',
          header: { _type: 'sectionHeader', title: 'Common questions', align: 'center' },
          inlineItems: [
            {
              _type: 'qa',
              _key: 'tpl-qa1',
              question: '[A question families often ask?]',
              answer: [para('tpl-qa1-a', '[The friendly answer.]')],
            },
          ],
        },
      ],
    },
  },
];
