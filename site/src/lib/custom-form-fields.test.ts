import { describe, it, expect } from 'vitest';
import {
  normalizeCustomFields,
  parseCustomFieldEntries,
  MAX_CUSTOM_FIELDS,
  MAX_FIELD_LENGTH,
} from './custom-form-fields';

describe('normalizeCustomFields', () => {
  it('returns an empty list for anything that is not an array', () => {
    expect(normalizeCustomFields(undefined)).toEqual([]);
    expect(normalizeCustomFields(null)).toEqual([]);
    expect(normalizeCustomFields('nope')).toEqual([]);
  });

  it('keeps a good question and fills the defaults', () => {
    expect(normalizeCustomFields([{ label: '  Your street  ', kind: 'text' }])).toEqual([
      { label: 'Your street', kind: 'text', options: [], required: false },
    ]);
  });

  it('drops a question with no label', () => {
    expect(normalizeCustomFields([{ label: '   ', kind: 'text' }, { kind: 'email' }])).toEqual([]);
  });

  it('drops a dropdown with no choices', () => {
    expect(normalizeCustomFields([{ label: 'Pick one', kind: 'select' }])).toEqual([]);
    expect(normalizeCustomFields([{ label: 'Pick one', kind: 'select', options: ['  '] }])).toEqual(
      [],
    );
  });

  it('keeps a dropdown with choices and trims them', () => {
    expect(
      normalizeCustomFields([
        { label: 'Pick one', kind: 'select', options: [' A ', '', 'B'], required: true },
      ]),
    ).toEqual([{ label: 'Pick one', kind: 'select', options: ['A', 'B'], required: true }]);
  });

  it('falls back to a text box for an unknown kind', () => {
    expect(normalizeCustomFields([{ label: 'Q', kind: 'rocket' }])[0].kind).toBe('text');
  });

  it('caps the list at the maximum number of questions', () => {
    const many = Array.from({ length: MAX_CUSTOM_FIELDS + 5 }, (_, i) => ({
      label: `Q${i}`,
      kind: 'text',
    }));
    expect(normalizeCustomFields(many)).toHaveLength(MAX_CUSTOM_FIELDS);
  });
});

describe('parseCustomFieldEntries', () => {
  it('returns nothing for a form with no editor-defined questions', () => {
    expect(parseCustomFieldEntries([['message', 'hello']])).toEqual({ lines: [], error: null });
  });

  it('builds one line per answered question, in form order', () => {
    const result = parseCustomFieldEntries([
      ['custom_1_label', 'Street'],
      ['custom_1', '12 Elm'],
      ['custom_0_label', 'Nickname'],
      ['custom_0', 'Sam'],
    ]);
    expect(result).toEqual({ lines: ['Nickname: Sam', 'Street: 12 Elm'], error: null });
  });

  it('joins the values of a question that posts more than once', () => {
    const result = parseCustomFieldEntries([
      ['custom_0_label', 'Days'],
      ['custom_0', 'Monday'],
      ['custom_0', 'Friday'],
    ]);
    expect(result.lines).toEqual(['Days: Monday, Friday']);
  });

  it('skips an unanswered optional question', () => {
    const result = parseCustomFieldEntries([
      ['custom_0_label', 'Nickname'],
      ['custom_0', '   '],
    ]);
    expect(result).toEqual({ lines: [], error: null });
  });

  it('rejects an unanswered required question', () => {
    const result = parseCustomFieldEntries([
      ['custom_0_label', 'Nickname'],
      ['custom_0_req', '1'],
      ['custom_0', ''],
    ]);
    expect(result.lines).toEqual([]);
    expect(result.error).toBe('Please answer: Nickname');
  });

  it('treats a required marker that is not "1" as optional', () => {
    const result = parseCustomFieldEntries([
      ['custom_0_label', 'Nickname'],
      ['custom_0_req', '0'],
    ]);
    expect(result.error).toBeNull();
  });

  it('clips a very long answer', () => {
    const result = parseCustomFieldEntries([
      ['custom_0_label', 'Story'],
      ['custom_0', 'x'.repeat(MAX_FIELD_LENGTH + 500)],
    ]);
    expect(result.lines[0]).toBe(`Story: ${'x'.repeat(MAX_FIELD_LENGTH)}`);
  });

  it('rejects a post whose answers are too long in total', () => {
    const entries: Array<[string, string]> = [];
    for (let i = 0; i < 10; i += 1) {
      entries.push([`custom_${i}_label`, `Q${i}`]);
      entries.push([`custom_${i}`, 'y'.repeat(MAX_FIELD_LENGTH)]);
    }
    const result = parseCustomFieldEntries(entries);
    expect(result.lines).toEqual([]);
    expect(result.error).toBe('Your answers are too long. Please shorten them and try again.');
  });

  it('ignores questions past the cap instead of failing', () => {
    const entries: Array<[string, string]> = [];
    for (let i = 0; i < MAX_CUSTOM_FIELDS + 4; i += 1) {
      entries.push([`custom_${i}_label`, `Q${i}`]);
      entries.push([`custom_${i}`, 'a']);
    }
    const result = parseCustomFieldEntries(entries);
    expect(result.error).toBeNull();
    expect(result.lines).toHaveLength(MAX_CUSTOM_FIELDS);
  });

  it('ignores a value that has no question label', () => {
    expect(parseCustomFieldEntries([['custom_3', 'orphan']])).toEqual({ lines: [], error: null });
  });

  it('ignores names that only look like a question field', () => {
    const result = parseCustomFieldEntries([
      ['custom_abc_label', 'Fake'],
      ['custom_0_labelx', 'Fake'],
      ['custom_9999_label', 'Fake'],
    ]);
    expect(result).toEqual({ lines: [], error: null });
  });
});
