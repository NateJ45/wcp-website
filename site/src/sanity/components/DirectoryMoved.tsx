import { Card, Heading, Stack, Text } from '@sanity/ui';

/**
 * The Family Directory pane, after the directory left Sanity.
 *
 * WHY THIS EXISTS RATHER THAN JUST DELETING THE PANE
 *
 * The directory's data moved to Cloudflare KV on 2026-09-06, because this
 * dataset is PUBLIC on Sanity's free plan: an anonymous query with no token
 * returned all 37 families, including 40 children's names and 33 home
 * addresses, straight past the Family Hub's login. The documents that remain
 * are empty shells.
 *
 * Deleting the pane outright would leave a board member hunting for a directory
 * that used to be right here. Worse, leaving the OLD pane would have shown 37
 * blank documents and invited someone to helpfully retype the families back
 * into a public dataset. So the pane stays and says where the directory went.
 */
export default function DirectoryMoved() {
  return (
    <Card padding={4}>
      <Stack space={4}>
        <Heading size={2}>The Family Directory moved</Heading>

        <Text size={2}>
          Families&rsquo; details are no longer edited in the Studio. They now live behind the
          Family Hub login, at:
        </Text>

        <Card padding={3} radius={2} tone="primary">
          <Text size={2} weight="semibold">
            yourwebsite.org/family-hub/admin
          </Text>
        </Card>

        <Text size={2}>
          Sign in to the hub as usual, then enter the <strong>board password</strong> — a second
          password, separate from the one families use. Ask the board president if you do not have
          it.
        </Text>

        <Text size={2}>
          You can edit there: every family, their grown-ups and children, photos, teachers&rsquo;
          phone numbers, and which family each co-op role is reached through.
        </Text>

        <Heading size={1}>Why it moved</Heading>
        <Text size={2} muted>
          This Studio&rsquo;s content is stored in a database that is public to anyone who knows the
          website&rsquo;s project id — which is visible in the page source of every page. That is
          fine for pages, photos and newsletters, which are published anyway. It was not fine for
          families&rsquo; addresses and children&rsquo;s names, which were readable by anyone even
          though the Family Hub itself was properly locked.
        </Text>

        <Heading size={1}>What stays here</Heading>
        <Text size={2} muted>
          Everything the public website shows: pages, updates, documents, class information, co-op
          roles, teachers&rsquo; welcome notes and their school email addresses. Only personal
          details moved.
        </Text>
      </Stack>
    </Card>
  );
}
