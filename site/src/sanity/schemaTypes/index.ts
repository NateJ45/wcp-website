// =============================================================================
// Sanity schema registry
// =============================================================================
// Every document/object type the Studio knows about. Grouped for clarity:
// objects (embedded), singletons (one-of), then collections. Content that stays
// on Google (Calendar, Fundraising per decision #4) is NOT modeled here.
// =============================================================================

// Objects (embedded / reusable)
import { blockContent } from './blockContent';
import { iconCard } from './objects/iconCard';

// Singletons (single-instance settings)
import { siteSettings } from './singletons/siteSettings';
import { feeSchedule } from './singletons/feeSchedule';

// Collections (public site)
import { staff } from './documents/staff';
import { classType } from './documents/class';
import { testimonial } from './documents/testimonial';
import { faqItem } from './documents/faqItem';
import { schoolYearEvent } from './documents/schoolYearEvent';
import { legalPage } from './documents/legalPage';
import { page } from './documents/page';
import { coopRole } from './documents/coopRole';

// Collections (Family Hub — gated)
import { update } from './update';
import { hubDocument } from './hubDocument';
import { classNote } from './classNote';
import { directoryEntry } from './directoryEntry';

export const schemaTypes = [
  // Objects
  blockContent,
  iconCard,
  // Singletons
  siteSettings,
  feeSchedule,
  // Public collections
  staff,
  classType,
  testimonial,
  faqItem,
  schoolYearEvent,
  legalPage,
  page,
  coopRole,
  // Family Hub collections
  update,
  hubDocument,
  classNote,
  directoryEntry,
];

// Types treated as singletons (one instance, pinned; no create/delete/duplicate).
export const SINGLETON_TYPES = new Set(['siteSettings', 'feeSchedule']);
