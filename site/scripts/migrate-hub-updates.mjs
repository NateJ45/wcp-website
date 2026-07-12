// =============================================================================
// migrate-hub-updates.mjs — pull the Squarespace "School Updates" meeting blog
// into Sanity `update` docs, in full (rich text preserved as Portable Text).
// =============================================================================
// Source: https://www.westchesterpreschool.org/blog?format=json (Squarespace's
// JSON view of the gated meeting blog). Each item -> one published `update` doc
// with a stable id (hubUpdate-<urlId>), so re-running is idempotent/additive.
// blockContent has no image member, so inline images are dropped (these posts
// are meeting minutes / text). Run: node scripts/migrate-hub-updates.mjs
// =============================================================================
import { createClient } from '@sanity/client';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { parse } from 'node-html-parser';

const SITE_DIR = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const token = (readFileSync(`${SITE_DIR}/.dev.vars`, 'utf8').match(/SANITY_TOKEN="([^"]+)"/) ||
  [])[1];
if (!token) throw new Error('no SANITY_TOKEN in .dev.vars');

const client = createClient({
  projectId: 'niemhgev',
  dataset: 'production',
  apiVersion: '2025-01-01',
  token,
  useCdn: false,
});

const SOURCE = 'https://www.westchesterpreschool.org/blog?format=json';

let _k = 0;
const key = () => `k${(_k++).toString(36)}${Math.random().toString(36).slice(2, 6)}`;

// --- HTML (Squarespace post body) -> Portable Text (blockContent shape) -------
// blockContent allows: styles normal/h3/h4/blockquote, lists bullet/number,
// marks strong/em + link annotation. We map onto exactly that.
const HEAD3 = new Set(['h1', 'h2', 'h3']);
const HEAD4 = new Set(['h4', 'h5', 'h6']);
const BLOCK_TAGS = new Set(['p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote']);
const CONTAINER = new Set(['div', 'section', 'article', 'main', 'header', 'footer']);

function walkInline(node, marks, ctx) {
  if (node.nodeType === 3) {
    // TextNode (node-html-parser decodes entities in `.text`)
    const t = node.text.replace(/\s+/g, ' ');
    if (t) ctx.spans.push({ _type: 'span', _key: key(), text: t, marks: [...marks] });
    return;
  }
  if (node.nodeType !== 1) return;
  const tag = (node.rawTagName || '').toLowerCase();
  if (tag === 'br') {
    ctx.spans.push({ _type: 'span', _key: key(), text: '\n', marks: [...marks] });
    return;
  }
  const next = [...marks];
  if (tag === 'strong' || tag === 'b') next.push('strong');
  else if (tag === 'em' || tag === 'i') next.push('em');
  else if (tag === 'a') {
    const href = node.getAttribute('href');
    if (href && /^(https?:|mailto:|tel:|\/)/.test(href)) {
      const dk = key();
      ctx.markDefs.push({ _type: 'link', _key: dk, href });
      next.push(dk);
    }
  }
  for (const c of node.childNodes) walkInline(c, next, ctx);
}

function inlineBlock(el, style, listItem) {
  const ctx = { spans: [], markDefs: [] };
  for (const c of el.childNodes) walkInline(c, [], ctx);
  // collapse whitespace-only leading/trailing spans; require real text
  const text = ctx.spans
    .map((s) => s.text)
    .join('')
    .trim();
  if (!text) return null;
  const block = {
    _type: 'block',
    _key: key(),
    style,
    markDefs: ctx.markDefs,
    children: ctx.spans.length ? ctx.spans : [{ _type: 'span', _key: key(), text, marks: [] }],
  };
  if (listItem) {
    block.listItem = listItem;
    block.level = 1;
  }
  return block;
}

