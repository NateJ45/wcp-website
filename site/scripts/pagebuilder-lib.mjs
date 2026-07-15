// =============================================================================
// Page-builder migration helpers
// =============================================================================
// Section-builder factory functions + idempotent image upload, shared by
// migrate-pagebuilder.mjs. Each helper returns a properly _key'd section object
// matching the Sanity schema in src/sanity/schemaTypes/sections/.
// =============================================================================
import { readFileSync, existsSync, writeFileSync, createReadStream } from 'node:fs';

const SITE_DIR = 'C:/Users/natha/Documents/Claude/Projects/West Chester Preschool Website/site';
const ASSET_MAP_PATH = `${SITE_DIR}/scripts/.asset-map.json`;

let n = 0;
export const key = () => `k${n++}`;

// Plain text (\n\n paragraph breaks) → Portable Text blocks.
export const toPT = (text) =>
  String(text || '')
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => ({
      _type: 'block',
      _key: key(),
      style: 'normal',
      markDefs: [],
      children: [{ _type: 'span', _key: key(), text: p, marks: [] }],
    }));

// A single Portable Text block with an explicit style (h2/h3/normal).
export const block = (text, style = 'normal') => ({
  _type: 'block',
  _key: key(),
  style,
  markDefs: [],
  children: [{ _type: 'span', _key: key(), text, marks: [] }],
});

// A bullet-list Portable Text block.
export const li = (text) => ({
  _type: 'block',
  _key: key(),
  style: 'normal',
  level: 1,
  listItem: 'bullet',
  markDefs: [],
  children: [{ _type: 'span', _key: key(), text, marks: [] }],
});

export const ref = (id) => ({ _type: 'reference', _ref: id });

// --- Rich Portable Text builders (h2/lists/bold/links) ----------------------
// Inline part markers for p()/bullet(): plain string, strong(), or link().
export const strong = (text) => ({ text, marks: ['strong'] });
export const link = (text, href) => ({ text, href });

const spansOf = (parts, markDefs) =>
  parts.map((part) => {
    if (typeof part === 'string') return { _type: 'span', _key: key(), text: part, marks: [] };
    if (part.href) {
      const k = key();
      markDefs.push({ _type: 'link', _key: k, href: part.href });
      return { _type: 'span', _key: key(), text: part.text, marks: [k] };
    }
    return { _type: 'span', _key: key(), text: part.text, marks: part.marks ?? [] };
  });

/** A normal paragraph block from mixed string/strong()/link() parts. */
export const p = (...parts) => {
  const markDefs = [];
  return {
    _type: 'block',
    _key: key(),
    style: 'normal',
    markDefs,
    children: spansOf(parts, markDefs),
  };
};

/** A bullet-list item block from mixed parts. */
export const bullet = (...parts) => {
  const markDefs = [];
  return {
    _type: 'block',
    _key: key(),
    style: 'normal',
    level: 1,
    listItem: 'bullet',
    markDefs,
    children: spansOf(parts, markDefs),
  };
};

export const h2 = (text) => block(text, 'h2');
export const h3 = (text) => block(text, 'h3');

// --- Image upload (idempotent via a local asset-id cache) -------------------
export function makeUploader(client) {
  const map = existsSync(ASSET_MAP_PATH) ? JSON.parse(readFileSync(ASSET_MAP_PATH, 'utf8')) : {};
  return {
    async upload(relPath) {
      if (map[relPath]) return map[relPath];
      const abs = `${SITE_DIR}/${relPath}`;
      const asset = await client.assets.upload('image', createReadStream(abs), {
        filename: relPath.split('/').pop(),
      });
      map[relPath] = asset._id;
      writeFileSync(ASSET_MAP_PATH, JSON.stringify(map, null, 2));
      return asset._id;
    },
    async uploadFile(relPath) {
      const cacheKey = `file:${relPath}`;
      if (map[cacheKey]) return map[cacheKey];
      const abs = `${SITE_DIR}/${relPath}`;
      const asset = await client.assets.upload('file', createReadStream(abs), {
        filename: relPath.split('/').pop(),
      });
      map[cacheKey] = asset._id;
      writeFileSync(ASSET_MAP_PATH, JSON.stringify(map, null, 2));
      return asset._id;
    },
  };
}

