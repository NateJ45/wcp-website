import { useEffect, useState } from 'react';
import { useClient } from 'sanity';
import { Box, Card, Stack, Text, Heading, Flex, Spinner } from '@sanity/ui';

// =============================================================================
// WelcomePane — a friendly Studio landing screen
// =============================================================================
// A warm "home" for volunteers instead of dropping straight into a document
// list: a hello, a pointer to the Help & Guide, and a live list of what was
// edited most recently (so you can jump back to whatever you were doing). It's
// the first item in the Studio nav. No plan gating — just a component.
// =============================================================================

interface RecentDoc {
  _id: string;
  _type: string;
  _updatedAt: string;
  title?: string;
  name?: string;
}

const TYPE_LABELS: Record<string, string> = {
  page: 'Page',
  post: 'News post',
  event: 'Event',
  legalPage: 'Legal page',
  class: 'Class',
  staff: 'Staff',
  faqItem: 'FAQ',
  testimonial: 'Testimonial',
  siteSettings: 'Site Settings',
  navigation: 'Menus',
  feeSchedule: 'Tuition & Fees',
  schoolYearEvent: 'School-year event',
};

const RECENT_QUERY = `*[
  _type in ["page","post","event","legalPage","class","staff","faqItem","testimonial","siteSettings","navigation","feeSchedule","schoolYearEvent"]
  && !(_id in path("drafts.**"))
] | order(_updatedAt desc)[0...6]{ _id, _type, _updatedAt, title, name }`;

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.round(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs} hour${hrs === 1 ? '' : 's'} ago`;
  const days = Math.round(hrs / 24);
  return `${days} day${days === 1 ? '' : 's'} ago`;
}

export function WelcomePane() {
  const client = useClient({ apiVersion: '2025-01-01' });
  const [recent, setRecent] = useState<RecentDoc[] | null>(null);

  useEffect(() => {
    let alive = true;
    client
      .fetch<RecentDoc[]>(RECENT_QUERY)
      .then((docs) => alive && setRecent(docs))
      .catch(() => alive && setRecent([]));
    return () => {
      alive = false;
    };
  }, [client]);

  return (
    <Box padding={4}>
      <Stack space={5} style={{ maxWidth: 640, margin: '0 auto' }}>
        <Stack space={3}>
          <Heading size={3}>👋 Welcome to the West Chester Preschool control room</Heading>
          <Text size={2} muted style={{ lineHeight: 1.5 }}>
            This is where you edit the website. Nothing goes live until you click{' '}
            <strong>Publish</strong>, so click around and explore. New here? Open{' '}
            <strong>Help &amp; Guide</strong> in the left menu for step-by-step walkthroughs.
          </Text>
        </Stack>

        <Card padding={4} radius={2} tone="primary" border>
          <Stack space={2}>
            <Text size={1} weight="semibold">
              A few things you can do
            </Text>
            <Text size={1} muted style={{ lineHeight: 1.6 }}>
              • <strong>Pages</strong> — edit any page or build a new one from sections
              <br />• <strong>News</strong> — write a post (it shows on the homepage automatically)
              <br />• <strong>Events</strong> — add an open house or tour
              <br />• <strong>Site Settings</strong> — phone, email, address, school year
            </Text>
          </Stack>
        </Card>

        <Stack space={3}>
          <Text
            size={1}
            weight="semibold"
            muted
            style={{ textTransform: 'uppercase', letterSpacing: '0.04em' }}
          >
            Recently edited
          </Text>
          {recent === null ? (
            <Flex align="center" gap={2}>
              <Spinner muted />
              <Text size={1} muted>
                Loading…
              </Text>
            </Flex>
          ) : recent.length === 0 ? (
            <Text size={1} muted>
              Nothing published yet.
            </Text>
          ) : (
            <Stack space={2}>
              {recent.map((doc) => (
                <Card key={doc._id} padding={3} radius={2} border>
                  <Flex align="center" justify="space-between" gap={3}>
                    <Stack space={1}>
                      <Text size={1} weight="medium">
                        {doc.title || doc.name || 'Untitled'}
                      </Text>
                      <Text size={0} muted>
                        {TYPE_LABELS[doc._type] ?? doc._type}
                      </Text>
                    </Stack>
                    <Text size={0} muted>
                      {timeAgo(doc._updatedAt)}
                    </Text>
                  </Flex>
                </Card>
              ))}
            </Stack>
          )}
        </Stack>
      </Stack>
    </Box>
  );
}
