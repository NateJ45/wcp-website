import { defineType, defineField, defineArrayMember } from 'sanity';

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
      title: 'PayPal button ID — registration',
      type: 'string',
      group: 'enrollment',
    }),
    defineField({
      name: 'participationFee',
      title: 'Participation deposit',
      type: 'string',
      group: 'enrollment',
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
      title: 'PayPal button ID — participation',
      type: 'string',
      group: 'enrollment',
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
      title: 'Student fee bands',
      type: 'array',
      group: 'student',
      description: 'e.g. "Twos & Threes — $45", "Pre-K AM & PM — $50".',
      of: [
        defineArrayMember({
          type: 'object',
          fields: [
            { name: 'label', title: 'Applies to', type: 'string' },
            { name: 'amount', title: 'Amount', type: 'string' },
            { name: 'payId', title: 'PayPal button ID', type: 'string' },
          ],
          preview: { select: { title: 'label', subtitle: 'amount' } },
        }),
      ],
    }),

    // How payments work
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
            { name: 'icon', title: 'Icon', type: 'string' },
            { name: 'question', title: 'Question / label', type: 'string' },
            { name: 'answer', title: 'Answer', type: 'text', rows: 3 },
          ],
          preview: { select: { title: 'question', subtitle: 'answer' } },
        }),
      ],
    }),
  ],
  preview: { prepare: () => ({ title: 'Tuition & Fees' }) },
});
