import { defineType, defineField } from 'sanity';

// =============================================================================
// closureAlert (singleton) — the site-wide banner
// =============================================================================
// One toggle a volunteer flips for a snow day, an early dismissal, or any
// urgent notice: it shows a dismissible banner at the top of every public page.
// Flip "active" off (and Publish) to take it down. Like everything static, it
// appears/disappears on the next rebuild (~1-2 min after Publish).
// =============================================================================
export const closureAlert = defineType({
  name: 'closureAlert',
  title: 'Alert banner',
  type: 'document',
  fields: [
    defineField({
      name: 'active',
      title: 'Show this alert on the site?',
      type: 'boolean',
      description: 'Turn on for a closure or urgent notice; turn off to take it down.',
      initialValue: false,
    }),
    defineField({
      name: 'message',
      title: 'Message',
      type: 'text',
      rows: 2,
      description: 'e.g. "Closed today, Jan 8, due to snow. Class resumes tomorrow."',
      validation: (R) => R.max(300),
    }),
    defineField({
      name: 'tone',
      title: 'Style',
      type: 'string',
      options: {
        list: [
          { title: 'Info (blue)', value: 'info' },
          { title: 'Warning (amber)', value: 'warning' },
          { title: 'Urgent (red)', value: 'urgent' },
        ],
        layout: 'radio',
      },
      initialValue: 'warning',
    }),
    defineField({
      name: 'linkLabel',
      title: 'Button text (optional)',
      type: 'string',
      description: 'e.g. "See details". Needs a link below to appear.',
    }),
    defineField({
      name: 'linkUrl',
      title: 'Button link (optional)',
      type: 'string',
      description: 'A page path like /contact, or a full https:// link.',
    }),
  ],
  preview: {
    select: { active: 'active', message: 'message' },
    prepare({ active, message }) {
      return {
        title: active ? '🔴 Alert is ON' : '⚪ Alert is off',
        subtitle: message || 'No message set',
      };
    },
  },
});
