import { useCallback, useState } from 'react';
import { useClient } from 'sanity';
import { Box, Button, Card, Flex, Heading, Radio, Stack, Text } from '@sanity/ui';

// =============================================================================
// ExportTool — download your lists as a spreadsheet (CSV), no developer needed
// =============================================================================
// A Studio tool (both workspaces) that lets the board get their data OUT:
// newsletter subscribers, form submissions, and the family directory. It runs
// entirely in the already-signed-in Studio using the current user's session
// (useClient) — no new endpoint, no token handling — fetches the documents,
// turns them into a CSV, and triggers a browser download. This is the
// off-boarding safety net (move email providers, hand off to next year's
// secretary, keep your own copy).
//
// The directory export includes PII (names, contacts) — that's the point, and
// it's the same data an Administrator already sees in the Studio.
// =============================================================================

type Column = { header: string; get: (doc: Record<string, unknown>) => string };

type Dataset = {
  id: string;
  label: string;
  hint: string;
  query: string;
  columns: Column[];
};

const str = (v: unknown): string => (v == null ? '' : String(v));
const dateOnly = (v: unknown): string => {
  const s = str(v);
  return s ? new Date(s).toLocaleDateString('en-US') : '';
};

const CLASS_LABELS: Record<string, string> = {
  twos: 'Twos',
  threes: 'Threes',
  'pre-k-am': 'Pre-K AM',
  'pre-k-pm': 'Pre-K PM',
};

const DATASETS: Dataset[] = [
  {
    id: 'subscribers',
    label: 'Newsletter subscribers',
    hint: 'Email, name, when they signed up.',
    query: `*[_type == "subscriber"] | order(subscribedAt desc){ email, name, source, subscribedAt }`,
    columns: [
      { header: 'Email', get: (d) => str(d.email) },
      { header: 'Name', get: (d) => str(d.name) },
      { header: 'Signed up from', get: (d) => str(d.source) },
      { header: 'Subscribed', get: (d) => dateOnly(d.subscribedAt) },
    ],
  },
  {
    id: 'submissions',
    label: 'Form submissions',
    hint: 'Every message families have sent through the forms.',
    query: `*[_type == "submission"] | order(submittedAt desc){ name, email, phone, topic, message, pageUrl, submittedAt, handled }`,
    columns: [
      { header: 'Received', get: (d) => dateOnly(d.submittedAt) },
      { header: 'Form', get: (d) => str(d.topic) },
      { header: 'Name', get: (d) => str(d.name) },
      { header: 'Email', get: (d) => str(d.email) },
      { header: 'Phone', get: (d) => str(d.phone) },
      { header: 'Message', get: (d) => str(d.message) },
      { header: 'From page', get: (d) => str(d.pageUrl) },
      { header: 'Handled', get: (d) => (d.handled ? 'Yes' : 'No') },
    ],
  },
  {
    id: 'directory',
    label: 'Family directory (private)',
    hint: 'Family names, adults, children, contacts. Contains private info.',
    query: `*[_type == "directoryEntry"] | order(familyName asc){ familyName, optedIn, parents, children, address, notes }`,
    columns: [
      { header: 'Family', get: (d) => str(d.familyName) },
      { header: 'Shown in directory', get: (d) => (d.optedIn ? 'Yes' : 'No') },
      {
        header: 'Adults',
        get: (d) =>
          (Array.isArray(d.parents) ? d.parents : [])
            .map((p: Record<string, unknown>) => {
              const bits = [
                str(p.name),
                p.role ? `(${str(p.role)})` : '',
                str(p.email),
                str(p.phone),
              ];
              return bits.filter(Boolean).join(' ');
            })
            .join('; '),
      },
      {
        header: 'Children',
        get: (d) =>
          (Array.isArray(d.children) ? d.children : [])
            .map((c: Record<string, unknown>) => {
              const cls = CLASS_LABELS[str(c.class)] ?? str(c.class);
              return [str(c.name), cls ? `(${cls})` : ''].filter(Boolean).join(' ');
            })
            .join('; '),
      },
      { header: 'Address', get: (d) => str(d.address) },
      { header: 'Notes', get: (d) => str(d.notes) },
    ],
  },
];

// RFC-4180-ish CSV escaping: wrap in quotes if the cell has a comma, quote, or
// newline; double any inner quotes. Prefix a BOM so Excel reads UTF-8 right.
function toCsv(columns: Column[], rows: Record<string, unknown>[]): string {
  const esc = (cell: string) => (/[",\n\r]/.test(cell) ? `"${cell.replace(/"/g, '""')}"` : cell);
  const lines = [columns.map((c) => esc(c.header)).join(',')];
  for (const row of rows) lines.push(columns.map((c) => esc(c.get(row))).join(','));
  return '﻿' + lines.join('\r\n');
}

export function ExportTool() {
  const client = useClient({ apiVersion: '2025-01-01' });
  const [selected, setSelected] = useState<string>(DATASETS[0].id);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string>('');

  const download = useCallback(async () => {
    const ds = DATASETS.find((d) => d.id === selected);
    if (!ds) return;
    setBusy(true);
    setStatus('');
    try {
      const rows = await client.fetch<Record<string, unknown>[]>(ds.query);
      if (!rows.length) {
        setStatus(`No ${ds.label.toLowerCase()} to export yet.`);
        return;
      }
      const csv = toCsv(ds.columns, rows);
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const stamp = new Date().toISOString().slice(0, 10);
      const a = document.createElement('a');
      a.href = url;
      a.download = `wcp-${ds.id}-${stamp}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      setStatus(`Downloaded ${rows.length} ${rows.length === 1 ? 'row' : 'rows'}.`);
    } catch {
      setStatus('Sorry, that export failed. Try again, or check with Nathan.');
    } finally {
      setBusy(false);
    }
  }, [client, selected]);

  return (
    <Box padding={4}>
      <Stack space={5} style={{ maxWidth: 620, margin: '0 auto' }}>
        <Stack space={3}>
          <Heading size={3} className="wcp-display">
            📤 Export a list
          </Heading>
          <Text size={2} muted style={{ lineHeight: 1.5 }}>
            Download one of your lists as a spreadsheet file (CSV) you can open in Excel or Google
            Sheets, import into a new email tool, or just keep a copy of. It opens the file right in
            your browser.
          </Text>
        </Stack>

        <Card padding={4} radius={3} border>
          <Stack space={4}>
            {DATASETS.map((ds) => (
              <Flex key={ds.id} as="label" align="flex-start" gap={3} style={{ cursor: 'pointer' }}>
                <Radio
                  checked={selected === ds.id}
                  name="export-dataset"
                  onChange={() => setSelected(ds.id)}
                  value={ds.id}
                />
                <Stack space={2}>
                  <Text size={2} weight="semibold">
                    {ds.label}
                  </Text>
                  <Text size={1} muted>
                    {ds.hint}
                  </Text>
                </Stack>
              </Flex>
            ))}
          </Stack>
        </Card>

        <Flex align="center" gap={3}>
          <Button
            text={busy ? 'Preparing…' : 'Download CSV'}
            tone="primary"
            disabled={busy}
            onClick={download}
          />
          {status && (
            <Text size={1} muted>
              {status}
            </Text>
          )}
        </Flex>

        <Text size={1} muted style={{ lineHeight: 1.5 }}>
          The family directory export includes private contact details. Keep the downloaded file
          somewhere safe, and delete it when you no longer need it.
        </Text>
      </Stack>
    </Box>
  );
}
