import { useCallback, useEffect, useState } from 'react';
import { useWorkspace } from 'sanity';
import { Box, Button, Card, Dialog, Flex, Heading, Stack, Text } from '@sanity/ui';
import emblem from '../../assets/brand/wcp-emblem.png';

// =============================================================================
// StudioTour — the Studio's first-visit welcome, like the hub's HubTourModal
// =============================================================================
// A stepped dialog that greets a volunteer the FIRST time this browser opens
// the Studio, then never again (localStorage, same device-local pattern as
// the hub tour). It rides StudioLayout, so it works in both workspaces and
// needs no Sanity feature beyond a custom layout component.
//
// The tour is WORKSPACE-AWARE: the shared steps (publish model, the two
// doors, click-to-edit, starters, media, tools, help, safety) show in both,
// and two middle steps swap to the work THIS side is for — news/menus on the
// public side, the weekly hub rhythm + families on the hub side.
//
// Re-open path: the Welcome pane fires the OPEN_EVENT below. Nothing here
// mutates content; Escape / "Skip" close it for good. Bump SEEN_KEY when the
// steps change enough that returning volunteers should see them again.
// =============================================================================

const SEEN_KEY = 'wcp-studio-tour-v2';

/** The Welcome pane dispatches this to replay the tour on demand. */
export const OPEN_EVENT = 'wcp-studio-tour-open';

const emblemSrc: string = typeof emblem === 'string' ? emblem : emblem.src;

interface Step {
  emoji: string;
  title: string;
  body: string;
}

const OPENING: Step[] = [
  {
    emoji: '👋',
    title: 'Welcome to the Studio',
    body: 'This is where the website and the Family Hub get edited — words, photos, pages, all of it. Nothing you type is visible to anyone until you press the green Publish button, so it is safe to look around.',
  },
  {
    emoji: '🚪',
    title: 'Two doors, one website',
    body: 'The name in the top-left corner switches between Public website (blue — what everyone sees) and Family Hub (orange — behind the family password). If you cannot find something, you are probably in the other one. The left menu is the same idea on both sides: everyday jobs on top, setup at the bottom.',
  },
  {
    emoji: '🖱️',
    title: 'Edit pages by clicking the page',
    body: 'Open Presentation in the top bar to see the site itself. Click any words on the page and the matching text box opens beside it. The page list on the left flips between pages like a site builder — an amber dot means unpublished edits, the ↗ opens the real live page, and ＋ New page starts a fresh one.',
  },
  {
    emoji: '➕',
    title: 'Half-done starting points',
    body: 'The ＋ button in the top-left makes anything new, and for the regulars it offers ready-made starters: a meeting-minutes post, a spotlight pop-up, a birthday celebration, a helper sign-up sheet. Next to it, the 🔍 search finds any document by name.',
  },
  {
    emoji: '🖼️',
    title: 'Every photo, one place',
    body: 'Media in the top bar is the photo library: browse, search, edit a caption, and see which pages use each picture. Every image picker can also browse it, so you never upload the same photo twice.',
  },
];

const MIDDLE: Record<'public' | 'family-hub', Step[]> = {
  public: [
    {
      emoji: '📰',
      title: 'News, events, and the newsletter',
      body: 'News posts, the Events page, and Newsletter issues each have a home in the left menu. Publish a post and the website rebuilds itself in a couple of minutes — no other steps. The newsletter composes here too, with a web archive for free.',
    },
    {
      emoji: '🧭',
      title: 'Pages, menus, and old links',
      body: 'Pages are stacks of sections you add, reorder, and drag — the menu is editable the same way (drag a page in or out of it, right in the page list). Rename a page and the old address keeps working automatically. Saved sections let you keep a favorite section and reuse it on any page.',
    },
  ],
  'family-hub': [
    {
      emoji: '📣',
      title: 'The weekly rhythm',
      body: 'The top of the left menu is the hub week: post an Update, open a Sign-up sheet (its Responses tab shows who signed up), share a Document, post a Celebration, or run a Spotlight pop-up that greets every family once. The Alert banner sits first for snow days.',
    },
    {
      emoji: '👪',
      title: 'Families and the co-op',
      body: 'The Family Directory opens by class — handy for class reps. Family photos wait in a review queue until you approve them. Co-op roles draw the org chart, and "Who’s who" is the list to refresh each fall. Adding a class is two steps: publish the class, and every page, list, and menu updates itself.',
    },
  ],
};

