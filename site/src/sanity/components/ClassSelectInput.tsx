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

// =============================================================================
// ClassroomPickInput — for things filed against a CLASS PAGE, not a class
// =============================================================================
// The teacher's welcome note and the curriculum guides belong to a class PAGE:
// Twos and Threes share Ms. Erin's note, and both Pre-K classes share one
// curriculum guide. The hub therefore looks these documents up under the page's
// address first and each class's slug second (src/lib/hub-classrooms.ts,
// `teacherNoteKeys`), so this dropdown offers both kinds of value — every
// classroom page that covers more than one class, then every class on its own.
// It used to be a hardcoded list of three, which is why a class the Board added
// could not be given a welcome note at all.
// =============================================================================
const CLASSROOMS_QUERY = `{
  "pages": *[_type == "hubPage" && count(classes) > 1 && archived != true]{
    "value": coalesce(hubKey, slug), "title": coalesce(heading, title)
  },
  "classes": *[_type == "class" && defined(slug.current)] | order(orderRank){
    "value": slug.current, "title": name
  }
}`;

function useClassroomOptions(): { options: ClassOption[]; loading: boolean } {
  const client = useClient({ apiVersion: '2025-01-01' });
  const [options, setOptions] = useState<ClassOption[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    client
      .fetch<{ pages?: ClassOption[]; classes?: ClassOption[] }>(CLASSROOMS_QUERY)
      .then((res) => {
        if (!alive) return;
        const seen = new Set<string>();
        const rows: ClassOption[] = [];
        for (const row of [...(res?.pages ?? []), ...(res?.classes ?? [])]) {
          if (!row?.value || !row?.title || seen.has(row.value)) continue;
          seen.add(row.value);
          rows.push(row);
        }
        setOptions(rows);
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

/** For picking which class PAGE a note or a guide belongs to. */
export function ClassroomPickInput(props: StringInputProps) {
  const { value, onChange, elementProps, readOnly } = props;
  const { options, loading } = useClassroomOptions();

  const handleChange = useCallback(
    (event: React.ChangeEvent<HTMLSelectElement>) => {
      const next = event.currentTarget.value;
      onChange(next ? set(next) : unset());
    },
    [onChange],
  );

  // Keep the stored value selectable even when it matches nothing yet (still
  // loading, or a page whose classes changed), so it is never silently lost.
  const known = new Set(options.map((o) => o.value));
  const extra = value && !known.has(value) ? [{ title: value, value }] : [];

  return (
    <Select
      {...elementProps}
      value={value ?? ''}
      onChange={handleChange}
      readOnly={readOnly || loading}
    >
      <option value="">— pick a class page —</option>
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.title}
        </option>
      ))}
      {extra.map((o) => (
        <option key={o.value} value={o.value}>
          {o.title} (no longer a class page)
        </option>
      ))}
    </Select>
  );
}

// =============================================================================
// RoleSelectInput — the org-chart seats, plus one rep seat per LIVE class
// =============================================================================
// The role dropdown was a fixed list, so a class the Board added could never be
// given a class rep: its page showed the designed "To be announced" card
// forever, with no way in the Studio to fill it. The fixed seats stay fixed
// (the org chart draws those in code), and one "<Class name> Rep" option is
// derived per class, so the rep card on a new class page can be filled in the
// same day. A stored value that matches nothing stays selectable, so renaming a
// class never silently drops the person holding its seat.
// =============================================================================
const CLASS_NAMES_QUERY = `*[_type == "class" && defined(name)] | order(orderRank).name`;

export function makeRoleSelectInput(fixedRoles: readonly string[]) {
  return function RoleSelectInput(props: StringInputProps) {
    const { value, onChange, elementProps, readOnly } = props;
    const client = useClient({ apiVersion: '2025-01-01' });
    const [classRoles, setClassRoles] = useState<string[]>([]);

    useEffect(() => {
      let alive = true;
      client
        .fetch<string[]>(CLASS_NAMES_QUERY)
        .then((names) => {
          if (alive) setClassRoles((names ?? []).filter(Boolean).map((n) => `${n} Rep`));
        })
        .catch(() => {
          /* keep the fixed seats; a failed read must not empty the dropdown */
        });
      return () => {
        alive = false;
      };
    }, [client]);

    const handleChange = useCallback(
      (event: React.ChangeEvent<HTMLSelectElement>) => {
        const next = event.currentTarget.value;
        onChange(next ? set(next) : unset());
      },
      [onChange],
    );

    const seen = new Set<string>();
    const options = [...fixedRoles, ...classRoles].filter((r) => {
      if (seen.has(r)) return false;
      seen.add(r);
      return true;
    });
    const extra = value && !options.includes(value) ? [value] : [];

    return (
      <Select {...elementProps} value={value ?? ''} onChange={handleChange} readOnly={readOnly}>
        <option value="">— pick a role —</option>
        {options.map((r) => (
          <option key={r} value={r}>
            {r}
          </option>
        ))}
        {extra.map((r) => (
          <option key={r} value={r}>
            {r} (no longer on the list)
          </option>
        ))}
      </Select>
    );
  };
}
