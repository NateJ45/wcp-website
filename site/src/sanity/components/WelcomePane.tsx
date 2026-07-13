import { useEffect, useState, type ComponentProps, type ReactNode } from 'react';
import { useClient, useWorkspace } from 'sanity';
import { IntentLink, useRouter } from 'sanity/router';
import { Box, Card, Stack, Text, Heading, Flex, Spinner } from '@sanity/ui';

// =============================================================================
// WelcomePane — the Studio landing screen, in the Family Hub's card language
// =============================================================================
// The first thing a volunteer sees: a warm hello, a grid of TASK cards that
// deep-link straight to the thing they came to do ("change tuition", "post an
// alert", "add photos"), and a live "recently edited" list to resume work.
// Visual language mirrors the hub's HubCard: rounded cards, soft icon chips
// (sky/amber/green/orange tints behind an emoji), hover lift (reduced-motion
// safe). Colors are the brand "ink" shades from theme.ts. No plan gating.
// =============================================================================

interface RecentDoc {
  _id: string;
  _type: string;
  _updatedAt: string;
  title?: string;
  name?: string;
  question?: string;
  familyName?: string;
  heading?: string;
}

// Friendly labels for every editable type (mirrors structure.ts naming).
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
  closureAlert: 'Alert banner',
  hubPage: 'Family Hub page',
  update: 'Hub update',
  hubDocument: 'Document / Form',
  teacherNote: "Teacher's welcome note",
  presidentNote: "President's note",
  directoryEntry: 'Family Directory',
  signupSheet: 'Sign-up sheet',
  signupEntry: 'Sign-up response',
  coopRole: 'Co-op Role',
  submission: 'Form submission',
  subscriber: 'Newsletter subscriber',
  program: 'Program',
  boardMember: 'Board / leadership',
  partner: 'Partner / sponsor',
  credential: 'Accreditation',
  campaign: 'Fundraising campaign',
  jobPosting: 'Job posting',
  resource: 'Download / resource',
  photoAlbum: 'Photo album',
};

// Everything a human edits (machine-made inbox types are left out on purpose).
const RECENT_TYPES = [
  'page',
  'post',
  'event',
  'legalPage',
  'class',
  'staff',
  'faqItem',
  'testimonial',
  'siteSettings',
  'navigation',
  'feeSchedule',
  'schoolYearEvent',
  'closureAlert',
  'hubPage',
  'update',
  'hubDocument',
  'teacherNote',
  'presidentNote',
  'directoryEntry',
  'signupSheet',
  'coopRole',
  'program',
  'boardMember',
  'partner',
  'credential',
  'campaign',
  'jobPosting',
  'resource',
  'photoAlbum',
];

const RECENT_QUERY = `*[
  _type in $types && !(_id in path("drafts.**"))
] | order(_updatedAt desc)[0...6]{ _id, _type, _updatedAt, title, name, question, familyName, heading }`;

function docLabel(doc: RecentDoc): string {
  return doc.title || doc.name || doc.question || doc.familyName || doc.heading || 'Untitled';
}

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

// The hub's icon-chip tints (soft tint behind a decorative emoji; label text
// stays neutral — same AA convention as HubCard).
const CHIPS = {
  sky: { background: '#e3eef7', color: '#166FA8' },
  amber: { background: '#fdf2d4', color: '#8a6100' },
  green: { background: '#e2f2e6', color: '#0E7B2E' },
  orange: { background: '#fdeadb', color: '#A85300' },
} as const;

function Chip({ tint, children }: { tint: keyof typeof CHIPS; children: ReactNode }) {
  return (
    <span
      aria-hidden
      style={{
        ...CHIPS[tint],
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 34,
        height: 34,
        borderRadius: 10,
        fontSize: 17,
        flexShrink: 0,
      }}
    >
      {children}
    </span>
  );
}

// One task card: icon chip + label + hint, wrapping either an IntentLink
// (document edit/create) or a router-path link (tool / structure pane).
//
// The path variant MUST go through the Studio router, not a raw <a href>:
// the deployed embedded Studio uses HASH routing, where the workspace
// basePath is "/everyday" — a plain anchor to "/everyday/media" leaves the
// Studio and 404s on the public site (bit us live 2026-07-13). Clicks call
// router.navigateUrl (correct in hash AND browser modes); the href is a
// best-effort real URL so middle-click / open-in-new-tab still works.
function TaskCard(props: {
  icon: string;
  tint: keyof typeof CHIPS;
  label: string;
  hint: string;
  intent?: ComponentProps<typeof IntentLink>['intent'];
  params?: Record<string, string>;
  /** Router path incl. workspace basePath, e.g. `${basePath}/media`. */
  path?: string;
}) {
  const { icon, tint, label, hint, intent, params, path } = props;
  const router = useRouter();
  const inner = (
    <Card className="wcp-task-card" padding={3} radius={3} border style={{ height: '100%' }}>
      <Flex align="center" gap={3}>
        <Chip tint={tint}>{icon}</Chip>
        <Stack space={2}>
          <Text size={1} weight="semibold">
            {label}
          </Text>
          <Text size={1} muted>
            {hint}
          </Text>
        </Stack>
      </Flex>
    </Card>
  );
  const linkStyle = { textDecoration: 'none', color: 'inherit', display: 'block' } as const;
  if (intent) {
    return (
      <IntentLink intent={intent} params={params} style={linkStyle}>
        {inner}
      </IntentLink>
    );
  }
  const isHashRouted = typeof window !== 'undefined' && window.location.hash.startsWith('#/');
  const href = isHashRouted ? `${window.location.pathname}#${path}` : path;
  return (
    <a
      href={href}
      style={linkStyle}
      onClick={(event) => {
        // Let modified clicks (new tab etc.) fall through to the href.
        if (event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) return;
        event.preventDefault();
        if (path) router.navigateUrl({ path });
      }}
    >
      {inner}
    </a>
  );
}

