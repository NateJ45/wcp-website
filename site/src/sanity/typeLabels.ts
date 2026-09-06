// =============================================================================
// typeLabels — friendly names for document types (shown to volunteers)
// =============================================================================
// Non-technical board members should never see a raw type name like "coopRole".
// Shared by the Recently-deleted list and the archive/restore toasts.
// =============================================================================
export const TYPE_LABELS: Record<string, string> = {
  page: 'Page',
  post: 'News post',
  event: 'Event',
  legalPage: 'Legal page',
  class: 'Class',
  staff: 'Staff member',
  faqItem: 'FAQ',
  testimonial: 'Testimonial',
  schoolYearEvent: 'School-year event',
  program: 'Program',
  boardMember: 'Board / leadership',
  partner: 'Partner / sponsor',
  credential: 'Accreditation',
  campaign: 'Fundraising campaign',
  jobPosting: 'Job posting',
  resource: 'Download / resource',
  photoAlbum: 'Photo album',
  hubPage: 'Family Hub page',
  update: 'Hub update',
  hubSpotlight: 'Spotlight pop-up',
  hubDocument: 'Document / form',
  teacherNote: 'Teacher welcome note',
  directoryEntry: 'Family (directory)',
  celebration: 'Celebration',
  newsletterIssue: 'Newsletter issue',
  signupSheet: 'Sign-up sheet',
  coopRole: 'Co-op role',
  operatingBudget: 'Operating budget',
  coopGuidance: 'How the co-op works',
  hubNavMenu: 'Family Hub menu',
  hubTour: 'First-visit tour',
  hubHints: 'Feature hints',
  linkHealth: 'Link health',
  hubDelights: 'Little delights',
  hubStore: 'Merch store card',
  hubSettings: 'Hub settings',
  curriculumGuide: 'Curriculum guide (PDF)',
  supplyList: 'School supply list',
  siteMicrocopy: 'Small bits of wording',
  roleHolder: 'Who’s who this year',
  venue: 'Location / venue',
  announcement: 'Announcement',
  redirect: 'Redirect',
};

export const typeLabel = (type?: string): string => (type && TYPE_LABELS[type]) || type || 'Item';
