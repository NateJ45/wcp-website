// =============================================================================
// hub microcopy — tiny labels shared across components (W4, 2026-08-31)
// =============================================================================
// DELIBERATELY CODE, not Sanity: these are interface words, not facts, and
// every one made Studio-editable is one more box a volunteer can break. They
// live here because they were duplicated across four components ("Your
// teacher" three times, "Call or text" three times), so a wording change was
// a multi-file hunt. One edit here now changes every card in step.
// =============================================================================

export const CONTACT_LABELS = {
  /** Eyebrow over the teacher's name (TeacherCard, TeacherSignoff). */
  yourTeacher: 'Your teacher',
  /** Eyebrow over the rep's name (ClassRepCard). */
  classRep: 'Class rep',
  /** The mailto link. */
  email: 'Say hi',
  /** The tel link. */
  phone: 'Call or text',
  /** TeacherCard's link to the welcome-letter modal. */
  welcomeLetter: 'Welcome letter',
} as const;
