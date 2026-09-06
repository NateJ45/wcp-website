// =============================================================================
// HubWidgetTextInput — rewrite a widget's title/one-liner without a developer
// =============================================================================
// The custom input for hubPage.widgetText (P3, 2026-08-31). The registry
// (src/lib/hub-widgets.ts) says which widgets have decorative wording worth
// overriding and which boxes each gets; this renders one row per such widget.
// An empty box means "the wording the site shipped with" — clearing a box is
// how a Board undoes an override, and a row whose boxes are all empty is
// removed from storage so untouched documents stay untouched.
// =============================================================================
import { useCallback } from 'react';
import { Card, Stack, Text, TextInput } from '@sanity/ui';
import { set, unset, useFormValue, type ArrayOfObjectsInputProps } from 'sanity';
import { widgetOptionsFor, type HubWidgetText } from '../../lib/hub-widgets';

type Row = HubWidgetText & { _key?: string };

export function HubWidgetTextInput(props: ArrayOfObjectsInputProps) {
  const { value, onChange } = props;
  const hubKey = useFormValue(['hubKey']) as string | undefined;
  const options = widgetOptionsFor(hubKey).filter((o) => o.text);
  const rows = (value ?? []) as Row[];
  const rowFor = (widget: string) => rows.find((r) => r.widget === widget);

  const write = useCallback(
    (widget: string, field: 'title' | 'blurb', text: string) => {
      const next: Row[] = (value ?? []) as Row[];
      const existing = next.find((r) => r.widget === widget);
      const updated: Row = { ...(existing ?? { _key: widget, widget }), [field]: text };
      const merged = existing
        ? next.map((r) => (r.widget === widget ? updated : r))
        : [...next, updated];
      // Rows with nothing in them are storage noise — drop them, and when the
      // last one goes, unset the whole field so the doc reads as untouched.
      const kept = merged.filter(
        (r) => (r.title ?? '').trim() !== '' || (r.blurb ?? '').trim() !== '',
      );
      onChange(kept.length === 0 ? unset() : set(kept));
    },
    [value, onChange],
  );

  if (options.length === 0) {
    return (
      <Text muted size={1}>
        This page has no rewordable widgets.
      </Text>
    );
  }

  return (
    <Stack space={3}>
      {options.map((opt) => {
        const row = rowFor(opt.value);
        return (
          <Card key={opt.value} padding={3} radius={2} border>
            <Stack space={2}>
              <Text size={1} weight="semibold">
                {opt.title}
              </Text>
              {opt.text?.title && (
                <TextInput
                  value={row?.title ?? ''}
                  placeholder="Title — empty keeps the standard one"
                  onChange={(e) => write(opt.value, 'title', e.currentTarget.value)}
                  aria-label={`${opt.title} — title`}
                />
              )}
              {opt.text?.blurb && (
                <TextInput
                  value={row?.blurb ?? ''}
                  placeholder="One-liner — empty keeps the standard one"
                  onChange={(e) => write(opt.value, 'blurb', e.currentTarget.value)}
                  aria-label={`${opt.title} — one-liner`}
                />
              )}
            </Stack>
          </Card>
        );
      })}
    </Stack>
  );
}
