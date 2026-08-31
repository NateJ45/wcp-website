import { useCallback, useEffect, useState } from 'react';
import { Box, Button, Card, Dialog, Flex, Heading, Stack, Text } from '@sanity/ui';
import emblem from '../../assets/brand/wcp-emblem.png';

// =============================================================================
// StudioTour — the Studio's first-visit welcome, like the hub's HubTourModal
// =============================================================================
// A small stepped dialog that greets a volunteer the FIRST time this browser
// opens the Studio, then never again (localStorage, same device-local pattern
// as the hub tour). It rides StudioLayout, so it works in both workspaces and
// needs no Sanity feature beyond a custom layout component.
//
// Re-open path: the Welcome pane fires the OPEN_EVENT below. Nothing here
// mutates content; Escape / "Skip" close it for good.
// =============================================================================

const SEEN_KEY = 'wcp-studio-tour-v1';

/** The Welcome pane dispatches this to replay the tour on demand. */
export const OPEN_EVENT = 'wcp-studio-tour-open';

const emblemSrc: string = typeof emblem === 'string' ? emblem : emblem.src;

interface Step {
  emoji: string;
  title: string;
  body: string;
}

const STEPS: Step[] = [
  {
    emoji: '👋',
    title: 'Welcome to the Studio',
    body: 'This is where the website and the Family Hub get edited — words, photos, pages, all of it. Nothing you type is visible to anyone until you press the green Publish button, so it is safe to look around.',
  },
  {
    emoji: '🚪',
    title: 'Two doors, one website',
    body: 'The name in the top-left corner switches between Public website (blue — what everyone sees) and Family Hub (orange — behind the family password). If you cannot find something, you are probably in the other one.',
  },
  {
    emoji: '🖱️',
    title: 'Edit pages by clicking the page',
    body: 'Open Presentation in the top bar to see the site itself. Click any words on the page and the matching text box opens beside it. The page list on the left flips between pages, like a site builder.',
  },
  {
    emoji: '❔',
    title: 'Help is built in',
    body: 'Help & Guide (near the top of the left menu) has a plain-language walkthrough for every job — posting news, changing tuition, running sign-ups. Checkup in the top bar answers "does anything need attention?"',
  },
  {
    emoji: '🛟',
    title: 'You cannot break it',
    body: 'Edits stay drafts until you Publish. Deleted things wait in Recently deleted. Ctrl+Z undoes section moves. And every night the whole site is backed up automatically. Go ahead and try things.',
  },
];

export function StudioTour() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);

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

  const current = STEPS[step];
  const last = step === STEPS.length - 1;

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
                {STEPS.map((_, i) => (i === step ? '●' : '○')).join(' ')}
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
