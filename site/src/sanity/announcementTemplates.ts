import type { Template } from 'sanity';

// =============================================================================
// Announcement "＋ New" starting points (initial-value templates)
// =============================================================================
// Clicking ＋ on the Announcements list offers these pre-built bars/popups, each
// pre-filled with format, type, color, an icon, and placeholder copy — the
// "pre-built types" the board picks from and then customizes. All start OFF
// (enabled: false) and at "every page", so a new one is never live by accident.
// =============================================================================
export const ANNOUNCEMENT_TEMPLATES: Template[] = [
  {
    id: 'announcement-openhouse',
    title: 'Open house / event bar',
    schemaType: 'announcement',
    icon: () => '📅',
    value: {
      title: 'Open house bar',
      format: 'bar',
      template: 'event',
      tone: 'info',
      icon: 'calendar-days',
      message: 'Open house on [date]! Come meet our teachers and see the classrooms.',
      linkLabel: 'Register',
      linkType: 'page',
      enabled: false,
      placement: 'all',
      priority: 10,
    },
  },
  {
    id: 'announcement-waitlist',
    title: 'Enrollment / waitlist bar (auto)',
    schemaType: 'announcement',
    icon: () => '🎓',
    value: {
      title: 'Enrollment status bar',
      format: 'bar',
      template: 'waitlist',
      tone: 'good',
      icon: 'graduation-cap',
      enabled: false,
      placement: 'all',
      priority: 10,
    },
  },
  {
    id: 'announcement-fundraiser',
    title: 'Fundraiser bar',
    schemaType: 'announcement',
    icon: () => '💛',
    value: {
      title: 'Fundraiser bar',
      format: 'bar',
      template: 'fundraiser',
      tone: 'brand',
      icon: 'heart',
      message: 'Our [campaign] is on! Every gift helps our classrooms.',
      linkLabel: 'Give',
      linkType: 'page',
      enabled: false,
      placement: 'all',
      priority: 20,
    },
  },
  {
    id: 'announcement-notice',
    title: 'General notice bar',
    schemaType: 'announcement',
    icon: () => '📢',
    value: {
      title: 'Notice bar',
      format: 'bar',
      template: 'notice',
      tone: 'info',
      enabled: false,
      placement: 'all',
      priority: 30,
    },
  },
  {
    id: 'announcement-welcome-popup',
    title: 'Welcome popup',
    schemaType: 'announcement',
    icon: () => '👋',
    value: {
      title: 'Welcome popup',
      format: 'popup',
      template: 'welcome',
      tone: 'brand',
      heading: 'Welcome to West Chester Preschool!',
      message: 'We are so glad you are here. Take a look around, and reach out any time.',
      frequency: 'once',
      enabled: false,
      placement: 'all',
      priority: 10,
    },
  },
  {
    id: 'announcement-event-popup',
    title: 'Event popup',
    schemaType: 'announcement',
    icon: () => '🎟️',
    value: {
      title: 'Event popup',
      format: 'popup',
      template: 'event',
      tone: 'info',
      heading: 'You’re invited!',
      message: 'Join us for [event] on [date].',
      linkLabel: 'Register',
      linkType: 'page',
      frequency: 'once',
      enabled: false,
      placement: 'all',
      priority: 10,
    },
  },
];