export function WelcomePane() {
  const client = useClient({ apiVersion: '2025-01-01' });
  const { basePath } = useWorkspace();
  const [recent, setRecent] = useState<RecentDoc[] | null>(null);

  useEffect(() => {
    let alive = true;
    client
      .fetch<RecentDoc[]>(RECENT_QUERY, { types: RECENT_TYPES })
      .then((docs) => alive && setRecent(docs))
      .catch(() => alive && setRecent([]));
    return () => {
      alive = false;
    };
  }, [client]);

  return (
    <Box padding={4}>
      {/* Hover lift, gated for reduced motion — matches the site's wcp-lift. */}
      <style>{`
        @media (prefers-reduced-motion: no-preference) {
          .wcp-task-card { transition: transform 150ms ease, box-shadow 150ms ease; }
          a:hover .wcp-task-card { transform: translateY(-2px); box-shadow: 0 4px 14px rgba(1, 69, 126, 0.12); }
        }
      `}</style>
      <Stack space={5} style={{ maxWidth: 680, margin: '0 auto' }}>
        <Stack space={3}>
          <Heading size={3} className="wcp-display">
            👋 Welcome to the West Chester Preschool control room
          </Heading>
          <Text size={2} muted style={{ lineHeight: 1.5 }}>
            This is where you edit the website. Nothing goes live until you click{' '}
            <strong>Publish</strong>, so click around and explore. New here? Open{' '}
            <strong>Help &amp; Guide</strong> in the left menu for step-by-step walkthroughs.
          </Text>
        </Stack>

        <Stack space={3}>
          <Text
            size={1}
            weight="semibold"
            muted
            style={{ textTransform: 'uppercase', letterSpacing: '0.04em' }}
          >
            What do you want to do?
          </Text>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
              gap: 12,
            }}
          >
            <TaskCard
              icon="💳"
              tint="green"
              label="Change tuition or fees"
              hint="Prices, deposits, payment info"
              intent="edit"
              params={{ id: 'feeSchedule', type: 'feeSchedule' }}
            />
            <TaskCard
              icon="🚨"
              tint="orange"
              label="Post a closure or alert"
              hint="Snow day? Banner on every page"
              intent="edit"
              params={{ id: 'closureAlert', type: 'closureAlert' }}
            />
            <TaskCard
              icon="📸"
              tint="amber"
              label="Add or manage photos"
              hint="The Media library"
              path={`${basePath}/media`}
            />
            <TaskCard
              icon="📰"
              tint="sky"
              label="Write a news post"
              hint="Shows on the homepage feed"
              intent="create"
              params={{ type: 'post' }}
            />
            <TaskCard
              icon="📅"
              tint="sky"
              label="Add an event"
              hint="Open house, tour, fundraiser"
              intent="create"
              params={{ type: 'event' }}
            />
            <TaskCard
              icon="📣"
              tint="amber"
              label="Post a Family Hub update"
              hint="Announcements for families"
              intent="create"
              params={{ type: 'update' }}
            />
            <TaskCard
              icon="🧱"
              tint="green"
              label="Edit a page"
              hint="The section-by-section builder"
              path={`${basePath}/structure/pages`}
            />
            <TaskCard
              icon="❔"
              tint="sky"
              label="Open the guide"
              hint="Step-by-step walkthroughs"
              path={`${basePath}/structure/help-and-guide`}
            />
          </div>
        </Stack>

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
                <IntentLink
                  key={doc._id}
                  intent="edit"
                  params={{ id: doc._id, type: doc._type }}
                  style={{ textDecoration: 'none', color: 'inherit' }}
                >
                  <Card className="wcp-task-card" padding={3} radius={3} border>
                    <Flex align="center" justify="space-between" gap={3}>
                      <Stack space={1}>
                        <Text size={1} weight="medium">
                          {docLabel(doc)}
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
                </IntentLink>
              ))}
            </Stack>
          )}
        </Stack>
      </Stack>
    </Box>
  );
}
