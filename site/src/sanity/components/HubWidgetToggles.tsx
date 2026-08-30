// =============================================================================
// HubWidgetToggles — on/off switches for a hub page's built-in tiles
// =============================================================================
// The custom input for hubPage.hiddenWidgets. The FIELD stores what is OFF (an
// empty array = everything on, so old documents and new widgets need no
// migration — see src/lib/hub-widgets.ts), but the Board thinks in "is this
// widget on?", so each row here is a Switch that is ON when the value is NOT
// stored. Which switches exist comes from the shared registry, keyed by the
// document's hubKey; a page with no registered widgets hides the whole field
// (the schema's `hidden` callback uses the same registry).
// =============================================================================
import { useCallback } from 'react';
import { Card, Flex, Stack, Switch, Text } from '@sanity/ui';
import { set, unset, useFormValue, type ArrayOfPrimitivesInputProps } from 'sanity';
import { widgetOptionsFor } from '../../lib/hub-widgets';

export function HubWidgetToggles(props: ArrayOfPrimitivesInputProps) {
  const { value, onChange } = props;
  const hubKey = useFormValue(['hubKey']) as string | undefined;
  const options = widgetOptionsFor(hubKey);
  const hidden = new Set((value ?? []).filter((v): v is string => typeof v === 'string'));

  const toggle = useCallback(
    (widget: string, on: boolean) => {
      const next = new Set((value ?? []).filter((v): v is string => typeof v === 'string'));
      if (on) next.delete(widget);
      else next.add(widget);
      // Everything on is stored as NO value, not [], so a doc that has never
      // been touched and a doc toggled back to all-on look identical.
      onChange(next.size === 0 ? unset() : set([...next]));
    },
    [value, onChange],
  );

  if (options.length === 0) {
    return (
      <Text muted size={1}>
        This page has no switchable widgets.
      </Text>
    );
  }

  return (
    <Stack space={2}>
      {options.map((opt) => {
        const on = !hidden.has(opt.value);
        return (
          <Card key={opt.value} padding={3} radius={2} border tone={on ? 'default' : 'transparent'}>
            <Flex align="center" gap={3}>
              <Switch
                checked={on}
                onChange={() => toggle(opt.value, !on)}
                aria-label={`${opt.title} — ${on ? 'shown' : 'hidden'}`}
              />
              <Text size={1} weight="medium" muted={!on}>
                {opt.title}
              </Text>
            </Flex>
          </Card>
        );
      })}
    </Stack>
  );
}
