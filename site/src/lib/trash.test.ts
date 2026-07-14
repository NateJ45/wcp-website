import { describe, it, expect } from 'vitest';
import { trashTitle, serializeForTrash, deserializeFromTrash } from './trash';

describe('trashTitle', () => {
  it('prefers title, then falls through the other name fields', () => {
    expect(trashTitle({ title: 'About Us' })).toBe('About Us');
    expect(trashTitle({ name: 'Twos' })).toBe('Twos');
    expect(trashTitle({ heading: 'Welcome' })).toBe('Welcome');
    expect(trashTitle({ headline: 'Happy birthday!' })).toBe('Happy birthday!');
    expect(trashTitle({ question: 'What are the hours?' })).toBe('What are the hours?');
    expect(trashTitle({ familyName: 'Nixon' })).toBe('Nixon');
  });

  it('falls back to a slug, then to Untitled', () => {
    expect(trashTitle({ slug: { current: 'classes/twos' } })).toBe('classes/twos');
    expect(trashTitle({})).toBe('Untitled');
    expect(trashTitle(null)).toBe('Untitled');
    expect(trashTitle({ title: '   ' })).toBe('Untitled');
  });
});

describe('serialize / deserialize round trip', () => {
  it('preserves content and pins the id to published', () => {
    const doc = {
      _id: 'drafts.page-about',
      _type: 'page',
      _rev: 'abc',
      _createdAt: '2026-01-01',
      _updatedAt: '2026-02-01',
      title: 'About',
      sections: [{ _type: 'heroSection', heading: 'Hi' }],
    };
    const payload = serializeForTrash(doc);
    const restored = deserializeFromTrash(payload);
    expect(restored).toEqual({
      _id: 'page-about',
      _type: 'page',
      title: 'About',
      sections: [{ _type: 'heroSection', heading: 'Hi' }],
    });
  });

  it('serialize pins a draft id to published', () => {
    const payload = serializeForTrash({ _id: 'drafts.x', _type: 'post', title: 'T' });
    expect(JSON.parse(payload)._id).toBe('x');
  });

  it('deserialize strips system fields but keeps _id and _type', () => {
    const restored = deserializeFromTrash(
      JSON.stringify({ _id: 'x', _type: 'post', _rev: 'r', _updatedAt: 'u', title: 'T' }),
    );
    expect(restored).toEqual({ _id: 'x', _type: 'post', title: 'T' });
  });

  it('rejects junk and non-documents', () => {
    expect(deserializeFromTrash('not json')).toBeNull();
    expect(deserializeFromTrash('null')).toBeNull();
    expect(deserializeFromTrash('123')).toBeNull();
    expect(deserializeFromTrash(JSON.stringify({ _type: 'post' }))).toBeNull();
    expect(deserializeFromTrash(JSON.stringify({ _id: 'x' }))).toBeNull();
  });
});
