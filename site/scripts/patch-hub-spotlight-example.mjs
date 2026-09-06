// =============================================================================
// patch-hub-spotlight-example.mjs — one example Spotlight pop-up, switched OFF
// =============================================================================
// The "Spotlight pop-ups" list starts empty, and an empty list teaches a
// volunteer nothing about what the fields do. This creates ONE example
// document so the Board opens a filled-in form instead of a blank one. It
// says in its own words that it is an example, and the Board can edit it into
// their real first spotlight or delete it.
//
// It is created with "Turn it on" OFF. That is the point: a switched-on
// example would greet every family with words the Board never wrote.
//
// Idempotent: createIfNotExists on a fixed id, so a re-run changes nothing.
//
//   node scripts/patch-hub-spotlight-example.mjs            # dry run
//   node scripts/patch-hub-spotlight-example.mjs --commit   # apply
// =============================================================================
import { client, apply, done } from './patch-lib.mjs';

const ID = 'hubSpotlight-example';

const existing = await client.fetch('*[_id == $id][0]{ _id }', { id: ID });

let n = 0;

if (existing) {
  console.log('The example spotlight already exists — nothing to do.');
} else {
  n += 1;
  await apply(`create ${ID} (example, switched off)`, async () => {
    await client.createIfNotExists({
      _id: ID,
      _type: 'hubSpotlight',
      title: 'Example: supply lists are ready',
      heading: 'Supply lists are ready',
      dateLabel: 'An example you can edit or delete',
      summary:
        'This is an example pop-up so you can see how one looks. Edit it into your first real spotlight, or delete it.',
      body: [
        {
          _type: 'block',
          _key: 'example-1',
          style: 'normal',
          markDefs: [],
          children: [
            {
              _type: 'span',
              _key: 'example-1a',
              text: 'Write the message here. You can use bold and italic, add links and lists, drop in a picture, and attach a file families can download.',
              marks: [],
            },
          ],
        },
      ],
      tone: 'info',
      icon: 'megaphone',
      linkLabel: 'Open Documents',
      linkKind: 'builtin',
      builtinHref: '/family-hub/documents',
      active: false,
      version: 'v1',
    });
  });
}

done(n);
