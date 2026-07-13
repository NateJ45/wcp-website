import { useCallback, useState } from 'react';
import { useClient } from 'sanity';
import {
  Box,
  Button,
  Card,
  Flex,
  Heading,
  Radio,
  Select,
  Stack,
  Text,
  TextInput,
} from '@sanity/ui';

// =============================================================================
// CleanupTool — clear out old inbox records, safely (Everything workspace)
// =============================================================================
// Form submissions and sign-up responses pile up year over year. Sanity's free
// plan has no bulk delete, so clearing last season's 200 RSVPs meant deleting
// them one at a time. This tool does it in one go, with guardrails because it
// is PERMANENT:
//   1. You pick WHAT and HOW OLD; nothing recent is ever eligible.
//   2. "Check" shows the exact count first — no blind deletes.
//   3. You must type DELETE to arm the button.
//   4. A reminder to export first (the Export tool) for your own records.
// Only ever targets the read-only inbox types (submissions, sign-up responses),
// never editable content. Handled contact messages only; sign-up responses by
// age. Both have no incoming references, so deleting them can't dangle a link.
// =============================================================================

type Target = {
  id: string;
  label: string;
  hint: string;
  /** GROQ predicate (after `_type == ...`) using $cutoff. */
  filter: (type: string) => string;
  type: string;
};

const TARGETS: Target[] = [
  {
    id: 'handled-submissions',
    type: 'submission',
    label: 'Form messages already marked Handled',
    hint: 'Contact-form messages you have replied to and checked off.',
    filter: (t) => `_type == "${t}" && handled == true && submittedAt < $cutoff`,
  },
  {
    id: 'signup-responses',
    type: 'signupEntry',
    label: 'Sign-up / RSVP responses',
    hint: 'Responses families submitted to sign-up sheets and RSVPs.',
    filter: (t) => `_type == "${t}" && submittedAt < $cutoff`,
  },
];

const AGES: { id: string; label: string; months: number }[] = [
  { id: '6m', label: 'older than 6 months', months: 6 },
  { id: '1y', label: 'older than 1 year', months: 12 },
  { id: '2y', label: 'older than 2 years', months: 24 },
];

// ISO cutoff for "older than N months" from today (browser clock is fine here).
function cutoffIso(months: number): string {
  const d = new Date();
  d.setMonth(d.getMonth() - months);
  return d.toISOString();
}

export function CleanupTool() {
  const client = useClient({ apiVersion: '2025-01-01' });
  const [targetId, setTargetId] = useState(TARGETS[0].id);
  const [ageId, setAgeId] = useState(AGES[1].id);
  const [count, setCount] = useState<number | null>(null);
  const [confirmText, setConfirmText] = useState('');
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('');

  const target = TARGETS.find((t) => t.id === targetId)!;
  const age = AGES.find((a) => a.id === ageId)!;

  // Re-checking resets the confirmation, so a count always matches the pending delete.
  const resetCheck = useCallback(() => {
    setCount(null);
    setConfirmText('');
    setStatus('');
  }, []);

  const check = useCallback(async () => {
    setBusy(true);
    setStatus('');
    setConfirmText('');
    try {
      const cutoff = cutoffIso(age.months);
      const n = await client.fetch<number>(`count(*[${target.filter(target.type)}])`, { cutoff });
      setCount(n);
    } catch {
      setStatus('Could not check. Try again, or ask Nathan.');
      setCount(null);
    } finally {
      setBusy(false);
    }
  }, [client, target, age]);

  const del = useCallback(async () => {
    if (confirmText.trim().toUpperCase() !== 'DELETE' || !count) return;
    setBusy(true);
    setStatus('');
    try {
      const cutoff = cutoffIso(age.months);
      // Re-scope by the same filter at delete time; delete by query in one call.
      await client.delete({ query: `*[${target.filter(target.type)}]`, params: { cutoff } });
      setStatus(`Deleted ${count} ${count === 1 ? 'record' : 'records'}.`);
      setCount(null);
      setConfirmText('');
    } catch {
      setStatus('Delete failed. Nothing was removed — try again or ask Nathan.');
    } finally {
      setBusy(false);
    }
  }, [client, target, age, count, confirmText]);

  const armed = confirmText.trim().toUpperCase() === 'DELETE' && !!count;

  return (
    <Box padding={4}>
      <Stack space={5} style={{ maxWidth: 620, margin: '0 auto' }}>
        <Stack space={3}>
          <Heading size={3} className="wcp-display">
            🧹 Clean up old records
          </Heading>
          <Text size={2} muted style={{ lineHeight: 1.5 }}>
            Permanently remove old form messages and sign-up responses in one go. This can’t be
            undone, so it checks the count first and asks you to confirm.
          </Text>
        </Stack>

        <Card padding={4} radius={3} tone="caution" border>
          <Text size={1} style={{ lineHeight: 1.5 }}>
            Want a copy before deleting? Use the <strong>Export</strong> tool first to download
            these as a spreadsheet.
          </Text>
        </Card>

        <Card padding={4} radius={3} border>
          <Stack space={4}>
            <Stack space={3}>
              <Text size={1} weight="semibold">
                What to clear
              </Text>
              {TARGETS.map((t) => (
                <Flex
                  key={t.id}
                  as="label"
                  align="flex-start"
                  gap={3}
                  style={{ cursor: 'pointer' }}
                >
                  <Radio
                    checked={targetId === t.id}
                    name="cleanup-target"
                    onChange={() => {
                      setTargetId(t.id);
                      resetCheck();
                    }}
                    value={t.id}
                  />
                  <Stack space={2}>
                    <Text size={2} weight="semibold">
                      {t.label}
                    </Text>
                    <Text size={1} muted>
                      {t.hint}
                    </Text>
                  </Stack>
                </Flex>
              ))}
            </Stack>

            <Stack space={2}>
              <Text size={1} weight="semibold">
                How old
              </Text>
              <Select
                value={ageId}
                onChange={(e) => {
                  setAgeId(e.currentTarget.value);
                  resetCheck();
                }}
              >
                {AGES.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.label}
                  </option>
                ))}
              </Select>
            </Stack>

            <Flex align="center" gap={3}>
              <Button text="Check how many" mode="ghost" disabled={busy} onClick={check} />
              {count !== null && (
                <Text size={1} weight="semibold">
                  {count === 0
                    ? 'Nothing that old to clear.'
                    : `${count} ${count === 1 ? 'record' : 'records'} match.`}
                </Text>
              )}
            </Flex>
          </Stack>
        </Card>

        {count !== null && count > 0 && (
          <Card padding={4} radius={3} tone="critical" border>
            <Stack space={4}>
              <Text size={1} style={{ lineHeight: 1.5 }}>
                To permanently delete these <strong>{count}</strong> records, type{' '}
                <strong>DELETE</strong> below, then press the button.
              </Text>
              <TextInput
                value={confirmText}
                onChange={(e) => setConfirmText(e.currentTarget.value)}
                placeholder="Type DELETE"
              />
              <Flex align="center" gap={3}>
                <Button
                  text={busy ? 'Deleting…' : `Delete ${count} records`}
                  tone="critical"
                  disabled={busy || !armed}
                  onClick={del}
                />
              </Flex>
            </Stack>
          </Card>
        )}

        {status && (
          <Text size={1} muted>
            {status}
          </Text>
        )}
      </Stack>
    </Box>
  );
}