const CLOSING: Step[] = [
  {
    emoji: '🩺',
    title: 'The tools do the remembering',
    body: 'In the top bar: Checkup answers "does anything need attention?" (stale pages, expired pop-ups, anything pointing at a missing class). Start of year walks the annual rollover. Export downloads any list as a spreadsheet, and Clean up clears old inbox records in one go.',
  },
  {
    emoji: '❔',
    title: 'Help is built in',
    body: 'Help & Guide (near the top of the left menu) has a plain-language walkthrough for every job — posting news, changing tuition, running sign-ups, reviewing photos. When you are unsure, start there.',
  },
  {
    emoji: '🛟',
    title: 'You cannot break it',
    body: 'Edits stay drafts until you Publish. Deleted things wait in Recently deleted. Ctrl+Z undoes section moves. And every night the whole site is backed up automatically. Go ahead and try things.',
  },
];

export function StudioTour() {
  const workspace = useWorkspace();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);

  const steps: Step[] = [
    ...OPENING,
    ...(MIDDLE[workspace.name as 'public' | 'family-hub'] ?? []),
    ...CLOSING,
  ];

  useEffect(() => {
    // First visit on this browser only. try/catch: storage can throw in
    // private windows, and the tour must never take the Studio down with it.
    try {
      if (!localStorage.getItem(SEEN_KEY)) {
        // A short delay so the Studio paints first and the dialog reads as a
        // greeting, not a roadblock.
        const t = setTimeout(() => setOpen(true), 900);
        return () => clearTimeout(t);
      }
    } catch {
      /* no storage → no tour, and no crash */
    }
    return undefined;
  }, []);

  useEffect(() => {
    const replay = () => {
      setStep(0);
      setOpen(true);
    };
    window.addEventListener(OPEN_EVENT, replay);
    return () => window.removeEventListener(OPEN_EVENT, replay);
  }, []);

  const dismiss = useCallback(() => {
    setOpen(false);
    try {
      localStorage.setItem(SEEN_KEY, '1');
    } catch {
      /* fine — it will greet again next time */
    }
  }, []);

  if (!open) return null;

  const current = steps[Math.min(step, steps.length - 1)];
  const last = step >= steps.length - 1;

  return (
    <Dialog
      id="wcp-studio-tour"
      header="A quick hello"
      width={0}
      onClose={dismiss}
      footer={
        <Box padding={3}>
          <Flex gap={2} justify="space-between" align="center">
            <Button mode="bleed" text="Skip" onClick={dismiss} />
            <Flex gap={2} align="center">
              {/* Step dots — decorative; the count is in the button label. */}
              <Text size={1} muted aria-hidden>
                {steps.map((_, i) => (i === step ? '●' : '○')).join(' ')}
              </Text>
              {step > 0 && (
                <Button mode="ghost" text="Back" onClick={() => setStep((s) => s - 1)} />
              )}
              <Button
                tone="primary"
                text={last ? 'Start editing' : 'Next'}
                onClick={() => (last ? dismiss() : setStep((s) => s + 1))}
              />
            </Flex>
          </Flex>
        </Box>
      }
    >
      <Box padding={4}>
        <Stack space={4}>
          <Flex align="center" gap={3}>
            <img src={emblemSrc} alt="" style={{ width: 44, height: 44, objectFit: 'contain' }} />
            <Heading size={2} className="wcp-display">
              {current.emoji} {current.title}
            </Heading>
          </Flex>
          <Card tone="transparent" radius={2}>
            <Text size={2} style={{ lineHeight: 1.6 }}>
              {current.body}
            </Text>
          </Card>
        </Stack>
      </Box>
    </Dialog>
  );
}
