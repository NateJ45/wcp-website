// =============================================================================
// Enrollment mode → the copy the site shows
// =============================================================================
// Site Settings holds one `enrollmentMode` (open / waitlist / closed). The
// self-adapting enrollment CTA section reads it through here, so flipping the
// switch changes every enrollment banner's wording and button at once.
// =============================================================================
export type EnrollmentMode = 'open' | 'waitlist' | 'closed';

export interface EnrollmentInfo {
  mode: EnrollmentMode;
  deadline?: string;
}

export interface EnrollmentCopy {
  eyebrow: string;
  heading: string;
  body: string;
  cta: string;
}

// Date-only "YYYY-MM-DD" anchored to noon UTC before formatting, so it never
// slips a day in Eastern time (same gotcha as the hub calendar).
function formatDeadline(iso: string): string {
  const d = new Date(`${iso}T12:00:00Z`);
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
}

export function enrollmentCopy(info: EnrollmentInfo): EnrollmentCopy {
  switch (info.mode) {
    case 'waitlist':
      return {
        eyebrow: 'Enrollment',
        heading: 'Our classes are full for now',
        body: 'Add your family to the waitlist and we’ll reach out the moment a spot opens.',
        cta: 'Join the waitlist',
      };
    case 'closed':
      return {
        eyebrow: 'Enrollment',
        heading: 'Enrollment is between seasons',
        body: 'Reach out any time and we’ll let you know the moment it opens for the next year.',
        cta: 'Get in touch',
      };
    case 'open':
    default: {
      const by = info.deadline ? ` Apply by ${formatDeadline(info.deadline)}.` : '';
      return {
        eyebrow: 'Now enrolling',
        heading: 'Enroll for the coming year',
        body: `We’re accepting new families and would love to meet yours.${by}`,
        cta: 'Apply now',
      };
    }
  }
}
