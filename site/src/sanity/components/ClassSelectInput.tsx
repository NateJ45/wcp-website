import { useCallback, useEffect, useState } from 'react';
import { set, unset, useClient, type StringInputProps } from 'sanity';
import { Select } from '@sanity/ui';

// =============================================================================
// ClassSelectInput — a class dropdown that reads the live Class documents
// =============================================================================
// Used on fields that target a class (update.audience, directoryEntry child
// class). Instead of a hardcoded enum of the current four classes, it fetches
// the Class docs so adding a fifth class (a Summer class, a new session) makes
// it appear here automatically — no code change. The stored VALUE is the class
// slug (e.g. "twos"), exactly what the old enum stored, so this is fully
// backward-compatible with existing documents and with the rendering code that
// filters by slug. Two variants share the fetch:
//   - ClassAudienceInput: prepends "All families" (value "all").
//   - ClassPickInput:     classes only (a blank "— pick —" first).
// =============================================================================

interface ClassOption {
  title: string;
  value: string;
}

const CLASSES_QUERY = `*[_type == "class" && defined(slug.current)] | order(orderRank){ "value": slug.current, "title": name }`;

function useClassOptions(): { options: ClassOption[]; loading: boolean } {
  const client = useClient({ apiVersion: '2025-01-01' });
  const [options, setOptions] = useState<ClassOption[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    client
      .fetch<ClassOption[]>(CLASSES_QUERY)
      .then((rows) => {
        if (!alive) return;
        setOptions(rows.filter((r) => r.value && r.title));
        setLoading(false);
      })
      .catch(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [client]);

  return { options, loading };
}

// A dropdown that keeps the current value even if its class isn't in the fetched
// list yet (loading, or a since-removed class), so nothing is silently dropped.
function ClassSelect({ props, leadOption }: { props: StringInputProps; leadOption: ClassOption }) {
  const { value, onChange, elementProps, readOnly } = props;
  const { options, loading } = useClassOptions();

  const handleChange = useCallback(
    (event: React.ChangeEvent<HTMLSelectElement>) => {
      const next = event.currentTarget.value;
      onChange(next ? set(next) : unset());
    },
    [onChange],
  );

  // Ensure the stored value is always selectable (e.g. an old "pre-k-am" whose
  // class doc was renamed/removed) so it isn't lost on the next edit.
  const known = new Set([leadOption.value, ...options.map((o) => o.value)]);
  const extra = value && !known.has(value) ? [{ title: value, value }] : [];

  return (
    <Select
      {...elementProps}
      value={value ?? leadOption.value}
      onChange={handleChange}
      readOnly={readOnly || loading}
    >
      <option value={leadOption.value}>{leadOption.title}</option>
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.title}
        </option>
      ))}
      {extra.map((o) => (
        <option key={o.value} value={o.value}>
          {o.title} (removed class)
        </option>
      ))}
    </Select>
  );
}

/** For "Who is this for?" — includes an "All families" option. */
export function ClassAudienceInput(props: StringInputProps) {
  return <ClassSelect props={props} leadOption={{ title: 'All families', value: 'all' }} />;
}

/** For picking a single class — a blank lead option. */
export function ClassPickInput(props: StringInputProps) {
  return <ClassSelect props={props} leadOption={{ title: '— pick a class —', value: '' }} />;
}
