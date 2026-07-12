import { createClient } from '@sanity/client';
import { readFileSync } from 'node:fs';

const vars = readFileSync(new URL('./.dev.vars', import.meta.url), 'utf8');
const token = (vars.match(/SANITY_TOKEN="([^"]+)"/) || [])[1];

const client = createClient({
  projectId: 'niemhgev',
  dataset: 'production',
  apiVersion: '2025-01-01',
  useCdn: false,
  token,
});

const slugs = ['about', 'contact', 'enroll', 'virtual-tour', 'work-with-us'];

// List every page doc first
const all = await client.fetch(`*[_type=="page"]{_id, slug, title} | order(slug asc)`);
console.log('=== ALL PAGE DOCS ===');
for (const d of all) console.log(`${d.slug}\t${d._id}\t${JSON.stringify(d.title)}`);

for (const slug of slugs) {
  const docs = await client.fetch(
    `*[_type=="page" && slug==$slug]{
      _id, _updatedAt, title,
      "hero": hero{eyebrow, title, lead, _type},
      "sections": sections[]{_type, _key, "eyebrow": header.eyebrow, "h": header.title, "lead": header.lead, title}
    } | order(_id asc)`,
    { slug }
  );
  console.log('\n\n======================================================');
  console.log('SLUG:', slug, '  (docs found:', docs.length + ')');
  console.log('======================================================');
  for (const d of docs) {
    console.log(`\n--- ${d._id}  (updated ${d._updatedAt}) ---`);
    console.log('TITLE:', JSON.stringify(d.title));
    console.log('HERO:', JSON.stringify(d.hero));
    console.log('SECTIONS (' + (d.sections ? d.sections.length : 0) + '):');
    (d.sections || []).forEach((s, i) => {
      console.log(
        `  ${String(i + 1).padStart(2)}. ${s._type}` +
          (s.eyebrow ? ` | eyebrow="${s.eyebrow}"` : '') +
          (s.h ? ` | header="${s.h}"` : '') +
          (s.title ? ` | title="${s.title}"` : '')
      );
    });
  }
}
process.exit(0);