function collect(node, out) {
  for (const child of node.childNodes) {
    if (child.nodeType !== 1) continue;
    const tag = (child.rawTagName || '').toLowerCase();
    if (BLOCK_TAGS.has(tag)) {
      const style = HEAD3.has(tag)
        ? 'h3'
        : HEAD4.has(tag)
          ? 'h4'
          : tag === 'blockquote'
            ? 'blockquote'
            : 'normal';
      const b = inlineBlock(child, style, null);
      if (b) out.push(b);
    } else if (tag === 'ul' || tag === 'ol') {
      const listItem = tag === 'ul' ? 'bullet' : 'number';
      for (const li of child.childNodes) {
        if (li.nodeType === 1 && (li.rawTagName || '').toLowerCase() === 'li') {
          const b = inlineBlock(li, 'normal', listItem);
          if (b) out.push(b);
        }
      }
    } else if (CONTAINER.has(tag)) {
      collect(child, out);
    }
    // img / figure / hr / script / etc. are skipped (blockContent = text only)
  }
}

function htmlToBlocks(html) {
  const root = parse(html || '', { blockTextElements: { script: false, style: false } });
  const out = [];
  collect(root, out);
  return out;
}

function plainExcerpt(html, max = 180) {
  const root = parse(html || '');
  const text = root.text.replace(/\s+/g, ' ').trim();
  if (text.length <= max) return text;
  return text.slice(0, max).replace(/\s+\S*$/, '') + '…';
}

// First real content image in a post body (Squarespace lazy-loads via data-src).
function firstImageUrl(html) {
  const tag = ((html || '').match(/<img[^>]*>/i) || [])[0];
  if (!tag) return null;
  const ds = tag.match(/\bdata-src="(https?:\/\/[^"]+)"/i);
  const s = tag.match(/\bsrc="(https?:\/\/[^"]+)"/i);
  const u = (ds && ds[1]) || (s && s[1]);
  if (!u || /\.gif(\?|$)/i.test(u)) return null;
  return u;
}

// Upload an image by URL to Sanity (content-hash dedup makes re-runs safe).
async function uploadImage(url, alt) {
  try {
    const r = await fetch(url, { headers: { 'User-Agent': 'wcp-migrator' } });
    if (!r.ok) return null;
    const buf = Buffer.from(await r.arrayBuffer());
    const filename = (url.split('/').pop() || 'image').split('?')[0];
    const asset = await client.assets.upload('image', buf, { filename });
    return { _type: 'image', asset: { _type: 'reference', _ref: asset._id }, alt: alt || '' };
  } catch (e) {
    console.log('   ! image upload failed:', e.message);
    return null;
  }
}

// --- main --------------------------------------------------------------------
const res = await fetch(SOURCE, { headers: { 'User-Agent': 'wcp-migrator' } });
if (!res.ok) throw new Error(`fetch ${SOURCE} -> ${res.status}`);
const json = await res.json();
const items = json.items || [];
console.log(`Found ${items.length} posts.`);

let ok = 0;
for (const it of items) {
  const urlId = it.urlId;
  const body = htmlToBlocks(it.body);
  if (!body.length) {
    body.push({
      _type: 'block',
      _key: key(),
      style: 'normal',
      markDefs: [],
      children: [{ _type: 'span', _key: key(), text: it.excerpt || it.title, marks: [] }],
    });
  }
  const imgUrl = firstImageUrl(it.body);
  const image = imgUrl ? await uploadImage(imgUrl, it.title) : null;
  const doc = {
    _id: `hubUpdate-${urlId}`,
    _type: 'update',
    title: it.title,
    slug: { _type: 'slug', current: urlId },
    excerpt: (it.excerpt && it.excerpt.replace(/<[^>]+>/g, '').trim()) || plainExcerpt(it.body),
    publishedAt: new Date(it.publishOn || it.addedOn).toISOString(),
    pinned: false,
    audience: 'all',
    ...(image ? { image } : {}),
    body,
  };
  await client.createOrReplace(doc);
  ok++;
  console.log(
    `  ✓ ${it.title}  (${body.length} blocks${image ? ', +image' : ''}, ${new Date(doc.publishedAt).toISOString().slice(0, 10)})`,
  );
}
console.log(`\nDone. Upserted ${ok}/${items.length} updates.`);
