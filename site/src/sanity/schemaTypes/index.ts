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
import { emphasisText } from './objects/emphasisText';
import { richProse } from './objects/richProse';
import { postBody } from './objects/postBody';
import { iconCard } from './objects/iconCard';
import { sectionHeader } from './objects/sectionHeader';
import { formField } from './objects/formField';
import { actionButton } from './objects/actionButton';
import { callout } from './objects/callout';
import { figureImage } from './objects/figureImage';
import { navLink, navGroup } from './objects/navLink';

// Page-builder section palette (hero + body sections)
import { SECTION_OBJECT_TYPES } from './sections';

// Singletons (single-instance settings)
import { siteSettings } from './singletons/siteSettings';
import { feeSchedule } from './singletons/feeSchedule';
import { operatingBudget } from './singletons/operatingBudget';
import { coopGuidance } from './singletons/coopGuidance';
import { siteMicrocopy } from './singletons/siteMicrocopy';
import { hubNavMenu } from './singletons/hubNavMenu';
import { hubTour } from './singletons/hubTour';
import { hubHints } from './singletons/hubHints';
import { linkHealth } from './singletons/linkHealth';
import { hubDelights } from './singletons/hubDelights';
import { hubStore } from './singletons/hubStore';
import { hubSettings } from './singletons/hubSettings';
import { curriculumGuide } from './documents/curriculumGuide';
import { supplyList } from './singletons/supplyList';
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
import { sectionPreset } from './documents/sectionPreset';
import { post } from './documents/post';
import { newsletterIssue } from './documents/newsletterIssue';
import { event } from './documents/event';
import { redirect } from './documents/redirect';
import { venue } from './documents/venue';
import { announcement } from './documents/announcement';
import { submission } from './documents/submission';
import { subscriber } from './documents/subscriber';
import { testimonialSubmission } from './documents/testimonialSubmission';
import { photoSubmission } from './documents/photoSubmission';
import { trashedItem } from './documents/trashedItem';
import { coopRole } from './documents/coopRole';
import { roleHolder } from './documents/roleHolder';
import { hoursLog } from './documents/hoursLog';
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
import { celebration } from './celebration';
import { hubDocument } from './hubDocument';
import { teacherNote } from './teacherNote';
import { directoryEntry } from './directoryEntry';
import { hubPage } from './documents/hubPage';
import { hubSpotlight } from './documents/hubSpotlight';
import { signupSheet, signupEntry } from './documents/signupSheet';

export const schemaTypes = [
  // Shared objects
  blockContent,
  inlineText,
  emphasisText,
  richProse,
  postBody,
  iconCard,
  sectionHeader,
  formField,
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
  operatingBudget,
  coopGuidance,
  siteMicrocopy,
  hubNavMenu,
  hubTour,
  hubHints,
  linkHealth,
  hubDelights,
  hubStore,
  hubSettings,
  curriculumGuide,
  supplyList,
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
  sectionPreset,
  post,
  newsletterIssue,
  event,
  redirect,
  venue,
  announcement,
  submission,
  subscriber,
  testimonialSubmission,
  photoSubmission,
  trashedItem,
  coopRole,
  roleHolder,
  hoursLog,
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
  celebration,
  hubDocument,
  teacherNote,
  directoryEntry,
  hubPage,
  hubSpotlight,
  signupSheet,
  signupEntry,
];

// Types treated as singletons (one instance, pinned; no create/delete/duplicate).
export const SINGLETON_TYPES = new Set([
  'siteSettings',
  'feeSchedule',
  'operatingBudget',
  'coopGuidance',
  'siteMicrocopy',
  'hubNavMenu',
  'hubTour',
  'hubHints',
  'linkHealth',
  'hubDelights',
  'hubStore',
  'hubSettings',
  'supplyList',
  'curriculumGuide',
  'navigation',
  'closureAlert',
  'presidentNote',
]);

// Board-authored CONTENT types whose destructive Delete is replaced by Archive
// (soft-delete into "Recently deleted"). Deliberately excludes singletons (you
// don't delete those), machine/inbox types (submissions, subscribers, sign-up &
// hours entries, moderated photos — the Clean up tool handles those in bulk),
// and trashedItem itself. Keep this in sync when a new content type is added.
export const ARCHIVABLE_TYPES = new Set([
  'page',
  'post',
  'event',
  'legalPage',
  'class',
  'staff',
  'faqItem',
  'testimonial',
  'schoolYearEvent',
  'program',
  'boardMember',
  'partner',
  'credential',
  'campaign',
  'jobPosting',
  'resource',
  'photoAlbum',
  'hubPage',
  'update',
  'hubSpotlight',
  'hubDocument',
  'teacherNote',
  'directoryEntry',
  'celebration',
  'newsletterIssue',
  'signupSheet',
  'coopRole',
  'roleHolder',
  'venue',
  'announcement',
  'redirect',
]);
