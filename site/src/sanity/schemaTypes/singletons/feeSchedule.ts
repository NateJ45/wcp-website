import { defineType, defineField, defineArrayMember } from 'sanity';
import { iconField } from '../objects/_shared';

// =============================================================================
// Fee Schedule (SINGLETON) — enrollment fees + payment rules
// =============================================================================
// The one place for the registration fee, participation deposit, student-fee
// bands, and "how payments work" details. Feeds the tuition page and the Family
// Hub tuition page.
// =============================================================================
export const feeSchedule = defineType({
  name: 'feeSchedule',
  title: 'Tuition & Fees',
  type: 'document',
  groups: [
    { name: 'enrollment', title: 'Enrollment fees' },
    { name: 'student', title: 'Student fees' },
    { name: 'payment', title: 'How payments work' },
  ],
  fields: [
    // Enrollment fees
    defineField({
      name: 'registrationFee',
      title: 'Registration fee',
      type: 'string',
      group: 'enrollment',
      description: 'e.g. "$100".',
    }),
    defineField({
      name: 'registrationNote',
      title: 'Registration fee — note',
      type: 'text',
      rows: 2,
      group: 'enrollment',
      description: 'When it is due / what it does.',
    }),
    defineField({
      name: 'registrationPayId',
      title: 'PayPal button — registration',
      type: 'string',
      group: 'enrollment',
      description:
        'The payment link from the PayPal "registration fee" button — in PayPal, open the button and Copy link (it starts with paypal.com/ncp/payment/). Paste the whole link. Older buttons used a short code instead; a code still works until that button is replaced. Changing this changes where the money goes, so double-check it. Step-by-step help: Help & Guide → "Change tuition or fees".',
    }),
    defineField({
      name: 'registrationTitle',
      title: 'Registration fee — name',
      type: 'string',
      group: 'enrollment',
      description: 'Renames the first fee card. Empty keeps “Registration Fee”.',
    }),
    defineField({
      name: 'registrationWhen',
      title: 'Registration fee — due',
      type: 'string',
      group: 'enrollment',
      description: 'The little line beside the amount, e.g. “due at enrollment”.',
    }),
    defineField({
      name: 'registrationAction',
      title: 'Registration fee — button label',
      type: 'string',
      group: 'enrollment',
      description: 'Empty keeps “Pay Registration Fee”.',
    }),
    defineField({
      name: 'participationFee',
      title: 'Participation deposit',
      type: 'string',
      group: 'enrollment',
      description: 'e.g. "$150".',
    }),
    defineField({
      name: 'participationNote',
      title: 'Participation deposit — note',
      type: 'text',
      rows: 2,
      group: 'enrollment',
      description:
        'e.g. "Due at the May Gathering; returned at year-end when co-op commitments are met."',
    }),
    defineField({
      name: 'participationPayId',
      title: 'PayPal button — participation',
      type: 'string',
      group: 'enrollment',
      description:
        'The payment link from the PayPal "participation deposit" button (Copy link in PayPal; older buttons used a short code, which still works). Changing this changes where the money goes, so double-check it. Step-by-step help: Help & Guide → "Change tuition or fees".',
    }),
    defineField({
      name: 'participationTitle',
      title: 'Participation fee — name',
      type: 'string',
      group: 'enrollment',
      description: 'Renames the second fee card. Empty keeps “Participation Fee”.',
    }),
    defineField({
      name: 'participationWhen',
      title: 'Participation fee — due',
      type: 'string',
      group: 'enrollment',
      description:
        'e.g. “due at May Gathering” — update when the deadline or the event’s name changes.',
    }),
    defineField({
      name: 'participationAction',
      title: 'Participation fee — button label',
      type: 'string',
      group: 'enrollment',
      description: 'Empty keeps “Pay Deposit”.',
    }),
    defineField({
      name: 'annualAdjustmentNote',
      title: 'Annual adjustment note',
      type: 'text',
      rows: 2,
      group: 'enrollment',
      description: 'e.g. the "tuition is subject to a 5–15% annual adjustment" note.',
    }),

    // Student fees
    defineField({
      name: 'studentFeeBands',
      title: 'Student fee bands (retired — set the fee on each class instead)',
      type: 'array',
      group: 'student',
      // HIDDEN, not deleted: the stored rows are kept as a record of what the
      // bands used to say, but nothing reads them any more. They duplicated the
      // amount and the PayPal link already held on each class document, and the
      // two drifted — the retired button code sat on the class docs for weeks
      // after these rows moved to the new-style link, and no page read the class
      // field to reveal it. The bands are now DERIVED from the class documents
      // (src/lib/student-fees.ts), so the fee is set in exactly one place.
      hidden: true,
      readOnly: true,
      description:
        'Retired. Set each class’s student fee and PayPal button on the class itself (Classes → the class → Tuition); the Tuition page builds these bands from them.',
      of: [
        defineArrayMember({
          type: 'object',
          fields: [
            {
              name: 'label',
              title: 'Applies to',
              type: 'string',
              description: 'Which classes this fee covers, e.g. "Twos & Threes".',
            },
            { name: 'amount', title: 'Amount', type: 'string', description: 'e.g. "$45".' },
            {
              name: 'payId',
              title: 'PayPal button',
              type: 'string',
              description:
                'The payment link from the matching PayPal button (Copy link in PayPal; older buttons used a short code, which still works). Help & Guide → "Change tuition or fees".',
            },
          ],
          preview: { select: { title: 'label', subtitle: 'amount' } },
        }),
      ],
    }),

    // How payments work
    defineField({
      name: 'schoolYearMonths',
      title: 'Billed months per school year',
      type: 'number',
      group: 'payment',
      description:
        'How many monthly payments a school year has (drives every annual total the site computes). Empty keeps 9 (September–May).',
      validation: (R) => R.min(1).max(12).error('Between 1 and 12.'),
    }),
    defineField({
      name: 'depositNote',
      title: 'Deposit note',
      type: 'string',
      group: 'payment',
      description:
        'The phrase after the deposit amount on the public class cards and calculator, e.g. "returned after your co-op hours". Update it if the refund policy changes.',
    }),
    defineField({
      name: 'paymentTerms',
      title: 'How payments work (FAQ)',
      type: 'array',
      group: 'payment',
      description:
        'The quick answers shown under the tuition table (due dates, late fee, how to pay…).',
      of: [
        defineArrayMember({
          type: 'object',
          fields: [
            iconField('icon', {
              description: 'A little picture shown next to this answer (optional).',
            }),
            {
              name: 'question',
              title: 'Question / label',
              type: 'string',
              description: 'e.g. "When is tuition due?"',
            },
            { name: 'answer', title: 'Answer', type: 'text', rows: 3 },
          ],
          preview: { select: { title: 'question', subtitle: 'answer' } },
        }),
      ],
    }),
  ],
  preview: { prepare: () => ({ title: 'Tuition & Fees' }) },
});