export const imageValue = (assetId) => ({ _type: 'image', asset: ref(assetId) });
export const fileValue = (assetId) => ({ _type: 'file', asset: ref(assetId) });

// --- Small object builders ---------------------------------------------------
export const sh = (eyebrow, title, lead, align = 'center') => ({
  _type: 'sectionHeader',
  ...(eyebrow ? { eyebrow } : {}),
  ...(title ? { title } : {}),
  ...(lead ? { lead } : {}),
  align,
});

export const card = (icon, chip, title, body, statValue) => ({
  _key: key(),
  ...(icon ? { icon } : {}),
  chip,
  title,
  ...(statValue ? { statValue } : {}),
  ...(body ? { body } : {}),
});

export const callout = (tone, text) => ({ _type: 'callout', tone, body: toPT(text) });

// action button: link is {url} or {pageSlug}
export const act = (label, style, link) => ({
  _key: key(),
  label,
  style,
  ...(link.url
    ? { linkType: 'url', url: link.url }
    : { linkType: 'page', page: ref(pageId(link.pageSlug)) }),
});

// Page doc id from slug (matches migrate-pagebuilder's id scheme).
export const pageId = (slug) => `page-${String(slug).replace(/\//g, '-')}`;

// --- Section builders --------------------------------------------------------
const band = (o) => ({
  ...(o.bg ? { background: o.bg } : {}),
  ...(o.seam ? { seam: true } : {}),
  ...(o.compact ? { compact: true } : {}),
});

export const proseSection = (o) => ({
  _type: 'proseSection',
  _key: key(),
  ...band(o),
  ...(o.header ? { header: o.header } : {}),
  narrow: o.narrow !== false,
  body: o.body,
});

export const cardGrid = (o) => ({
  _type: 'cardGridSection',
  _key: key(),
  ...band(o),
  ...(o.header ? { header: o.header } : {}),
  columns: o.columns ?? 3,
  layout: o.layout ?? 'card',
  cards: o.cards,
  ...(o.callout ? { callout: o.callout } : {}),
});

export const statBand = (o) => ({
  _type: 'statBandSection',
  _key: key(),
  ariaLabel: o.ariaLabel,
  stats: o.stats.map((s) => ({ _key: key(), ...s })),
});

export const cta = (o) => ({
  _type: 'ctaSection',
  _key: key(),
  title: o.title,
  ...(o.lead ? { lead: o.lead } : {}),
  tone: o.tone ?? 'navy',
  seam: o.seam !== false,
  ...(o.actions ? { actions: o.actions } : {}),
  // note accepts a plain string (→ toPT) or a ready Portable Text array (so a
  // note can carry mailto:/tel: links built with p()/link()).
  ...(o.note ? { note: Array.isArray(o.note) ? o.note : toPT(o.note) } : {}),
});

export const testimonials = (o) => ({
  _type: 'testimonialSection',
  _key: key(),
  ...band(o),
  ...(o.header ? { header: o.header } : {}),
  source: o.source ?? 'featured',
  ...(o.tag ? { tag: o.tag } : {}),
  ...(o.limit ? { limit: o.limit } : {}),
  layout: o.layout ?? 'grid',
  ...(o.confetti ? { confetti: true } : {}),
  ...(o.manual ? { manualItems: o.manual.map((id) => ({ _key: key(), ...ref(id) })) } : {}),
});

export const faqSection = (o) => ({
  _type: 'faqSection',
  _key: key(),
  ...band(o),
  ...(o.header ? { header: o.header } : {}),
  source: o.source ?? 'category',
  ...(o.category ? { category: o.category } : {}),
  ...(o.inlineItems
    ? { inlineItems: o.inlineItems.map((q) => ({ _key: key(), question: q.q, answer: toPT(q.a) })) }
    : {}),
});

export const schedule = (o) => ({
  _type: 'scheduleSection',
  _key: key(),
  ...band(o),
  ...(o.header ? { header: o.header } : {}),
  ...(o.intro ? { intro: o.intro } : {}),
  entries: o.entries.map((e) => ({
    _key: key(),
    time: e.time,
    title: e.title,
    description: e.desc,
  })),
});

