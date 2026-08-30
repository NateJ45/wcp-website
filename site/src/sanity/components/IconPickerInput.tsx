// =============================================================================
// IconPickerInput — pick an icon by SEEING it, not by reading its name
// =============================================================================
// The custom input for every icon-name string field (hubPage.navIcon, the hub
// menu's link icons, and each section's iconField). The plain dropdown showed
// only labels — "Balance scale", "Megaphone" — so a volunteer had to pick
// blind and check the page. This renders the site's own inline SVG bodies
// (src/lib/lucide-icons.ts / brand-icons.ts — the exact markup <Icon> ships)
// in a grid of labelled buttons, current choice highlighted.
//
// The VALUE list still comes from the schema's own options.list, so this
// component can never offer an icon the field would refuse, and any field
// without a list falls back to the default input untouched.
// =============================================================================
import { useCallback, useEffect, useRef } from 'react';
import { Button, Card, Grid, Stack, Text, Tooltip } from '@sanity/ui';
import { set, unset, type StringInputProps, type TitledListValue } from 'sanity';
import { lucideIcons } from '../../lib/lucide-icons';
import { brandIcons } from '../../lib/brand-icons';

const SVG_NS = 'http://www.w3.org/2000/svg';

function IconSvg({ name }: { name: string }) {
  const ref = useRef<SVGSVGElement>(null);
  const body = lucideIcons[name] ?? brandIcons[name];
  useEffect(() => {
    const host = ref.current;
    if (!host) return;
    // The pre-inlined bodies our own <Icon>.astro renders with set:html —
    // trusted markup committed to this repo, never user- or dataset-supplied
    // (the name is checked against the two maps above; nothing else renders).
    // Parsed with DOMParser and imported node-by-node, the safe-DOM route.
    const parsed = new DOMParser().parseFromString(
      `<svg xmlns="${SVG_NS}">${body ?? ''}</svg>`,
      'image/svg+xml',
    );
    const root = parsed.documentElement;
    if (parsed.querySelector('parsererror')) return;
    host.replaceChildren(...Array.from(root.childNodes, (n) => document.importNode(n, true)));
  }, [body]);
  if (!body) return null;
  return <svg ref={ref} viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" />;
}

export function IconPickerInput(props: StringInputProps) {
  const { value, onChange, schemaType, renderDefault } = props;
  const list = (schemaType.options?.list ?? []) as Array<TitledListValue<string> | string>;
  const options = list.map((item) =>
    typeof item === 'string' ? { title: item, value: item } : item,
  );

  const pick = useCallback(
    (next: string) => onChange(next === value ? unset() : set(next)),
    [onChange, value],
  );

  // A field without a list is not ours to reinvent.
  if (options.length === 0) return renderDefault(props);

  return (
    <Stack space={2}>
      <Card border radius={2} padding={2} style={{ maxHeight: '260px', overflowY: 'auto' }}>
        <Grid columns={[4, 5, 6]} gap={1}>
          {options.map((opt) => {
            const selected = opt.value === value;
            return (
              <Tooltip
                key={opt.value}
                content={<Text size={1}>{opt.title}</Text>}
                placement="top"
                portal
              >
                <Button
                  mode={selected ? 'default' : 'bleed'}
                  tone={selected ? 'primary' : 'default'}
                  padding={2}
                  onClick={() => pick(opt.value!)}
                  aria-label={opt.title}
                  aria-pressed={selected}
                >
                  <IconSvg name={opt.value!} />
                </Button>
              </Tooltip>
            );
          })}
        </Grid>
      </Card>
      <Text size={1} muted>
        {value
          ? `Chosen: ${options.find((o) => o.value === value)?.title ?? value}`
          : 'Pick a little picture. Click the chosen one again to clear it.'}
      </Text>
    </Stack>
  );
}
