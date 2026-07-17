import { describe, it, expect } from 'vitest';
import { parsePhoneList } from './phone-list';

describe('parsePhoneList', () => {
  it('parses the health page emergency-numbers card', () => {
    const body =
      'Emergency 911 · Police (513) 777-2231 · Fire (513) 777-1133 · ' +
      'Poison Control (800) 222-1222 · Cincinnati Children’s Liberty (513) 803-9600 · ' +
      'West Chester Hospital (513) 298-3000 · Crestview office (513) 777-6555.';
    const entries = parsePhoneList(body);
    expect(entries).not.toBeNull();
    expect(entries).toHaveLength(7);
    expect(entries![0]).toEqual({ label: 'Emergency', display: '911', tel: '911' });
    expect(entries![1]).toEqual({
      label: 'Police',
      display: '(513) 777-2231',
      tel: '5137772231',
    });
    // Trailing period on the last entry is stripped from the number.
    expect(entries![6]).toEqual({
      label: 'Crestview office',
      display: '(513) 777-6555',
      tel: '5137776555',
    });
  });

  it('handles bullets and pipes as separators', () => {
    expect(parsePhoneList('Front desk (555) 111-2222 | Nurse (555) 333-4444')).toHaveLength(2);
    expect(parsePhoneList('A (555) 111-2222 • B (555) 333-4444')).toHaveLength(2);
  });

  it('allows one trailing non-number note', () => {
    const entries = parsePhoneList('Office (555) 111-2222 · Cell (555) 333-4444 · call any time');
    expect(entries).toHaveLength(2);
  });

  it('returns null for prose with a single incidental number', () => {
    expect(
      parsePhoneList('Call the office at (555) 111-2222 if your child will be absent.'),
    ).toBeNull();
  });

  it('returns null for ordinary middot prose (no numbers)', () => {
    expect(parsePhoneList('Warm · patient · play-based')).toBeNull();
  });

  it('returns null for empty or missing bodies', () => {
    expect(parsePhoneList('')).toBeNull();
    expect(parsePhoneList(undefined)).toBeNull();
  });
});
