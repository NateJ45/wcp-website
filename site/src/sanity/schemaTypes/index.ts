// =============================================================================
// Sanity schema registry
// =============================================================================
// Every document/object type the Studio knows about. Grouped for clarity:
// shared objects (embedded), section palette, singletons, then collections.
// Content that stays on Google (Calendar, Fundraising per decision #4) is NOT
// modeled here.
// =============================================================================

// Objects (embedded / reusable)
import { blockContent } from './blockContent';
import { inlineText } from './objects/inlineText';
import { richProse } from './objects/richProse';
import { postBody } from './objects/postBody';
import { iconCard } from './objects/iconCard';
import { sectionHeader } from './objects/sectionHeader';
import { actionButton } from './objects/actionButton';
import { callout } from './objects/callout';
import { figureImage } from './objects/figureImage';
import { navLink, navGroup } from './objects/navLink';

// Page-builder section palette (hero + body sections)
import { SECTION_OBJECT_TYPES } from './sections';

// Singletons (single-instance settings)
import { siteSettings } from './singletons/siteSettings';
import { feeSchedule } from './singletons/feeSchedule';
import { navigation } from './singletons/navigation';
import { closureAlert } from './singletons/closureAlert';
import { presidentNote } from './singletons/presidentNote';

// Collections (public site)
import { staff } from './documents/staff';
import { classType } from './documents/class';
import { testimonial } from './documents/testimonial';
import { faqItem } from './documents/faqItem';
import { schoolYearEvent } from './documents/schoolYearEvent';
import { legalPage } from './documents/legalPage';
import { page } from './documents/page';
import { post } from './documents/post';
import { event } from './documents/event';
import { submission } from './documents/submission';
import { subscriber } from './documents/subscriber';
import { coopRole } from './documents/coopRole';
import {
  program,
  boardMember,
  partner,
  credential,
  campaign,
  jobPosting,
  resource,
  photoAlbum,
} from './documents/extras';

// Collections (Family Hub — gated)
import { update } from './update';
import { hubDocument } from './hubDocument';
import { teacherNote } from './teacherNote';
import { directoryEntry } from './directoryEntry';
import { hubPage } from './documents/hubPage';

export const schemaTypes = [
  // Shared objects
  blockContent,
  inlineText,
  richProse,
  postBody,
  iconCard,
  sectionHeader,
  actionButton,
  callout,
  figureImage,
  navLink,
  navGroup,
  // Section palette (hero + body sections)
  ...SECTION_OBJECT_TYPES,
  // Singletons
  siteSettings,
  feeSchedule,
  navigation,
  closureAlert,
  presidentNote,
  // Public collections
  staff,
  classType,
  testimonial,
  faqItem,
  schoolYearEvent,
  legalPage,
  page,
  post,
  event,
  submission,
  subscriber,
  coopRole,
  // Future-proofing collections (surfaced via community.ts sections)
  program,
  boardMember,
  partner,
  credential,
  campaign,
  jobPosting,
  resource,
  photoAlbum,
  // Family Hub collections
  update,
  hubDocument,
  teacherNote,
  directoryEntry,
  hubPage,
];

// Types treated as singletons (one instance, pinned; no create/delete/duplicate).
export const SINGLETON_TYPES = new Set([
  'siteSettings',
  'feeSchedule',
  'navigation',
  'closureAlert',
  'presidentNote',
]);