export const stepList = (o) => ({
  _type: 'stepListSection',
  _key: key(),
  ...band(o),
  ...(o.header ? { header: o.header } : {}),
  steps: o.steps.map((s) => ({
    _key: key(),
    title: s.title,
    body: s.body,
    ...(s.note ? { note: s.note } : {}),
  })),
  ...(o.footnote ? { footnote: o.footnote } : {}),
});

export const compare = (o) => ({
  _type: 'compareSection',
  _key: key(),
  ...band(o),
  ...(o.header ? { header: o.header } : {}),
  ...(o.wcpLabel ? { wcpLabel: o.wcpLabel } : {}),
  ...(o.typicalLabel ? { typicalLabel: o.typicalLabel } : {}),
  rows: o.rows.map((r) => ({ _key: key(), feature: r.feature, wcp: r.wcp, typical: r.typical })),
});

export const gallery = (o) => ({
  _type: 'gallerySection',
  _key: key(),
  ...band(o),
  ...(o.header ? { header: o.header } : {}),
  photos: o.photos.map((p) => ({
    _type: 'figureImage',
    _key: key(),
    image: imageValue(p.assetId),
    alt: p.alt,
    ...(p.caption ? { caption: p.caption } : {}),
  })),
});

export const classCards = (o) => ({
  _type: 'classCardsSection',
  _key: key(),
  ...band(o),
  ...(o.header ? { header: o.header } : {}),
  classes: o.classRefs.map((id) => ({ _key: key(), ...ref(id) })),
});

export const teachers = (o) => ({
  _type: 'teacherSection',
  _key: key(),
  ...band(o),
  ...(o.header ? { header: o.header } : {}),
  staff: o.staffRefs.map((id) => ({ _key: key(), ...ref(id) })),
  ...(o.callout ? { callout: o.callout } : {}),
});

export const tuitionTable = (o) => ({
  _type: 'tuitionTableSection',
  _key: key(),
  ...band(o),
  ...(o.header ? { header: o.header } : {}),
  ...(o.caption ? { caption: o.caption } : {}),
  ...(o.callout ? { callout: o.callout } : {}),
});

export const schoolYear = (o) => ({
  _type: 'schoolYearSection',
  _key: key(),
  ...band(o),
  ...(o.header ? { header: o.header } : {}),
});

export const splitMedia = (o) => ({
  _type: 'splitMediaSection',
  _key: key(),
  ...band(o),
  ...(o.header ? { header: o.header } : {}),
  rows: o.rows.map((r) => ({
    _key: key(),
    image: imageValue(r.assetId),
    alt: r.alt,
    ...(r.eyebrow ? { eyebrow: r.eyebrow } : {}),
    title: r.title,
    ...(r.body ? { body: r.body } : {}),
    ...(r.linkLabel ? { linkLabel: r.linkLabel } : {}),
    ...(r.linkUrl ? { linkUrl: r.linkUrl } : {}),
  })),
});

export const noticeBar = (o) => ({
  _type: 'noticeBarSection',
  _key: key(),
  text: o.text,
  ...(o.linkLabel ? { linkLabel: o.linkLabel } : {}),
  ...(o.linkLabel
    ? o.url
      ? { linkType: 'url', url: o.url }
      : { linkType: 'page', page: ref(pageId(o.pageSlug)) }
    : {}),
});

export const contactDetails = (o) => ({
  _type: 'contactDetailsSection',
  _key: key(),
  ...band(o),
  reachHeading: o.reachHeading ?? 'Reach us',
  visitHeading: o.visitHeading ?? 'Visit',
  showParking: o.showParking !== false,
});

export const hero = (o) => ({
  _type: 'heroObject',
  ...(o.eyebrow ? { eyebrow: o.eyebrow } : {}),
  title: o.title,
  ...(o.accentWord ? { accentWord: o.accentWord, accentColor: o.accentColor ?? 'amber' } : {}),
  ...(o.lead ? { lead: o.lead } : {}),
  height: o.height ?? 'medium',
  mediaType: o.mediaType ?? 'none',
  ...(o.assetId ? { image: imageValue(o.assetId) } : {}),
  ...(o.imageAlt ? { imageAlt: o.imageAlt } : {}),
  ...(o.videoFileId ? { videoFile: fileValue(o.videoFileId) } : {}),
  ...(o.videoWebmId ? { videoWebm: fileValue(o.videoWebmId) } : {}),
  ...(o.actions ? { actions: o.actions } : {}),
});
