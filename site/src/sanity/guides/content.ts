// =============================================================================
// Help & Guide content — plain-language walkthroughs for volunteers
// =============================================================================
// This is DATA, not code: each guide is a list of typed blocks. It lives in the
// repo (not editable in the Studio) so it can never be accidentally deleted, and
// so future volunteers always inherit it. Editing conventions:
//   - Formatting (rendered by GuideView's RichText): **double asterisks** for
//     bold emphasis on a concept; `backticks` for a THING YOU CLICK (a button,
//     a toggle, the ＋) — renders as a small button-look chip; _underscores_
//     for a light aside. Nothing else.
//   - Do NOT use em-dashes. Use commas or "and".
//   - Define any jargon in plain words.
//   - Keep site-specific values in SITE below.
// =============================================================================

export type DiyLevel = 'self' | 'ask' | 'mixed';

// Where a "Where in the Studio" breadcrumb can LINK to, so the card is a door,
// not just directions (GuideView renders it clickable). Three target kinds:
//  - doc:  open one document's editor via a Studio intent URL. Works from
//          EITHER workspace (intents don't need the doc in the left menu), so
//          singletons need no `ws`. `type` defaults to `doc` (the singleton
//          convention: document id = schema type).
//  - pane: open a structure pane by its id path (';'-separated for nesting,
//          e.g. 'money;class-tuition'). Panes only exist in the workspace
//          whose structure defines them — set `ws` unless both have it.
//  - tool: open a top-bar tool by name (e.g. 'export', 'checkup').
// `ws` swaps the link into the named workspace; omitted = the reader's own.
export type PathLink =
  | { doc: string; type?: string; ws?: 'public' | 'family-hub' }
  | { pane: string; ws?: 'public' | 'family-hub' }
  | { tool: string; ws?: 'public' | 'family-hub' };

export type GuideBlock =
  | { kind: 'h'; text: string }
  | { kind: 'p'; text: string }
  | { kind: 'steps'; items: string[] }
  | { kind: 'bullets'; items: string[] }
  | { kind: 'path'; items: string[]; link?: PathLink }
  | {
      kind: 'callout';
      tone?: 'primary' | 'positive' | 'caution' | 'critical' | 'default';
      title?: string;
      text: string;
    }
  | { kind: 'seealso'; items: string[] };

// The Help & Guide list groups guides under these headings (titled dividers in
// src/sanity/structure.ts), in THIS order — one long flat list of ~40 guides
// was overwhelming to scan (Nathan, 2026-08-24). A new guide must pick one of
// these; the union type makes a typo or a missing category a compile error.
export const GUIDE_CATEGORIES = [
  'Start here',
  'Website pages & menus',
  'Family Hub',
  'News, events & alerts',
  'School info & money',
  'Photos & community',
  'Yearly jobs & housekeeping',
] as const;
export type GuideCategory = (typeof GUIDE_CATEGORIES)[number];

// Every guide shows in BOTH workspaces (help must not dead-end in the wrong
// view), but each side LEADS with its own work: the hub workspace lists the
// Family Hub group right after "Start here", the public workspace lists the
// website groups first. Housekeeping closes both.
export const GUIDE_CATEGORY_ORDER: Record<'public' | 'hub', readonly GuideCategory[]> = {
  public: [
    'Start here',
    'Website pages & menus',
    'News, events & alerts',
    'School info & money',
    'Photos & community',
    'Family Hub',
    'Yearly jobs & housekeeping',
  ],
  hub: [
    'Start here',
    'Family Hub',
    'News, events & alerts',
    'Photos & community',
    'School info & money',
    'Website pages & menus',
    'Yearly jobs & housekeeping',
  ],
};
// A reordered list that silently DROPS a category would hide its guides — make
// that a load-time error instead (same guard style as sectionInsertMenu).
for (const order of Object.values(GUIDE_CATEGORY_ORDER)) {
  if (order.length !== GUIDE_CATEGORIES.length || new Set(order).size !== GUIDE_CATEGORIES.length) {
    throw new Error('GUIDE_CATEGORY_ORDER must contain every guide category exactly once.');
  }
}

export interface Guide {
  slug: string;
  category: GuideCategory;
  title: string;
  icon: string; // emoji, shown in the left nav
  lead: string;
  diy?: DiyLevel;
  body: GuideBlock[];
}

export const SITE = {
  contactName: 'Nathan',
  contactEmail: 'nathanjnixon86@gmail.com',
};

export const guides: Guide[] = [
  {
    slug: 'start-here',
    category: 'Start here',
    title: 'Start here: how it all works',
    icon: '👋',
    lead: 'A two minute read that makes everything else make sense.',
    diy: 'self',
    body: [
      { kind: 'h', text: 'The Studio vs. the website' },
      {
        kind: 'p',
        text: 'This **Studio** is your control room. The **website** is what families and visitors see. You make changes here, and they appear on the website after you publish. The Studio is private. The website is public.',
      },
      { kind: 'h', text: 'Nothing is live until you Publish' },
      {
        kind: 'callout',
        tone: 'positive',
        title: 'You cannot break the live site just by editing.',
        text: 'While you type, you are editing a private **draft**. The public website does not change until you click `Publish`. So click around, try things, and only publish when it looks right.',
      },
      { kind: 'h', text: 'How a change goes live' },
      {
        kind: 'steps',
        items: [
          'Open the thing you want to change from the left menu.',
          'Edit the boxes. Your work saves automatically as a draft.',
          'When it looks right, click the green `Publish` button (bottom right).',
          'A few minutes later the website rebuilds itself and your change appears.',
        ],
      },
      {
        kind: 'callout',
        tone: 'primary',
        title: 'Give it a minute.',
        text: 'The website does not update the instant you publish. It rebuilds in the background, so wait a couple of minutes and then refresh the page you changed.',
      },
      { kind: 'h', text: 'Two workspaces, one website' },
      {
        kind: 'p',
        text: 'The Studio opens in **Public website** (what everyone sees). Click the workspace name in the top-left corner to switch to **Family Hub** (the private, families-only area; it has a little lock on its icon). Both edit the same website. The split just keeps each job’s menu short and obvious. If you cannot find something, you are probably in the other workspace.',
      },
      { kind: 'h', text: 'The left menu, band by band' },
      {
        kind: 'p',
        text: 'Inside each workspace, the left menu is grouped into **bands**, each with a small heading. Everyday jobs sit on top; setup lives at the bottom. One line per band:',
      },
      {
        kind: 'p',
        text: '**Public website** (where the Studio opens):',
      },
      {
        kind: 'bullets',
        items: [
          '**Everyday edits**: the **Alert banner** (snow days), **Announcements** (bars and popups you turn on and off), **Money & payments**, **News**, **Events**, and **Pages**.',
          '**School info**: Classes, Staff, FAQs, Testimonials, School-Year Events, and Community & content.',
          '**Site setup**: Site Settings, Menus, Small bits of wording, and Redirects.',
          '**Inboxes**: what the public forms send in. Form submissions, review submissions, newsletter subscribers.',
        ],
      },
      {
        kind: 'p',
        text: '**Family Hub** (the families-only side, with the lock icon):',
      },
      {
        kind: 'bullets',
        items: [
          '**Everyday edits**: Updates, Celebrations, the President’s note, Sign-ups & RSVPs, and Documents & Forms.',
          '**Families & co-op**: the Directory, teacher notes, co-op roles, who’s who, and the hours ledger.',
          '**Hub pages & look**: the hub’s own pages, its menu, the first-visit tour, and hints.',
          '**Printables**: the curriculum guide and supply list PDFs.',
          '**Inboxes**: sign-up responses, and family photos waiting for review.',
        ],
      },
      {
        kind: 'callout',
        tone: 'primary',
        title: 'A few things live in both menus on purpose.',
        text: 'The **Alert banner** and **Money & payments** sit at the top of both, so a snow day or a money change never hides in the other workspace. **Welcome**, this guide, and **Recently deleted** are in both too. And the top bar has **Media**: every photo you have uploaded, in one searchable place.',
      },
      {
        kind: 'seealso',
        items: [
          'Build or edit a page',
          'Words you might not know',
          'Do it yourself vs. ask for help',
        ],
      },
    ],
  },

  {
    slug: 'build-page',
    category: 'Website pages & menus',
    title: 'Build or edit a page',
    icon: '🧱',
    lead: 'Pages are built from stacked sections. You can edit the words, add or remove sections, reorder them, and even make brand-new pages.',
    diy: 'self',
    body: [
      { kind: 'h', text: 'How a page is put together' },
      {
        kind: 'p',
        text: 'Every page is a **hero** (the big banner at the top) followed by a stack of **sections**. A section is one band of the page, like a row of cards, a set of photos, a quote, or a "get in touch" banner. You choose which sections a page has and what order they go in. You do not choose colors, fonts, or spacing, so whatever you build already looks like the rest of the site.',
      },
      {
        kind: 'callout',
        tone: 'positive',
        title: 'You pick the words and pictures. The design takes care of itself.',
        text: 'Every section is pre-styled in the school’s look. That is on purpose: it means a page you build in five minutes still looks like it belongs, and nobody can accidentally make the site look off-brand.',
      },
      {
        kind: 'callout',
        tone: 'primary',
        title: 'Two styling notes from the 2026 refresh.',
        text: 'The small **Eyebrow** label above a heading now shows as a little taped paper tag wherever it appears, and does not show at all on photo and story sections, so do not worry if one you typed is not visible on the page. And **Cards** sections display as a tidy ruled list on the public site rather than boxed tiles: same words, same order, just the newer look.',
      },
      { kind: 'h', text: 'The easiest way to edit: click it on the page' },
      {
        kind: 'steps',
        items: [
          'Open **Pages**, then click the page you want. A live preview of the page opens on the right.',
          'Click any text or photo in the preview. The matching box opens on the left, ready to edit.',
          'Type your change. A moment after you pause, the preview refreshes on its own so you can see how it looks.',
          'Want to see it as a phone or tablet? Use the little **device buttons** above the preview to switch screen sizes.',
          'When it looks right, click `Publish`.',
        ],
      },
      {
        kind: 'callout',
        tone: 'primary',
        title: 'This is the "click anything to edit" view.',
        text: 'The preview on the right is the real page. Clicking straight on the thing you want to change is usually faster than hunting through the boxes on the left.',
      },
      { kind: 'h', text: 'Three things you can change without leaving the page' },
      {
        kind: 'p',
        text: 'Small buttons appear on whatever you point at in the preview. They write to the same boxes on the left, so nothing here is a second way of doing things, only a shorter one. Nothing goes live until you `Publish`, and `Undo last change` works on all three.',
      },
      {
        kind: 'bullets',
        items: [
          '**The band colour.** Every band has a small `🎨` button in its top right corner. Click it and a short list opens: White, Light grey, Warm cream, Navy. Click one and the band changes colour under your hand. (A call-to-action banner offers its own two, Navy and Warm cream.)',
          '**The underlined word in a heading.** Click a heading, then `Underline a word`, then click the word. See "Make words bold or stand out".',
          '**The words themselves.** Click an intro line or a card line, then `✎ Edit here`, and type in the small card that opens. Enter saves, Esc cancels.',
        ],
      },
      {
        kind: 'callout',
        tone: 'primary',
        title: 'A band with nothing in it yet has no colour button.',
        text: 'A section you have just added shows the grey "nothing here yet" note instead of a real band, so there is no colour to change. Fill in its words and the `🎨` appears.',
      },
      {
        kind: 'callout',
        tone: 'positive',
        title: 'The page list beside the preview does more than list pages.',
        text: 'It is split into **In the menu** and **Not in the menu**: a page in the second group is invisible to visitors until you add it to the menu (see "Edit the menus").',
      },
      {
        kind: 'bullets',
        items: [
          'An **amber dot** next to a page means unpublished edits; a **hollow dot** means the page has never been published at all.',
          'The little `↗` opens the real live page in a new tab, so you can check what families actually see.',
          'The `⋯` button on a page gives you **Duplicate** and **Archive** (see below).',
          'The `⋮⋮` grip lets you drag a page into the menu, out of it, or up and down inside it (see below).',
          '`＋ New page` at the bottom starts a fresh page right here.',
          'The **Site-wide** shortcuts underneath jump to the menus, the site settings, and the alert banner without leaving this view.',
        ],
      },
      { kind: 'h', text: 'Copy a page' },
      {
        kind: 'p',
        text: 'To start a new page from one that already exists, click the `⋯` next to it in the page list and choose **Duplicate**. You get a full copy called "…​ copy", at a new web address ending in "-copy", opened and ready to edit.',
      },
      {
        kind: 'callout',
        tone: 'positive',
        title: 'The copy is a draft.',
        text: 'Nobody can see it until you publish it. Change the name, the web address, and the words first, then `Publish`.',
      },
      { kind: 'h', text: 'Take a page off the site, and put it back' },
      {
        kind: 'steps',
        items: [
          'In the page list, click the `⋯` next to the page and choose **Archive**.',
          'The page moves to an **Archived** group at the bottom of the list, and it comes off the website and out of the menus.',
          '`Publish` the page so the change reaches the website.',
          'Changed your mind? Click the `⋯` on the archived page, choose **Restore**, and publish again. Everything comes back exactly as it was.',
        ],
      },
      {
        kind: 'callout',
        tone: 'primary',
        title: 'Archive is for "not right now". Recently deleted is for "gone".',
        text: 'Archiving keeps every word and picture, so it is the safe choice for a page you may want again, like a summer camp page in winter. To remove a page for good, open it and use `Delete (move to trash)`, which you can still undo from **Recently deleted**.',
      },
      { kind: 'h', text: 'Put a page in the menu by dragging' },
      {
        kind: 'steps',
        items: [
          'In the page list, find the page in **Not in the menu**.',
          'Point at the `⋮⋮` grip on the left of its name, hold the mouse button down, and drag it into the **In the menu** group.',
          'Drop it where you want it to sit. The order in the list is the order in the top menu.',
          'To take a page out of the menu, drag it back down to **Not in the menu**. The page stays on the website; only the menu link goes.',
        ],
      },
      {
        kind: 'callout',
        tone: 'primary',
        title: 'Some pages have no grip.',
        text: 'The home page is always in the menu, so it cannot be dragged. A page that sits inside a dropdown is arranged in **Menus (header & footer)** instead, where you can also rename links and build dropdowns.',
      },
      { kind: 'h', text: 'How the page looks in Google' },
      {
        kind: 'p',
        text: 'Open a page and click the **Search & sharing** tab at the top of the boxes. The panel shows a picture of the Google result and of the card people see when they share the link, and it updates as you type.',
      },
      {
        kind: 'bullets',
        items: [
          '**Browser tab / search title**: leave it blank to use the page name. Keep it under about 65 letters or Google cuts it off.',
          '**Search description**: the sentence under the link in Google. About 160 letters.',
          '**Social share image**: the picture for texts and Facebook. Leave it blank for the card the site makes on its own.',
          '**Keep this page out of Google**: ask search engines to skip this page. The page stays on the website, so anyone with the address can still open it.',
        ],
      },
      { kind: 'h', text: 'Add, remove, or reorder sections' },
      {
        kind: 'steps',
        items: [
          'Open a page and find the **Sections** list on the left.',
          'To add one, click `Add item`. The picker is grouped into five bands — Words, photos & video · Cards, facts & tables · From your lists · Money & enrolling · Banners, forms & contact — and has a search box, so type "photo" or "FAQ" to jump straight to it. Each section shows a small picture of what it looks like on the site, so you can pick by look. Pick a section and fill in its boxes. A new section shows a gray note in the preview that tells you what to add until you fill it in.',
          'To move a section, drag it by the handle to a new spot in the list. Top of the list is top of the page.',
          'To remove one, use its `⋮` menu and choose Remove. (Removing a section is undoable before you publish.)',
          '`Publish` when you are happy.',
        ],
      },
      {
        kind: 'callout',
        tone: 'positive',
        title: 'You can also rearrange sections right on the preview.',
        text: 'Click a section in the preview (the page itself, not the boxes) and a small toolbar appears on its outline: move it up or down, duplicate it, remove it, or insert a new one next to it — the same controls as the Sections list, without leaving the page.',
      },
      { kind: 'h', text: 'Make a brand-new page' },
      {
        kind: 'steps',
        items: [
          'Open **Pages**, then click **Pages (section builder)** and the `＋` (new) button.',
          'Pick a **starting layout**: _standard info page_, _photo story page_, or _event or program page_ — each comes pre-filled with sections and [bracketed] placeholder text to replace. (Plain **Page** starts blank.)',
          'Give it a **Title**, then a **Slug** (the last part of the web address, like "summer-camp"). Use lowercase letters and dashes, no spaces. If the address is already taken by another page or a built-in part of the site, an error will tell you, so you cannot accidentally hide a page.',
          'Fill in the hero, then add sections one at a time until the page is built.',
          'To put it in the top menu, open **Menus (header & footer)** and add a link to it (see "Edit the menus").',
          '`Publish`. A couple of minutes later the new page is live on the website.',
        ],
      },
      {
        kind: 'callout',
        tone: 'caution',
        title: 'The hero stays at the top.',
        text: 'Every page needs exactly one hero banner at the very top, so that part is fixed and cannot be removed or moved. Everything below it is yours to arrange.',
      },
      {
        kind: 'callout',
        tone: 'caution',
        title: 'The home page’s "Come find us" block is temporarily fixed.',
        text: 'On the home page, the block with our address, phone number, and when tours run is currently built into the site rather than editable here, so you will not find it in the Sections list. The address and phone number come from Site Settings, so update those there if they change. It will move back into the page builder later.',
      },
      {
        kind: 'seealso',
        items: [
          'Edit the menus',
          'Photos and images',
          'Make words bold or stand out',
          'Save a section and use it again',
          'Check a page before you publish',
          'Undo a change',
          'Publish later',
          'Show someone a draft',
          'Do it yourself vs. ask for help',
        ],
      },
    ],
  },

  {
    slug: 'emphasis',
    category: 'Website pages & menus',
    title: 'Make words bold or stand out',
    icon: '🖍️',
    lead: 'Two small ways to give one word more weight: bold and italic inside a sentence, and a crayon underline under a word in a heading.',
    diy: 'self',
    body: [
      { kind: 'h', text: 'Bold or italic inside a sentence' },
      {
        kind: 'p',
        text: 'Some text boxes come in pairs. There is the plain box you already know, and under it a second box with the same name plus **with bold or italic**. The second box has a small toolbar with `B` and `I`.',
      },
      {
        kind: 'steps',
        items: [
          'Find the box named "… with bold or italic" under the plain one.',
          'Type your sentence there instead of in the plain box.',
          'Select a word, then click `B` for bold or `I` for italic.',
          'The plain box above hides itself, so you only ever have one copy of the sentence.',
        ],
      },
      {
        kind: 'callout',
        tone: 'positive',
        title: 'Or type it straight on the page.',
        text: 'Click the sentence in the live preview and a small `✎ Edit here` button appears on it. Click that and a little card opens with the words already in it, and with `B` and `I` buttons. Type, then press Enter or click `Save`. It writes to the same box, so both ways do the same thing. Paste from Word or Google Docs is safe here: the bold comes through and the fonts and colours are dropped.',
      },
      {
        kind: 'callout',
        tone: 'primary',
        title: 'Changed your mind?',
        text: 'Delete everything in the "with bold or italic" box. The plain box comes straight back, with the words you had before.',
      },
      {
        kind: 'p',
        text: 'You can do this in the intro line under a heading, the intro line under a page banner, the text on a card, the text in a numbered step, the text beside a photo row, the intro on a daily schedule, and the line under a big call-to-action headline.',
      },
      {
        kind: 'callout',
        tone: 'caution',
        title: 'Bold is a spice, not a sauce.',
        text: 'One or two bold words in a paragraph make a point. A whole bold paragraph reads as shouting, and nothing stands out any more.',
      },
      { kind: 'h', text: 'A crayon underline under a word in a heading' },
      {
        kind: 'p',
        text: 'Headings are already big, so there is no bold button on them. Instead you can pick **one word** from the heading and the site draws a hand-drawn amber line under it, the same line the page banners use.',
      },
      {
        kind: 'steps',
        items: [
          'Open the section and find the box named "Word to underline".',
          'Type one word, or a short phrase, that already appears in the heading above it.',
          'Capital letters do not matter. Type "belong" and it finds "Belong".',
          '`Publish`, and check the page.',
        ],
      },
      {
        kind: 'callout',
        tone: 'positive',
        title: 'Easier: click the word itself.',
        text: 'Click the heading in the live preview and an `Underline a word` button appears on it. Click that and the heading comes back as a row of buttons, one per word. Click the word you want. Click it again to take the underline away. There is no typing, so there is no spelling to get wrong.',
      },
      {
        kind: 'callout',
        tone: 'primary',
        title: 'Nothing happened?',
        text: 'The word has to appear in that heading, spelled the same way. If it does not, the heading simply stays plain, so a typo can never break the page.',
      },
      {
        kind: 'callout',
        tone: 'caution',
        title: 'One underline per page.',
        text: 'The underline works because it is rare. Use it on the heading you most want people to read, and leave the others alone. Keep it to a word or two, not a whole sentence.',
      },
      { kind: 'h', text: 'What you cannot do, on purpose' },
      {
        kind: 'bullets',
        items: [
          'No colours, fonts, or sizes. The site owns those, which is what keeps every page looking like the school.',
          'No links or lists in these boxes. For a paragraph that needs links or bullet points, use a **Text section** instead.',
          'No bold inside a heading. A heading gets the underline; that is its way of standing out.',
        ],
      },
      {
        kind: 'seealso',
        items: ['Build or edit a page', 'Check a page before you publish'],
      },
    ],
  },

  {
    slug: 'saved-sections',
    category: 'Website pages & menus',
    title: 'Save a section and use it again',
    icon: '🧩',
    lead: 'Built a band you like? Keep it, and drop the same one onto any other page.',
    diy: 'self',
    body: [
      { kind: 'h', text: 'What a saved section is' },
      {
        kind: 'p',
        text: 'A **saved section** is one finished section, kept on a shelf. A "Book a tour" banner, a row of cards you got just right, a photo strip. You save it once and add it to as many pages as you like, instead of building it again each time.',
      },
      {
        kind: 'callout',
        tone: 'positive',
        title: 'It is a copy, not a link.',
        text: 'Adding a saved section drops a copy onto the page. Changing that page later does not change the saved one, and changing the saved one does not change pages that already have it.',
      },
      { kind: 'h', text: 'Save a section' },
      {
        kind: 'steps',
        items: [
          'Open the page that has the section you want to keep.',
          'Click the small arrow beside the `Publish` button, then `Save a section as preset…`.',
          'Pick the section from the list. Each one shows its number, what kind it is, and its first few words.',
          'Give it a name you will recognise later, like "Tour banner", then click `Save section`.',
        ],
      },
      {
        kind: 'callout',
        tone: 'default',
        title: 'It saves what you can see.',
        text: 'The section is saved exactly as it stands in the boxes right now, including changes you have not published yet.',
      },
      { kind: 'h', text: 'Add a saved section to a page' },
      {
        kind: 'steps',
        items: [
          'Open **Preview** and click the page you want it on, so the preview is showing that page.',
          'At the bottom of the page list, click `Saved sections` to open the list.',
          'Find the one you want and click its `+` button. It is added to the bottom of the page.',
          'Drag it up to where you want it, change any words you like, then `Publish`.',
        ],
      },
      {
        kind: 'callout',
        tone: 'caution',
        title: 'The + button is greyed out?',
        text: 'It needs to know which page to add to. Click a page in the list first, then try again.',
      },
      {
        kind: 'path',
        items: ['Public website', 'Saved sections'],
        link: { pane: 'section-presets', ws: 'public' },
      },
      {
        kind: 'p',
        text: 'That is also where you rename one, change what is inside it, or delete the ones nobody uses. A tidy list is a findable list.',
      },
      {
        kind: 'seealso',
        items: ['Build or edit a page', 'Check a page before you publish'],
      },
    ],
  },

  {
    slug: 'check-a-page',
    category: 'Website pages & menus',
    title: 'Check a page before you publish',
    icon: '🔍',
    lead: 'A quick second pair of eyes: missing photo descriptions, empty sections, and links that may go nowhere.',
    diy: 'self',
    body: [
      { kind: 'h', text: 'How to run it' },
      {
        kind: 'steps',
        items: [
          'Open the page.',
          'Click the small arrow beside the `Publish` button, then `Check this page…`.',
          'Read what it found, close it, and fix anything you agree with.',
        ],
      },
      { kind: 'h', text: 'What it looks for' },
      {
        kind: 'bullets',
        items: [
          '**Photos with no description.** The sentence a screen reader says out loud, and the words shown if a photo fails to load.',
          '**Sections with nothing in them.** A section you added and did not fill in, which would show up blank on the website.',
          '**Links worth a look.** A link to a part of our own site where no page seems to live.',
        ],
      },
      {
        kind: 'callout',
        tone: 'positive',
        title: 'It never stops you publishing.',
        text: 'This is a courtesy check, not a rule. Everything it says is a suggestion, and you can publish with the list still showing things.',
      },
      {
        kind: 'callout',
        tone: 'caution',
        title: 'It can be wrong.',
        text: 'A photo that is pure decoration needs no description. A section that fills itself from a list, like Teachers or FAQs, is skipped because its words live elsewhere. Use your judgement.',
      },
      {
        kind: 'seealso',
        items: ['Build or edit a page', 'Photos and images', 'Save a section and use it again'],
      },
    ],
  },

  {
    slug: 'undo-a-change',
    category: 'Website pages & menus',
    title: 'Undo a change',
    icon: '↩️',
    lead: 'Dragged a section to the wrong place, removed the wrong one, or picked a background you regret? Step it back.',
    diy: 'self',
    body: [
      {
        kind: 'steps',
        items: [
          'Open the page.',
          'Click the small arrow beside the `Publish` button.',
          'Choose **Undo last change**. The page goes back to how it was one step ago.',
          'Changed your mind? Choose **Redo** to put it back again.',
        ],
      },
      { kind: 'h', text: 'Ctrl+Z works too, outside text boxes' },
      {
        kind: 'p',
        text: 'With a page open, press **Ctrl+Z** (**Cmd+Z** on a Mac) to undo and **Ctrl+Shift+Z** to redo. Press it more than once to go back more than one step.',
      },
      {
        kind: 'callout',
        tone: 'default',
        title: 'Inside a text box, the text box wins',
        text: 'If your cursor is in a heading, a paragraph, or any other box you type in, Ctrl+Z undoes your typing, the way it does everywhere else. That is on purpose. Click outside the box first if you want to undo the bigger thing, like the section you just dragged.',
      },
      {
        kind: 'callout',
        tone: 'default',
        title: 'In the page picture, use the menu instead',
        text: 'If you have just clicked something on the page picture (the live preview), Ctrl+Z does nothing: the picture keeps the key for itself. Use **Undo last change** in the Publish menu, or click once in the boxes on the left first.',
      },
      { kind: 'h', text: 'What it can and cannot reach' },
      {
        kind: 'bullets',
        items: [
          'It works on your **unpublished draft** only. The live website is never touched, so undo can never break what visitors see.',
          'It covers everything, not just typing: sections added, dragged, duplicated or removed, photos swapped or cleared, backgrounds and options changed.',
          'It **cannot undo a Publish**. Publishing is its own step. To take a published page back, see the history guide below.',
          'It forgets everything when you close or reload the tab. Undo is for the last few minutes, not for last week.',
        ],
      },
      { kind: 'h', text: 'When it politely refuses' },
      {
        kind: 'bullets',
        items: [
          '**"Nothing to undo yet"**: this page has no unpublished change for undo to step back to.',
          '**"Someone else edited since"**: the page changed after the last thing you did, so undo left it alone rather than writing over somebody. Reload the page and look at it before doing anything else.',
          '**"This would remove the only copy"**: stepping back that far would delete a page that has never been published, so there would be nothing left. If you really do want it gone, delete it on purpose.',
        ],
      },
      {
        kind: 'callout',
        tone: 'primary',
        title: 'Version history is still the deep one',
        text: 'Undo is the quick step back for the thing you just did. To go back hours or days, or to recover something after publishing, open the page and use Version history in the top right. Nothing here replaces it.',
      },
      {
        kind: 'seealso',
        items: ['Build or edit a page', 'See history and restore an old version'],
      },
    ],
  },

  {
    slug: 'publish-later',
    category: 'Website pages & menus',
    title: 'Publish later',
    icon: '⏰',
    lead: 'Write a page now, and let it go live on a day and time you pick. You do not have to be at a computer when it happens.',
    diy: 'self',
    body: [
      { kind: 'h', text: 'What this is for' },
      {
        kind: 'p',
        text: 'Say enrollment opens on March 1 and you have the page written in February. You do not have to remember to click `Publish` that morning. Set the date and time, leave the page as a draft, and the website publishes it for you.',
      },
      { kind: 'h', text: 'How to do it' },
      {
        kind: 'steps',
        items: [
          'Open the page and finish your edits.',
          'Click the `Publishing` tab at the top of the page (beside Content, Hero, and Settings).',
          'Set **Publish automatically at** to the day and time you want.',
          'Do NOT click `Publish`. Just leave the page. Your work is saved as a draft, which is exactly what this needs.',
        ],
      },
      {
        kind: 'callout',
        tone: 'caution',
        title: 'Leave it as a draft, or nothing happens.',
        text: 'This only works on a page that is waiting as a draft. If you click `Publish` yourself, the page is live right away and the date is ignored.',
      },
      { kind: 'h', text: 'When it actually goes live' },
      {
        kind: 'p',
        text: 'The website checks every half hour, so the page appears **within about half an hour** of the time you picked, not on the exact minute. Pick a time a little before you need it. The time you set is your own local time.',
      },
      { kind: 'h', text: 'Changing your mind' },
      {
        kind: 'bullets',
        items: [
          'To cancel, clear the **Publish automatically at** box before the time arrives. Nothing else happens.',
          'To move it, set a new date and time in the same box.',
          'To publish it now instead, just click `Publish` as usual.',
        ],
      },
      {
        kind: 'callout',
        tone: 'primary',
        title: 'It works on Family Hub pages too.',
        text: 'Hub pages have the same `Publishing` tab. A hub page appears the moment it publishes, with no waiting for the website to rebuild.',
      },
      {
        kind: 'seealso',
        items: ['Build or edit a page', 'Show someone a draft', 'Post a closure or alert'],
      },
    ],
  },

  {
    slug: 'share-a-draft',
    category: 'Website pages & menus',
    title: 'Show someone a draft',
    icon: '🔗',
    lead: 'Send a link that lets someone read your unpublished page, without giving them a Studio login.',
    diy: 'self',
    body: [
      { kind: 'h', text: 'What this is for' },
      {
        kind: 'p',
        text: 'You have rewritten a page and want the Board chair to read it before it goes live. Instead of publishing and hoping, or setting them up with an account, you can send them a link that shows your draft.',
      },
      { kind: 'h', text: 'How to do it' },
      {
        kind: 'steps',
        items: [
          'Open the page you are working on.',
          'Click the small arrow beside the green `Publish` button, then `Copy share link`. (In the page list beside the preview, the `⋯` button on a row has it too.)',
          'The link is now on your clipboard. Paste it into an email or a text message.',
        ],
      },
      {
        kind: 'callout',
        tone: 'caution',
        title: 'The link works for about an hour, then it stops.',
        text: 'That hour is set by Sanity and cannot be made longer. It is not a problem: if the link has expired, copy a new one, which takes one click. Send the link when the person is ready to look.',
      },
      { kind: 'h', text: 'What the other person sees' },
      {
        kind: 'bullets',
        items: [
          'Your **current draft**, including edits you have not published.',
          'A normal looking page. They cannot edit anything, and they need no login.',
          'Nothing else. The link opens one page, not the Studio.',
        ],
      },
      {
        kind: 'callout',
        tone: 'critical',
        title: 'Family Hub pages have no share link, on purpose.',
        text: 'Anyone holding the link can open the page, and the hub holds the family directory, health notes, and photos of the children. There is no safe way to send that to one person only, so the hub pages simply do not offer it. Send a screenshot of the part you want a second opinion on instead.',
      },
      {
        kind: 'callout',
        tone: 'primary',
        title: 'Treat it like a private link.',
        text: 'Anyone you forward it to can read the draft during that hour. Send it to the person who needs it, not to a group.',
      },
      {
        kind: 'seealso',
        items: ['Build or edit a page', 'Publish later', 'See history and restore an old version'],
      },
    ],
  },

  {
    slug: 'edit-hub-page',
    category: 'Family Hub',
    title: 'Edit a Family Hub page',
    icon: '🔒',
    lead: 'The private, families-only pages (Calendar, Documents, Tuition, the classrooms, and the rest) are editable too, the same way public pages are.',
    diy: 'self',
    body: [
      { kind: 'h', text: 'Where they live' },
      {
        kind: 'path',
        items: ['Family Hub', 'Hub pages (edit content)'],
        link: { pane: 'hubPage', ws: 'family-hub' },
      },
      {
        kind: 'p',
        text: 'Each Family Hub page has its own entry here. Open one and you can change its **heading**, its **intro** line, and add a stack of **sections** below, exactly like a public page. Only signed-in families ever see these pages.',
      },
      {
        kind: 'callout',
        tone: 'positive',
        title: 'Edit by clicking the page, like public pages.',
        text: 'Open a hub page and a live preview opens on the right. Click any text to jump to its box; click a whole section for its move/duplicate/remove toolbar; the preview refreshes as you type.',
      },
      {
        kind: 'bullets',
        items: [
          'The **page list** on the left flips between hub pages, like a site builder. An amber dot means unpublished edits; a hollow dot means never published.',
          'The `⋯` on a page gives you **Duplicate** (a full copy, as a draft) and **Archive** (takes the page off the hub and keeps it in an **Archived** group at the bottom, ready to **Restore**). Archiving a page that came with the site puts back the wording the site ships with.',
          'The preview is the **real hub page** — the menu, the widgets, everything a family sees — with your editable heading, intro, and sections in place. Click your text to edit it; the built-in widgets are shown but not clickable.',
          'On **Hub home**, a **Widgets** list of on/off switches lets you hide any dashboard tile (weather, store, photos, and so on), and **Widget wording** below it lets you rewrite a tile’s title or one-liner — empty boxes keep the standard words. The preview updates before you even publish.',
        ],
      },
      { kind: 'h', text: 'What you can change, and what stays put' },
      {
        kind: 'p',
        text: 'Every hub page has one **fixed part** that stays locked in place: the live calendar, the pay buttons on Tuition, the family directory and map, the campaign totals on Fundraising, and so on. Your editable heading, intro, and sections wrap around that fixed part, so the important buttons and private data keep working no matter what you change.',
      },
      {
        kind: 'bullets',
        items: [
          'Change the heading and intro at the top of any hub page.',
          'Add sections (cards, a note, an FAQ, a "get in touch" banner) below the fixed part.',
          'Leave the heading or intro blank to fall back to the built-in wording.',
        ],
      },
      {
        kind: 'callout',
        tone: 'positive',
        title: 'You cannot break the pay buttons or the calendar.',
        text: 'Those live in the fixed part of the page, which is not editable here on purpose. Edit the words around them freely.',
      },
      {
        kind: 'callout',
        tone: 'primary',
        title: 'Some hub content is edited in its own spot.',
        text: 'The document list, co-op roles, and family cards each have their own place in the Family Hub menu. This page is for the wording around them.',
      },
      {
        kind: 'p',
        text: 'The **President’s note** (the welcome letter that pops up the first time a family visits the hub) also lives in the Family Hub menu. Edit the letter freely; when it’s rewritten for a new year, change its **version stamp** so families who closed the old one see the new one. Turn **Show the note?** off to retire it.',
      },
      {
        kind: 'p',
        text: 'The **Teacher welcome notes** work exactly the same way, one per class — each pops up the first time a family visits that class’s hub page. Same rules: rewrite freely, bump the version stamp for a new year, toggle it off to retire it.',
      },
      {
        kind: 'p',
        text: 'The note’s **photo, name, role, email, and phone** do triple duty, so keep them current in this one place:',
      },
      {
        kind: 'bullets',
        items: [
          'They fill the **"Your teacher" card** at the top of the class page (with a `Say hi` and a `Call or text` link).',
          'They sign off the handbook’s closing section as a little **signature card** — headshot plus `Email` and `Call or text` buttons.',
          'Each class page also opens with a photo **"How our day flows"** story. Swap its starter photos for real shots of your class right on the page’s Story timeline section.',
        ],
      },
      {
        kind: 'p',
        text: 'Every **class page** carries that teacher’s entire parent handbook as editable sections — daily schedules, drop-off and pick-up, the helper-day playbook, snack duty, and more (Twos and Threes share one page, and so do the two Pre-K classes, because each pair shares a teacher). When the teacher changes a routine, edit the matching section right here so the page stays the source of truth. A class with no handbook page yet still has a working hub page — use **Create its hub page** on the class to start one.',
      },
      {
        kind: 'p',
        text: 'Want families to be able to download the teacher’s **original handbook PDF** too? Open that class’s hub page and upload it to the **Handbook PDF** field. A "Download the handbook (PDF)" button then appears at the top of the class page. Leave it empty and no button shows.',
      },
      {
        kind: 'p',
        text: 'The **store card** at the bottom of the Family Hub home is set in **Merch store card** (Family Hub workspace → Hub pages & look): a headline, a blurb, the store link, and **Featured merch** (add a few items with a name, price, product link, and an uploaded product photo to show them as clickable tiles — save the picture from the store page first). Clear the featured items to show just the banner.',
      },
      {
        kind: 'p',
        text: 'The **family directory map** (a Map tab that plots each family who shared a home address) is off by default. To turn it on, flip **Hub settings → Google connections → "Show the family directory map"** (Family Hub workspace). With it off, the Directory shows just the List.',
      },
      {
        kind: 'p',
        text: 'When you post an **Update**, pick its **Category**: an _Announcement_ shows in the hub home’s Announcements widget; _Meeting minutes_ show in its Meeting Minutes widget instead. Both appear on the Updates page.',
      },
      {
        kind: 'callout',
        tone: 'positive',
        title: 'Updates can carry pictures, attachments, and more.',
        text: 'In the Body, press `＋` between paragraphs to drop in a block. The choices: a **photo** (with a caption), a **photo gallery**, a **video** (YouTube or Vimeo — it loads only when a family taps play), an **Attachment** (a PDF, a form, a flyer — shows as a tap-to-download card), a **Callout box** (a tinted note for something important), a **Button** (a big tappable link), a **Sign-up sheet card** (shows if the sheet is open and links to it), an **Event card** (when and where, with add-to-calendar links), a **Table**, and **Two columns** of text.',
      },
      {
        kind: 'p',
        text: 'For something every family must notice (a closure, a deadline), also turn on **Highlight in the bell menu** on that Update. It sits at the top of the hub’s bell menu with an "Important" tag until you turn it off — so do turn it off once it has run its course.',
      },
      {
        kind: 'callout',
        tone: 'primary',
        title: 'The bell watches more than Updates.',
        text: 'Families see a row in the bell menu when any of these happen, so you never have to post an Update just to say it: a new **document**, a live **Spotlight pop-up**, a **teacher’s note or President’s note** given a new version stamp, a **new hub page** you build, an **event added to the calendar** in the last two weeks, and the **fundraising total** passing 50%, 75%, and the goal. The bell keeps room for each kind, so one busy week never hides the rest.',
      },
      { kind: 'h', text: 'Sign-up sheets and RSVPs' },
      {
        kind: 'p',
        text: 'The hub’s **Sign-ups** page replaces SignUpGenius. Create a sheet under **Family Hub → Sign-ups & RSVPs** and pick a kind:',
      },
      {
        kind: 'bullets',
        items: [
          '_Sign-up sheet_ for named slots (helper shifts, snack days). Give each slot a "how many needed" cap if you want one.',
          '_Event RSVP_ for a simple "we’ll be there" count.',
        ],
      },
      {
        kind: 'p',
        text: 'Families respond on the hub page; every response lands in **Sign-up responses** (and in the submissions Google Sheet + an email, once the forms inbox is set up).',
      },
      {
        kind: 'callout',
        tone: 'primary',
        title: 'Closing a sheet',
        text: 'Turn **Open for responses?** off and the sheet disappears from the hub page — the responses stay in your inbox. Two "Example" sheets are pre-loaded to copy from; rename or delete them freely.',
      },
      {
        kind: 'seealso',
        items: ['Build or edit a page', 'Do it yourself vs. ask for help'],
      },
    ],
  },

  {
    slug: 'new-hub-page',
    category: 'Family Hub',
    title: 'Add a new Family Hub page',
    icon: '🆕',
    lead: 'Make a whole new page for families — a committee, a programme, anything the school grows into.',
    diy: 'self',
    body: [
      {
        kind: 'callout',
        tone: 'positive',
        title: 'You can do this yourself.',
        text: 'Adding a page to the Family Hub used to need a developer. It does not any more. Everything below happens in the Studio.',
      },
      {
        kind: 'path',
        items: ['Family Hub', 'Hub pages', '＋ new', 'fill it in', 'Publish'],
        link: { pane: 'hubPage', ws: 'family-hub' },
      },
      {
        kind: 'steps',
        items: [
          'Open **Family Hub → Hub pages** and click `＋` to make a new one. Pick the _info page_ starting layout for a pre-filled beginning, or the blank one.',
          'Give it a **Page name** so you can find it in the list later.',
          'Leave **Which hub page** EMPTY. That box is only for the pages that came with the site.',
          'In **Web address**, type lowercase words joined by hyphens, e.g. `playground-committee`. Your page will live at `/family-hub/playground-committee`.',
          'Add your content in **Content** — the same sections every other hub page uses.',
          '`Publish`. Give it a minute and open the address to see it.',
        ],
      },
      {
        kind: 'h',
        text: 'Putting it in the menu',
      },
      {
        kind: 'p',
        text: 'Open **Family Hub → Family Hub menu**, pick a section (or make a new one), add a link of the kind **Page you made**, and choose your page. Drag it wherever you want in the section — your pages and the ones that came with the site order together. The next guide, "Edit the menus", covers everything the menu can do.',
      },
      {
        kind: 'callout',
        tone: 'positive',
        title: 'Not ready to announce it? Just don’t add the menu link yet.',
        text: 'The page still works at its address, so you can share the link with a couple of people and keep drafting. Add it to the menu when you are ready for everyone to see it.',
      },
      {
        kind: 'h',
        text: 'A few rules the Studio will hold you to',
      },
      {
        kind: 'p',
        text: 'The **web address** must be lowercase letters, numbers and hyphens — no spaces or capitals. And it cannot be one already used by a page that came with the site (`calendar`, `directory`, `tuition` and so on); the Studio will tell you if you pick one. That is not fussiness: a clashing address would make your page silently never appear.',
      },
      {
        kind: 'callout',
        tone: 'primary',
        title: 'There is a worked example to copy.',
        text: 'Look for **Example page (safe to delete)** in the Hub pages list. It is a real page built this way, with a few sections to show what is possible. Duplicate it as a starting point, or delete it — nothing else depends on it.',
      },
      {
        kind: 'p',
        text: 'Your new page is gated like the rest of the Family Hub, so only signed-in families can read it, and it turns up in the hub search straight away. Deleting the page removes it and its menu link together.',
      },
      {
        kind: 'seealso',
        items: ['Edit a Family Hub page', 'Edit the menus', 'Delete something (and get it back)'],
      },
    ],
  },

  {
    slug: 'first-visit-tour',
    category: 'Start here',
    title: 'The first-visit tour',
    icon: '🎈',
    lead: 'A short walkthrough that greets each family on their first sign-in to the Family Hub.',
    diy: 'self',
    body: [
      {
        kind: 'p',
        text: 'A family’s first visit to the hub starts with the **President’s welcome note**. When they close it, an eight-step **tour** opens: what the hub is, how to find your way, how to pick your class, helping days, what’s new and the bell, tuition, search, and where to get help. It works the same on a phone and a computer, and each family sees it once per device.',
      },
      {
        kind: 'path',
        items: ['Family Hub', 'First-visit tour', 'edit', 'Publish'],
        link: { doc: 'hubTour' },
      },
      {
        kind: 'p',
        text: 'You can rewrite the **heading and text of every step**. Leave a field blank to keep the standard wording. The class buttons and the phone/computer hints inside the steps are fixed, so the tour always matches how the hub really works.',
      },
      {
        kind: 'callout',
        tone: 'positive',
        title: 'Changed the hub a lot? Show the tour again.',
        text: 'Change the **version stamp** (e.g. to "2027-28") and every family sees the tour one more time on their next visit. Turn **Show the tour** off to retire it entirely.',
      },
      {
        kind: 'p',
        text: 'A family can rerun it any time: the **Take the tour** chip sits in the hub home’s greeting, next to the President’s note chip.',
      },
      {
        kind: 'p',
        text: 'Beyond the tour, small **feature hints** point at one control on a page the first time a family lands there — the Directory map, the Calendar filters. Each shows once per device. You control them in **Family Hub → Feature hints**: a master switch, a per-hint switch, and the wording.',
      },
      { kind: 'seealso', items: ['Edit a Family Hub page', 'Edit the menus'] },
    ],
  },

  {
    slug: 'little-delights',
    category: 'Family Hub',
    title: 'Fun days & the daily giggle',
    icon: '🎉',
    lead: 'The "Today is National Kazoo Day" line and the joke at the foot of the hub home.',
    diy: 'self',
    body: [
      {
        kind: 'path',
        items: ['Family Hub', 'Little delights', 'add a row', 'Publish'],
        link: { doc: 'hubDelights' },
      },
      {
        kind: 'p',
        text: 'The site ships with a few dozen **fun days** and kid-safe **giggles**. Anything you add here joins them: a fun day needs a date (like 02-14) and a name, and your entry wins if the site already had that date. A giggle needs a setup and a punchline; the day’s pick spreads across the calendar on its own.',
      },
      {
        kind: 'callout',
        tone: 'primary',
        title: 'Keep them preschool-safe.',
        text: 'These render to every family with no review step. If a joke makes you hesitate, it does not go in.',
      },
      { kind: 'seealso', items: ['Edit a Family Hub page'] },
    ],
  },

  {
    slug: 'pdf-content',
    category: 'School info & money',
    title: 'Edit the curriculum guides & supply list',
    icon: '📚',
    lead: 'The branded PDFs on the class pages. Edit the words here; the files rebuild themselves.',
    diy: 'self',
    body: [
      {
        kind: 'callout',
        tone: 'positive',
        title: 'You edit words, not files.',
        text: 'The Curriculum Guide PDFs and the School Supply List are generated from what you write here. Publish a change and the site rebuilds the PDFs within a few minutes — same fonts, same colours, no design tools needed.',
      },
      {
        kind: 'path',
        items: [
          'Family Hub',
          'Curriculum guides (PDF content) / School supply list',
          'edit',
          'Publish',
        ],
        link: { pane: 'curriculumGuide', ws: 'family-hub' },
      },
      {
        kind: 'steps',
        items: [
          'For a curriculum guide: pick the class document, edit the intro or any section’s objectives, and `Publish`. To write one for a class you added, make a NEW curriculum guide and pick that class — the PDF and the button on its hub page both appear by themselves.',
          'For the supply list: update the **School year**, the per-class items, or the wish list, and `Publish`. Added a class? Add a row under **Per-class lists**, pick it, and type its items — it gets its own card on the printed list, in its own colour.',
          'Give the site a few minutes to rebuild, then open the PDF from the class page to check it.',
        ],
      },
      {
        kind: 'p',
        text: 'Each fall the supply list needs its **School year** bumped and the items reviewed — that is the whole yearly refresh now.',
      },
      { kind: 'seealso', items: ['Edit a Family Hub page'] },
    ],
  },

  {
    slug: 'link-health',
    category: 'Website pages & menus',
    title: 'The weekly link check',
    icon: '🩺',
    lead: 'Every Monday the site tests the Google links families rely on and reports what it finds.',
    diy: 'self',
    body: [
      {
        kind: 'p',
        text: 'The hub leans on shared Google links: the helper schedules, the photo albums, the budget sheet, the calendar feed, and the Documents page. When one dies, a parent used to find it first. Now a weekly check pings every one of them.',
      },
      {
        kind: 'path',
        items: ['Family Hub', 'Link health (weekly check)'],
        link: { doc: 'linkHealth' },
      },
      {
        kind: 'p',
        text: 'Open it after a Monday and read the summary. A red row names the broken link in plain English. To fix one: open that file in Google, share it again ("Anyone with the link"), copy the fresh link, and paste it where the site keeps it — the class page fields, Hub settings (the Google connections), or the Documents list.',
      },
      {
        kind: 'callout',
        tone: 'primary',
        title: 'This page is a report, not a form.',
        text: 'The check writes it; you cannot edit it. Fix the link at its home and the next Monday run turns the row green.',
      },
      { kind: 'seealso', items: ['Edit a Family Hub page'] },
    ],
  },

  {
    slug: 'edit-menus',
    category: 'Website pages & menus',
    title: 'Edit the menus',
    icon: '🔗',
    lead: 'The links along the top of the site and down in the footer live in one place.',
    diy: 'self',
    body: [
      {
        kind: 'h',
        text: 'The Family Hub menu is its own document',
      },
      {
        kind: 'p',
        text: 'The menu on the Family Hub’s left side is edited in **Family Hub → Family Hub menu** — same idea, hub-side. You can rename its sections, reorder them, move links between them, rename a link, temporarily hide one, add pages you have made, or add an outside link. **Home stays put on its own** so it can never be lost, and section colours are picked from four pre-checked choices so every label stays readable on the navy.',
      },
      {
        kind: 'callout',
        tone: 'caution',
        title: 'Think twice before hiding Tuition or the Directory.',
        text: 'Families lean on those daily, and the Studio will warn you if the menu no longer shows them. Emptying the whole menu is safe — the hub falls back to the standard one.',
      },
      {
        kind: 'callout',
        tone: 'positive',
        title: 'One place for every menu.',
        text: 'The top navigation bar, the footer columns, and the small legal links at the very bottom all come from **Menus (header & footer)**. Change a link once here and it updates everywhere that menu shows.',
      },
      {
        kind: 'path',
        items: [
          'Public website workspace',
          'Site setup',
          'Menus (header & footer)',
          'edit',
          'Publish',
        ],
        link: { doc: 'navigation' },
      },
      {
        kind: 'p',
        text: 'Menus live under **Site setup** in the **Public website** workspace (they are easy to break, so they sit at the bottom, out of the everyday eye-line). If you are in the Family Hub workspace, switch with the name in the top-left corner first.',
      },
      { kind: 'h', text: 'Add a link to the top menu' },
      {
        kind: 'steps',
        items: [
          'Open **Menus (header & footer)**.',
          'In **Main navigation**, click `Add item`, then choose **Link**.',
          'Type the label people will see, then pick **Link to a page** and choose the page. (For an outside website, pick **Web address** and paste the link instead.)',
          '`Publish`.',
        ],
      },
      {
        kind: 'p',
        text: 'A **dropdown** (a menu item with links tucked under it) is the "Group" option instead of "Link". Give the group a label, then add the links inside it.',
      },
      {
        kind: 'callout',
        tone: 'positive',
        title: 'There is a quicker way for a plain page link.',
        text: 'In **Pages**, the list beside the live preview has a `⋮⋮` grip on each page. Drag a page into **In the menu** to add it, drag it out to remove it, and drag it up or down to change the order. Come back here for renaming a link, for dropdowns, and for the footer.',
      },
      { kind: 'h', text: 'Change the button at the top right' },
      {
        kind: 'p',
        text: 'The **Header button** panel (same tab as the header menu) controls the one button in the top bar. It ships as "Schedule a Tour", pointing at the tour form. Open the panel only if you want something different:',
      },
      {
        kind: 'bullets',
        items: [
          '**Show the button** off takes the button out of the header. Think twice: it is the main way a new family asks to visit.',
          '**Button wording** replaces the words. Leave it blank to keep them. Keep any new wording short, because the button sits in a tight row.',
          '**Button goes to** points it at a different page or web address. Leave it blank to keep the tour form.',
        ],
      },
      {
        kind: 'p',
        text: 'Every part of the panel is optional. An empty panel means the button stays exactly as it is now. To see your change, open a page in **Presentation** and look at the top bar.',
      },
      {
        kind: 'callout',
        tone: 'primary',
        title: 'If a menu is left empty',
        text: 'If you ever clear a menu out completely, the site falls back to its original built-in menu, so visitors are never left without navigation.',
      },
      { kind: 'seealso', items: ['Build or edit a page'] },
    ],
  },

  {
    slug: 'history',
    category: 'Yearly jobs & housekeeping',
    title: 'See history and restore an old version',
    icon: '⏪',
    lead: 'Every change is remembered, so you can look back and roll one back.',
    diy: 'self',
    body: [
      {
        kind: 'callout',
        tone: 'positive',
        title: 'You have a safety net.',
        text: 'Sanity keeps a history of edits to each thing you work on. If something got changed by mistake, you can see what it was before and put it back.',
      },
      { kind: 'h', text: 'See what changed' },
      {
        kind: 'steps',
        items: [
          'Open the page, class, post, or other item you want to check.',
          'Click the `⋯` menu at the top right and choose **Review changes** (or the history/clock icon).',
          'Scroll the timeline on the right to see each past version and exactly what was edited.',
        ],
      },
      { kind: 'h', text: 'Put an old version back' },
      {
        kind: 'steps',
        items: [
          'In that history view, find the version you want.',
          'Use its menu to `Restore` it. That brings the old wording back as your current draft.',
          'Review it, then `Publish` to make it live again.',
        ],
      },
      {
        kind: 'callout',
        tone: 'default',
        title: 'How far back it goes',
        text:
          'How long history is kept depends on the plan the school is on. Recent changes are always there; very old ones may not be. When in doubt, ask ' +
          SITE.contactName +
          '.',
      },
      { kind: 'seealso', items: ['Undo a change', 'Delete something (and get it back)'] },
    ],
  },

  {
    slug: 'trash',
    category: 'Yearly jobs & housekeeping',
    title: 'Delete something (and get it back)',
    icon: '🗑️',
    lead: 'Deleting is safe — it goes to Recently deleted, so you can undo it.',
    diy: 'self',
    body: [
      {
        kind: 'callout',
        tone: 'positive',
        title: 'Nothing is gone for good by accident.',
        text: 'When you delete a page, post, event, class, or other item, it moves to a Recently deleted list instead of vanishing. You can restore it any time until you choose to empty it.',
      },
      { kind: 'h', text: 'Delete something' },
      {
        kind: 'steps',
        items: [
          'Open the item and click the `⋯` menu at the top, then **Delete (move to trash)**.',
          'It disappears from its list and from the website, and a note tells you it went to Recently deleted.',
        ],
      },
      {
        kind: 'callout',
        tone: 'caution',
        title: '"Still in use"?',
        text: 'If other pages link to the thing you are deleting, it won’t let you (that would leave broken links). Open it, check the **Used on** tab to see what points to it, remove those links, then delete.',
      },
      {
        kind: 'callout',
        tone: 'primary',
        title: 'For a page, try Archive first.',
        text: 'In the page list beside the live preview, the `⋯` on a page offers **Archive**: the page comes off the website but stays in the Studio, in an **Archived** group, ready to **Restore**. It works even when other pages still link to it, so it is the easy way to put a page away for a season. See "Build or edit a page".',
      },
      { kind: 'h', text: 'Get it back, or clear it for good' },
      {
        kind: 'path',
        items: ['Recently deleted', 'pick an item', '⋯', 'Restore (or Delete forever)'],
        link: { pane: 'trashedItem' },
      },
      {
        kind: 'steps',
        items: [
          'Open **Recently deleted** in the left menu (near the bottom).',
          'Click the item you want, then `Restore` to bring it back exactly as it was.',
          'To clear space, use `Delete forever` on an item you are sure about. That one can’t be undone.',
        ],
      },
      {
        kind: 'seealso',
        items: ['See history and restore an old version', 'Clear out old records'],
      },
    ],
  },

  {
    slug: 'write-post',
    category: 'News, events & alerts',
    title: 'Write a news post',
    icon: '📰',
    lead: 'Share an announcement, update, or story on the News page.',
    diy: 'self',
    body: [
      {
        kind: 'p',
        text: 'The **News** page is your blog. Posts show newest first, and the three most recent also appear on the homepage. Writing one is like writing a document.',
      },
      {
        kind: 'path',
        items: ['News', '＋ new', 'write', 'Publish'],
        link: { pane: 'post', ws: 'public' },
      },
      {
        kind: 'steps',
        items: [
          'Click **News** in the left menu, then the `＋` (new) button.',
          'Type a **Title**, then click `Generate` next to the slug to make its web address.',
          'Pick a **Category**, add a short **Summary** (this shows on the News list and when the post is shared), and a **Cover image** if you have one.',
          'Write the **Body**. Use the toolbar for headings, bold, links, bullet lists, and to drop in photos or an **Attachment** (a PDF or form families download with one tap). The `＋` menu also offers a **Callout box**, a **Button**, a **Sign-up sheet card**, an **Event card**, a **Table**, and **Two columns**.',
          'Add **Alt text** to any photo you place in the body.',
          '`Publish` when you are ready for it to go live (usually within a minute or two).',
        ],
      },
      {
        kind: 'callout',
        tone: 'primary',
        title: 'Feature it on the homepage',
        text: 'Every new post already appears in the homepage news row automatically (newest three). There is nothing extra to do.',
      },
      {
        kind: 'callout',
        tone: 'positive',
        title: 'Preview as you write',
        text: 'Open a post and the live preview shows exactly how it will look, and refreshes as you edit. Click text in the preview to jump straight to it.',
      },
      { kind: 'seealso', items: ['Photos and images'] },
    ],
  },

  {
    slug: 'newsletter',
    category: 'News, events & alerts',
    title: 'Put out a newsletter',
    icon: '🗞️',
    lead: 'Compose an issue, give it a web page, and (optionally) email it to families.',
    diy: 'self',
    body: [
      {
        kind: 'p',
        text: 'A **Newsletter issue** is written just like a News post, but it lives on its own newsletter pages: each published issue gets a web address at /newsletter/<its slug> and a card in the archive at /newsletter/archive. Families can read it on the web whether or not you email it.',
      },
      {
        kind: 'path',
        items: ['Newsletter issues', '＋ new', 'write', 'Publish'],
        link: { pane: 'newsletterIssue', ws: 'public' },
      },
      {
        kind: 'steps',
        items: [
          'Click **Newsletter issues** in the left menu, then `＋`.',
          'Type a **Title** (e.g. "October Newsletter") and click `Generate` for its web address.',
          'Add a short **Summary** (shown on the archive card and used as the email teaser), a **Cover image** if you have one, and write the **Body** with the toolbar.',
          '`Publish`. The issue is now live at its web address and in the archive.',
        ],
      },
      {
        kind: 'callout',
        tone: 'primary',
        title: 'Emailing it is optional',
        text: 'Publishing puts the issue on the web. Emailing it to families is a separate step that Nathan sets up once (it links families to the web page). Ask him if you want an issue emailed out. After it goes, you can note the date in "Date emailed to families" for your records.',
      },
      { kind: 'seealso', items: ['Write a news post', 'Photos and images'] },
    ],
  },

  {
    slug: 'add-event',
    category: 'News, events & alerts',
    title: 'Add an event',
    icon: '📅',
    lead: 'Put an open house, tour day, or community event on the public Events page.',
    diy: 'self',
    body: [
      {
        kind: 'p',
        text: 'The **Events** page shows what is coming up. An event drops off the page on its own once it has passed (and moves into a "Past events" list at the bottom), so the list stays current with no cleanup.',
      },
      {
        kind: 'path',
        items: ['Events', '＋ new', 'fill in', 'Publish'],
        link: { pane: 'event', ws: 'public' },
      },
      {
        kind: 'steps',
        items: [
          'Click **Events** in the left menu, then `＋`.',
          'Give it a title and pick the **Starts** date and time. Add an **Ends** time if it has one.',
          'Turn on **All-day** for something without a set time (like a closure).',
          'For a repeating event (a weekly class, a monthly meeting), set **Does it repeat?** and, if you like, a **Repeat until** date. The page shows the upcoming dates automatically.',
          'Choose a **Type**, and add a location, description, or a button link (like an RSVP form) if you want.',
          '`Publish`. Visitors get an "Add to calendar" button automatically.',
        ],
      },
      {
        kind: 'callout',
        tone: 'positive',
        title: 'Visitors can filter by type.',
        text: 'When there are events of different types coming up, the page shows filter buttons (Open house, Fundraiser, and so on) so visitors can narrow the list.',
      },
      {
        kind: 'callout',
        tone: 'primary',
        title: 'Show events on another page',
        text: 'On any page you build, you can add an **Upcoming events** section to show the next few events. It hides itself when nothing is coming up.',
      },
      {
        kind: 'callout',
        tone: 'default',
        title: 'This is different from the Family Hub calendar',
        text: 'These are public events anyone can see. The private, families-only calendar lives in the Family Hub.',
      },
    ],
  },

  {
    slug: 'form-messages',
    category: 'Yearly jobs & housekeeping',
    title: 'Read messages from your forms',
    icon: '📨',
    lead: 'When someone fills out a contact or tour form, the message lands here.',
    diy: 'self',
    body: [
      {
        kind: 'p',
        text: 'Every message sent through a form on the website is saved under **Form submissions**, so nothing gets lost. If email notifications are set up, you also get an email when one arrives.',
      },
      {
        kind: 'path',
        items: ['Form submissions', 'pick a folder', 'open a message', 'reply', 'mark Handled'],
        link: { pane: 'submissions', ws: 'public' },
      },
      {
        kind: 'steps',
        items: [
          'Click **Form submissions** in the left menu.',
          'Pick a folder: **Needs a reply** shows everything not yet handled; below that is one folder per form (Tour request, Contact us, and so on — new forms get their own folder automatically); **All messages** is the whole pile. Newest is on top.',
          'Open a message to see the name, email, phone, and what they wrote.',
          'Reply from your own email using the address shown.',
          'Turn on **Handled?** so the board knows it has been taken care of (it leaves the Needs a reply folder).',
        ],
      },
      {
        kind: 'callout',
        tone: 'caution',
        title: 'Keep these private',
        text: 'These messages include people’s contact details. Treat them as private, the same as the Family Hub.',
      },
      {
        kind: 'p',
        text: 'To put a form on a page, edit the page and add a **Contact form** section (see "Build or edit a page").',
      },
      { kind: 'seealso', items: ['Build your own form'] },
    ],
  },

  {
    slug: 'build-your-own-form',
    category: 'Website pages & menus',
    title: 'Build your own form',
    icon: '📝',
    lead: 'Ask the questions you want. No developer needed.',
    diy: 'self',
    body: [
      {
        kind: 'p',
        text: 'A **Contact form** section comes with a set of ready-made questions (a tour request, an enrollment question, and so on). If none of them fit, write your own questions instead.',
      },
      {
        kind: 'path',
        items: ['Pages', 'pick a page', 'Add item', 'Contact form', 'Your own questions'],
        link: { pane: 'pages', ws: 'public' },
      },
      { kind: 'h', text: 'Add your questions' },
      {
        kind: 'steps',
        items: [
          'Open the page and add a **Contact form** section (or open the one already there).',
          'Fill in the **Topic**. It names the folder your messages land in, for example "Field trip helpers".',
          'Scroll to **Your own questions** and click `Add item`.',
          'Type the **Question**, for example "Which day works best?".',
          'Pick the **Answer type**: Short text, Email address, Phone number, Long text, Choose one from a list, or a Yes / no tick box.',
          'For **Choose one from a list**, add each choice under **Choices**.',
          'Turn on **Must be answered?** if the visitor cannot send the form without it.',
          'Add more questions the same way. `Publish`.',
        ],
      },
      {
        kind: 'callout',
        tone: 'primary',
        title: 'Name, email, and phone are always asked.',
        text: 'The form asks for a first name, last name, email, and phone before your questions, so you can always write back. Do not add those again.',
      },
      {
        kind: 'callout',
        tone: 'caution',
        title: 'One form asks up to 12 questions.',
        text: 'A short form gets more answers. If you need more than 12 questions, ask the important ones here and send a longer form in your reply.',
      },
      { kind: 'h', text: 'What the visitor sees' },
      {
        kind: 'bullets',
        items: [
          'Your questions show in the order you put them in. Drag a row to move it.',
          'A must-be-answered question shows a red star. The visitor cannot send the form until it is answered.',
          'Every other question shows "(optional)".',
          '**Button label** and **Thank-you message** work the same as always. Set them if "Send message" is not the right words.',
        ],
      },
      { kind: 'h', text: 'Where the answers go' },
      {
        kind: 'p',
        text: 'Nothing changes for you: the message lands in **Form submissions** under your Topic, and in the email and the Google Sheet if those are set up. Each answer shows as a line, for example "Which day works best?: Tuesday".',
      },
      {
        kind: 'p',
        text: 'The **Note for the board** box is for you, not the visitor. Use it to remind the next person what this form is for, or who should read the messages. It never shows on the website.',
      },
      {
        kind: 'callout',
        tone: 'primary',
        title: 'Empty list, old form.',
        text: 'Leave **Your own questions** empty and the form keeps its ready-made questions. Your live forms are not affected.',
      },
      { kind: 'seealso', items: ['Read messages from your forms', 'Build or edit a page'] },
    ],
  },

  {
    slug: 'alert-banner',
    category: 'News, events & alerts',
    title: 'Post a closure or alert',
    icon: '🚨',
    lead: 'Show a banner at the top of every page — for a snow day, an early dismissal, or any urgent notice.',
    diy: 'self',
    body: [
      {
        kind: 'path',
        items: ['Alert banner', 'turn on + write message', 'Publish'],
        link: { doc: 'closureAlert' },
      },
      {
        kind: 'steps',
        items: [
          'Click **Alert banner** near the top of the left menu.',
          'Turn on `Show this alert on the site?`',
          'Write the **Message** (for example "Closed today due to snow. Class resumes tomorrow.").',
          'Pick a **Style** — Info (blue), Warning (amber), or Urgent (red). Add a button link if useful.',
          '`Publish`. It shows on every page a minute or two later.',
        ],
      },
      {
        kind: 'callout',
        tone: 'critical',
        title: 'Remember to turn it off',
        text: 'When the closure is over, come back, turn `Show this alert` off, and Publish. Otherwise the banner stays up.',
      },
      {
        kind: 'callout',
        tone: 'primary',
        title: 'Planning ahead for a known closure?',
        text: 'For something you know about in advance (not a surprise snow day), use an **announcement bar or popup** instead — those have their own start and end dates, so you can set them up early and they appear and disappear on their own.',
      },
      { kind: 'seealso', items: ['Post an announcement bar or popup'] },
    ],
  },

  {
    slug: 'announcements',
    category: 'News, events & alerts',
    title: 'Post an announcement bar or popup',
    icon: '📢',
    lead: 'Ready-made bars and popups you turn on and off — waitlist status, open house, fundraiser, and more.',
    diy: 'self',
    body: [
      {
        kind: 'p',
        text: 'This is for planned, friendly messages on the public site. (The **Alert banner** is the separate, urgent snow-day one.) You can have several going at once, each turned on or off on its own, and set to appear and disappear on their own dates.',
      },
      {
        kind: 'path',
        items: ['Announcements', '＋ new', 'pick a type', 'turn on', 'Publish'],
        link: { pane: 'announcement', ws: 'public' },
      },
      {
        kind: 'steps',
        items: [
          'Click **Announcements** near the top of the left menu, then `＋`.',
          'Pick a ready-made type: **Open house bar**, **Enrollment / waitlist bar**, **Fundraiser bar**, **General notice**, **Welcome popup**, or **Event popup**. It fills in sensible wording and colors.',
          'Edit the message, color, and (optional) button. For a bar, it shows across the top of every page; a popup opens in the middle of the screen.',
          'Under **When it shows**, flip **Turn it on**. Optionally set **Start showing** / **Stop showing** dates so it appears and vanishes on its own.',
          '`Publish`. To take it down, come back and turn it off (or just let its end date pass).',
        ],
      },
      {
        kind: 'callout',
        tone: 'positive',
        title: 'The waitlist bar fills itself in.',
        text: 'The **Enrollment / waitlist** type reads your class availability sheet (the same one behind the "spots open" badges) and writes the message for you, e.g. "Now enrolling — Threes & Pre-K open, Twos waitlist." It stays current on its own. Type your own message to override it.',
      },
      {
        kind: 'bullets',
        items: [
          '**Several at once:** turn on as many bars as you like; they stack at the top in the **Order** you set (lower number first).',
          '**Only certain pages:** under **Where it shows**, choose "Only the pages I choose" (e.g. an open-house bar everywhere except the enroll page).',
          '**Popups:** choose how often each visitor sees it (once, once per visit, or every time). Change the **Version stamp** after editing to show it again to people who already closed it.',
        ],
      },
      { kind: 'seealso', items: ['Post a closure or alert'] },
    ],
  },

  {
    slug: 'edit-class',
    category: 'School info & money',
    title: 'Add or change a class',
    icon: '🎒',
    lead: 'Classes are the heart of the site. Editing one here updates it everywhere it appears.',
    diy: 'self',
    body: [
      {
        kind: 'callout',
        tone: 'positive',
        title: 'Set it once, it updates everywhere.',
        text: 'A class’s schedule, ages, and tuition appear on its own page, the tuition table, and the Family Hub. They all read from this one place, so you only change it here.',
      },
      { kind: 'h', text: 'To change a class' },
      {
        kind: 'path',
        items: ['Public website workspace', 'Classes', 'pick the class', 'edit', 'Publish'],
        link: { pane: 'orderable-class', ws: 'public' },
      },
      {
        kind: 'p',
        text: 'Classes live under **School info** in the **Public website** workspace. Shortcut from either workspace: **Money & payments** → **Class tuition (open a class)** opens the very same class editor.',
      },
      {
        kind: 'steps',
        items: [
          'Click **Classes** in the left menu.',
          'Click the class you want to change.',
          'Use the tabs at the top (Basics, Schedule & ages, Tuition & payment, Page details) to find the field.',
          'Change the boxes, then `Publish`.',
        ],
      },
      {
        kind: 'callout',
        tone: 'primary',
        title: 'Each year, refresh the two links on the Basics tab',
        text: 'Every class has a **Helper schedule link** (the Google Sheet where families sign up to help) and a **Class photo album link** (this year’s Google Photos album). Both show on the Family Hub home, so paste in the new links at the start of each school year.',
      },
      { kind: 'h', text: 'To add a brand-new class' },
      {
        kind: 'p',
        text: 'Maybe a summer class or a new session. You can add as many as you like. Make the class and almost everything follows on its own — including its **Family Hub page**, which exists the moment you publish. Two optional buttons fill in the rest.',
      },
      {
        kind: 'steps',
        items: [
          '**Make the class.** Click **Classes**, then the `＋` (new) button. Fill in the name, click `Generate` for the web address (slug), then pick a **colour** and an **icon**, and fill in the schedule, ages, and tuition. Pick the teacher from the Staff list, and paste in the **Helper schedule link** and the **Class photo album link**. `Publish`.',
          '**Check the Family Hub.** The class is already there: its own page at `/family-hub/<web address>`, a link in the hub menu, a helper-schedule tile and a photo-album tile on the hub home, a button in the "Which classes are yours?" picker, a row on the hub Tuition page, and a filter in the Directory. Nothing to set up.',
          '**Optional — give it a public page.** On the class, open the `⋯` menu and click **Create its page**. That copies an existing class page to the right address and opens the draft. Put in this class’s words and photos, then `Publish`. The moment the page is live, the **Classes menu** adds its link automatically.',
          '**Optional — give it a handbook.** On the class, open the `⋯` menu and click **Create its hub page**. That starts the teacher’s parent handbook (daily routine, drop-off and pick-up, snack duty, the helper playbook) as a draft at the right address. Fill it in and `Publish`. Until you do, the class’s hub page still works — it just says the handbook is not written yet.',
        ],
      },
      {
        kind: 'callout',
        tone: 'primary',
        title: 'Two classes that share a teacher share ONE hub page.',
        text: 'Twos and Threes are one page, and both Pre-K classes are another, because each pair shares a teacher and a handbook. That is set on the hub page itself: **Classes on this page**. Leave it empty on a normal page. Put two or more classes in it and they get one shared classroom page, with a fact card, pay button, helper sheet and photo album for each.',
      },
      {
        kind: 'callout',
        tone: 'primary',
        title: 'The Used on panel is your checklist.',
        text: 'Open the class and look at **Used on** at the top: it lists every page the class appears on, live. A hand-picked class cards row (like the one on the Pre-K page) never changes by itself — add the class there yourself if it belongs.',
      },
      {
        kind: 'callout',
        tone: 'caution',
        title: 'PayPal buttons',
        text:
          'The **PayPal button** fields connect the "Pay Tuition" buttons to real money. If you are adding a new class that needs its own pay button, check with ' +
          SITE.contactName +
          ' before filling those in.',
      },
      {
        kind: 'callout',
        tone: 'positive',
        title: 'A welcome note and a curriculum guide, too.',
        text: 'The **Teacher welcome note** and the **Curriculum guide (PDF)** both ask which class page they belong to, and that list now includes every class you add. Pick the new class and it appears on its hub page — the note as a first-visit letter, the guide as a "Curriculum guide (PDF)" button. **Who’s who this year** gains a “<Class name> Rep” seat for the class too, so its class-rep card can be filled in instead of staying "To be announced".',
      },
      { kind: 'seealso', items: ['Change tuition or fees', 'Add or edit a teacher'] },
    ],
  },

  {
    slug: 'edit-tuition',
    category: 'School info & money',
    title: 'Change tuition or fees',
    icon: '💳',
    lead: 'Where the prices live, and the one thing to double-check before you publish.',
    diy: 'ask',
    body: [
      { kind: 'h', text: 'Monthly tuition (per class)' },
      {
        kind: 'p',
        text: 'Each class’s **monthly** and **annual** tuition live on the class itself.',
      },
      {
        kind: 'path',
        items: ['Money & payments', 'Class tuition (open a class)', 'Tuition & payment tab'],
        link: { pane: 'money;class-tuition' },
      },
      { kind: 'h', text: 'Registration and participation fees' },
      {
        kind: 'p',
        text: 'The one-time fees and the "how payments work" answers live in **Tuition & Fees**, inside **Money & payments** — the one folder that gathers every dollar amount on the site (fees, class tuition, the yearly budget, fundraising campaigns).',
      },
      { kind: 'path', items: ['Money & payments', 'Tuition & Fees'], link: { doc: 'feeSchedule' } },
      { kind: 'h', text: 'The student fee' },
      {
        kind: 'p',
        text: 'The student fee is set **on the class**, next to its tuition — one number per class, in one place. The class page, the Tuition page’s pay button, and the printed enrolment packet all read it from there.',
      },
      {
        kind: 'callout',
        tone: 'positive',
        title: 'You no longer type this twice.',
        text: 'It used to be entered on the class AND again as a "fee band" in Tuition & Fees, and the two drifted — a retired PayPal button sat on the class pages for weeks. The Tuition page now groups classes charging the same amount into one button by itself, so setting the fee on each class is all there is to do.',
      },
      { kind: 'h', text: 'The PayPal "Pay" buttons' },
      {
        kind: 'p',
        text: 'Where the buttons live: each class’s tuition button is on the class (**Classes**, pick the class, **Tuition & payment** tab, "PayPal button"); the registration, participation, and student-fee buttons are in **Tuition & Fees**.',
      },
      {
        kind: 'p',
        text: 'For a button made in PayPal’s current system, open the button in PayPal, choose `Copy link`, and paste the whole link. It starts with paypal.com/ncp/payment/. (Buttons made in PayPal’s old system used a short code of letters and numbers instead; a code that is already in a box keeps working until that button is replaced.)',
      },
      {
        kind: 'callout',
        tone: 'caution',
        title: 'Double-check a new PayPal button.',
        text: 'A wrong link sends a family’s payment to the wrong place. After you change one, open the tuition page, click that Pay button, and confirm it shows the right amount in PayPal before you tell families.',
      },
      {
        kind: 'callout',
        tone: 'caution',
        title: 'Prices are a big deal. Loop in ' + SITE.contactName + '.',
        text:
          'Because tuition is set by the board and tied to the budget, please confirm any price change with the board and ' +
          SITE.contactName +
          ' before you publish. Editing the number is easy; the point is to make sure it is the agreed number.',
      },
      { kind: 'seealso', items: ['Add or change a class', 'Enrollment status & cost calculator'] },
    ],
  },

  {
    slug: 'edit-budget',
    category: 'School info & money',
    title: 'Update the yearly budget',
    icon: '📊',
    lead: 'The member-approved operating budget families see on the Budget & Fundraising page.',
    diy: 'self',
    body: [
      {
        kind: 'callout',
        tone: 'positive',
        title: 'The Treasurer owns this now.',
        text: 'The budget used to be written into the code, so changing it meant asking a developer. It is yours to edit, and the Family Hub picks it up within a minute or two.',
      },
      {
        kind: 'path',
        items: ['Money & payments', 'Operating budget (yearly)', 'edit', 'Publish'],
        link: { doc: 'operatingBudget' },
      },
      {
        kind: 'steps',
        items: [
          'Open **Money & payments → Operating budget (yearly)**.',
          'Set the **Budget year** and the **Comparison year** the "last year" column refers to.',
          'Under **The budget**, each section is either money coming in or money going out. Open one and edit its lines.',
          'Each line has a name, **This year**, an optional **Last year**, and an optional note. Type plain numbers — 54810, not $54,810.',
          '`Publish`.',
        ],
      },
      {
        kind: 'callout',
        tone: 'positive',
        title: 'Never add up a total yourself.',
        text: 'Section subtotals, total income, total costs, and the surplus or shortfall are all worked out from the lines when the page loads. Change a line and every total follows, so the summary can never disagree with the table beneath it.',
      },
      {
        kind: 'p',
        text: 'Adding a new line? Leave **Last year** empty — the page then shows no comparison for it rather than printing "was $0", which would read as a real figure.',
      },
      {
        kind: 'callout',
        tone: 'caution',
        title: 'Publish the approved version.',
        text: 'This is the budget the membership voted on, so it should match the approved document. If you are drafting next year’s, wait until it passes before publishing it here.',
      },
      { kind: 'seealso', items: ['Change tuition or fees'] },
    ],
  },

  {
    slug: 'enrollment-status',
    category: 'School info & money',
    title: 'Enrollment status & cost calculator',
    icon: '📝',
    lead: 'One switch changes your enrollment message everywhere, plus a "what will it cost?" tool for families.',
    diy: 'self',
    body: [
      { kind: 'h', text: 'Flip your enrollment status in one place' },
      {
        kind: 'p',
        text: 'In **Site Settings → School year** there is an **Enrollment mode**: **Open** (accepting families), **Waitlist** (full, taking names), or **Closed** (between seasons). Set it once and every "Enrollment status banner" you have added to a page updates its wording and button to match.',
      },
      {
        kind: 'path',
        items: [
          'Public website workspace',
          'Site Settings',
          'School year',
          'Enrollment mode',
          'Publish',
        ],
        link: { doc: 'siteSettings' },
      },
      {
        kind: 'steps',
        items: [
          'To place the banner: open a **page**, add an **Enrollment status banner** section, and set where its button points (usually the enroll or Visit Us page).',
          'When enrollment is open, you can set an optional **deadline** in Site Settings, and the banner shows "Apply by ...".',
        ],
      },
      { kind: 'h', text: 'The tuition cost calculator' },
      {
        kind: 'p',
        text: 'Add a **Tuition calculator** section to a page (great on the enroll or tuition page). Families tick the class they are considering and see the monthly tuition and fees, pulled straight from your Classes and Tuition & Fees, so it is always current. Nothing to keep updated.',
      },
      { kind: 'h', text: 'The printable enrollment packet' },
      {
        kind: 'p',
        text: 'There is a ready-made, print-friendly enrollment packet at **/enrollment-packet**. It gathers your school info, the class and tuition table, the fees, the key dates, and how-to-enroll steps into one clean document a family can print or save as a PDF from their browser. It fills itself in from your Classes, Tuition & Fees, and Site Settings, so it is always current, with nothing to maintain.',
      },
      {
        kind: 'callout',
        tone: 'primary',
        title: 'Link it where families will find it',
        text: 'To point families to it, add a **Button** on your enroll or tuition page (or a menu link) with the web address /enrollment-packet. The page itself is always ready at that address.',
      },
    ],
  },

  {
    slug: 'edit-staff',
    category: 'School info & money',
    title: 'Add or edit a teacher',
    icon: '👩‍🏫',
    lead: 'Write a teacher’s name and bio once. It shows up correctly on every page.',
    diy: 'self',
    body: [
      {
        kind: 'callout',
        tone: 'positive',
        title: 'One bio, everywhere.',
        text: 'A teacher used to be re-typed on several pages, and the versions drifted apart. Now you write it once in **Staff** and it appears the same everywhere, including on the class they teach.',
      },
      {
        kind: 'path',
        items: [
          'Public website workspace',
          'Staff',
          'pick the person (or ＋ new)',
          'edit',
          'Publish',
        ],
        link: { pane: 'staff', ws: 'public' },
      },
      {
        kind: 'steps',
        items: [
          'In the **Public website** workspace (where the Studio opens), click **Staff** under School info.',
          'Click a person to edit, or `＋` to add someone new.',
          'Fill in their name, title (Mrs.), role, and bio. Add a photo if you have one.',
          '`Publish`.',
        ],
      },
      {
        kind: 'p',
        text: 'To connect a teacher to a class, open the **class** and pick them in the **Teacher** field. That link is the only place you set it.',
      },
      {
        kind: 'callout',
        tone: 'primary',
        title: 'The teacher walls and the class cards update themselves.',
        text: 'The "people your child will love" walls (Why WCP, Visit) show **every** teacher automatically, in the order of the Staff list — drag people up or down there to reorder the wall. Each class page’s "Meet the teacher" card follows the class’s **Teacher** field. So when someone joins or leaves: edit Staff, point the class at the right teacher, and every card is already correct. The one thing to reword by hand is a heading that names them, like "Meet Mrs. Erin".',
      },
      { kind: 'seealso', items: ['Add or change a class', 'Photos and images'] },
    ],
  },

  {
    slug: 'org-chart',
    category: 'School info & money',
    title: 'Change the co-op roles or the org chart',
    icon: '🤝',
    lead: 'Rename a job, add one, retire one, or change who reports to whom. The chart on the Co-op Jobs page redraws itself.',
    diy: 'self',
    body: [
      {
        kind: 'callout',
        tone: 'positive',
        title: 'This used to need a developer. It does not any more.',
        text: 'The org chart is drawn from the **Co-op roles & org chart** list. Every box on it, every column, and every line between boxes comes from that list — so the shape of your co-op is yours to change, not something written into the website.',
      },
      {
        kind: 'path',
        items: ['Family Hub', 'Co-op roles & org chart'],
        link: { pane: 'coopRole', ws: 'family-hub' },
      },
      { kind: 'h', text: 'Rename a role' },
      {
        kind: 'steps',
        items: [
          'Open the role and change **Role**.',
          '`Publish`. The chart, the job list, and the person holding it all follow the new name.',
        ],
      },
      {
        kind: 'callout',
        tone: 'positive',
        title: 'Renaming never loses the person.',
        text: 'Whoever holds the job is attached to the ROLE, not to its name. Rename "Publicity Chair" to "Communications Chair" and her card, photo and email move with it.',
      },
      { kind: 'h', text: 'Add a role' },
      {
        kind: 'steps',
        items: [
          'Press **＋** and name it.',
          'Pick **Where it sits**: Executive Board, Cabinet chair, Class representative, or Committee. (Paid staff is for the teachers and administrator — those show on the chart but not in the job list, because they are not jobs a family signs up for.)',
          'Pick **Reports to** — the role above it. A Board role with people reporting to it gets its own column on the chart. A committee shows as a small tag under whoever it reports to.',
          'Write **What they do** so it appears in the job list, and add **How many people** for a committee.',
          '`Publish`, then drag it up or down the list to place it.',
        ],
      },
      { kind: 'h', text: 'Retire a role' },
      {
        kind: 'steps',
        items: [
          'Delete the role, or move it under a different **Reports to** if the work simply moved.',
          'If anything still reported to it, point those at their new role — until you do, they gather in an "Other roles" column on the chart so nothing disappears quietly.',
          'Delete the matching **Who’s who this year** card too, if the job is gone for good.',
        ],
      },
      {
        kind: 'callout',
        tone: 'primary',
        title: 'Class reps stay automatic.',
        text: 'There is ONE "Class Rep" role, ticked **One of these for every class**. The chart draws a rep card for every class by itself, so adding a class needs no new role. Leave that tick alone.',
      },
      { kind: 'h', text: 'Rename the headings' },
      {
        kind: 'p',
        text: 'The five headings on the Co-op Jobs page ("Executive Board", "Cabinet Chairs", and so on) live in **How the co-op works → Job-list headings**. Change the wording there if your school calls them something else. The five GROUPS themselves are fixed: they are the shapes the chart knows how to draw.',
      },
      {
        kind: 'seealso',
        items: ['Update who holds each co-op job', 'Add or change a class'],
      },
    ],
  },
  {
    slug: 'whos-who',
    category: 'School info & money',
    title: 'Update who holds each co-op job',
    icon: '🪪',
    lead: 'The org chart on the Co-op Jobs page, and the class rep on each class page. This is the once-a-year job after elections.',
    diy: 'self',
    body: [
      {
        kind: 'callout',
        tone: 'positive',
        title: 'This used to need a developer. It does not any more.',
        text: 'Every name on the org chart is now yours to change. Edit it here and the Family Hub updates by itself within a minute or two — nobody has to publish any code.',
      },
      {
        kind: 'path',
        items: ['Family Hub', 'Who’s who this year', 'pick the role', 'edit', 'Publish'],
        link: { pane: 'roleHolder', ws: 'family-hub' },
      },
      {
        kind: 'steps',
        items: [
          'Open **Family Hub → Who’s who this year**. There is one card per seat on the chart.',
          'Click the role that changed and type the new person’s name in **Who holds it**.',
          'For a class rep, also pick **Which class** she looks after. There is ONE "Class Rep" role covering every class, so a class you add later needs no new role.',
          'Nobody has taken the job yet? Leave the name **empty**. The chart shows it as an open role, which is exactly how someone notices it needs filling.',
          '`Publish`. Give it a minute, then reload the Family Hub to see it.',
        ],
      },
      {
        kind: 'h',
        text: 'Class reps: link the family instead of typing an email',
      },
      {
        kind: 'p',
        text: 'A class rep has no school email address, so her card uses her own. Rather than typing it here (where it would go stale the moment she updates the Directory), open her role and set **Their family in the Directory**. Her **Say hi** and **Call or text** links then come straight from her Directory entry, so her details are only ever kept in one place.',
      },
      {
        kind: 'callout',
        tone: 'primary',
        title: 'A family who opted out of the Directory stays private.',
        text: 'If she chose not to be listed, her name still appears on the chart but her contact links do not. That is deliberate — taking on a co-op job does not undo her privacy choice.',
      },
      {
        kind: 'p',
        text: 'For a role that DOES have its own school mailbox — President, Treasurer, and so on — use the **Role email address** field instead. That address belongs to the job rather than the person, so it keeps working when the job changes hands.',
      },
      {
        kind: 'callout',
        tone: 'positive',
        title: 'The roles are yours too.',
        text: 'You pick a role from the list rather than typing one, because the chart has to know where to put it — but the LIST itself is now yours. Rename a role, add one, or retire one under **Co-op roles & org chart**. See "Change the co-op roles or the org chart".',
      },
      {
        kind: 'p',
        text: 'A **photo** is optional on every one of these. Without one the card shows their initials, which looks perfectly fine — never hold up the update chasing headshots.',
      },
      {
        kind: 'seealso',
        items: [
          'Change the co-op roles or the org chart',
          'Edit a Family Hub page',
          'Add or edit a teacher',
        ],
      },
    ],
  },

  {
    slug: 'edit-testimonial',
    category: 'Photos & community',
    title: 'Add a parent quote',
    icon: '💬',
    lead: 'Collect a nice thing a family said and show it on the site.',
    diy: 'self',
    body: [
      {
        kind: 'path',
        items: ['Public website workspace', 'Testimonials', '＋ new', 'edit', 'Publish'],
        link: { pane: 'orderable-testimonial', ws: 'public' },
      },
      {
        kind: 'steps',
        items: [
          'In the **Public website** workspace (where the Studio opens), click **Testimonials** under School info, then `＋`.',
          'Paste the quote, and add who said it (first name and last initial is fine).',
          'Add their **connection** (for example "Twos parent") and pick a **tag** so it shows on the right pages.',
          'Add a **Family photo** if you have one (and their OK): it shows as a small photo print clipped to the quote on the reviews wall. Square crops look best. Optional — quotes without one look fine.',
          'Turn on **Feature this one?** if you want it on the homepage.',
          '`Publish`.',
        ],
      },
      {
        kind: 'callout',
        tone: 'primary',
        title: 'Get permission first.',
        text: 'Before quoting a family by name on the public site, make sure they are comfortable with it.',
      },
      {
        kind: 'callout',
        tone: 'positive',
        title: 'Drag to reorder',
        text: 'In the Testimonials list, grab the handle on the left of a quote and drag it up or down. The order you set is the order the site shows. The same drag-to-reorder works for Classes, School-Year Events, FAQs, and the Family Hub’s Documents & Forms.',
      },
      { kind: 'h', text: 'Let families submit their own reviews' },
      {
        kind: 'p',
        text: 'Add a **Leave a review form** section to a page (for example a "Share your story" page). Families fill it in, and their review lands in **Review submissions** (in your Inboxes) instead of going straight onto the site.',
      },
      {
        kind: 'steps',
        items: [
          'Open **Review submissions** in the left menu and read a new one.',
          'If it’s a good fit, click `Approve into Testimonials` at the bottom right. It becomes a real testimonial you can then feature or reorder.',
          'Nothing a family submits appears on the site until you approve it.',
        ],
      },
    ],
  },

  {
    slug: 'edit-faq',
    category: 'Photos & community',
    title: 'Add or edit an FAQ',
    icon: '❓',
    lead: 'Answer a common question once and it appears on the FAQ page.',
    diy: 'self',
    body: [
      {
        kind: 'path',
        items: ['Public website workspace', 'FAQs', 'pick one (or ＋ new)', 'edit', 'Publish'],
        link: { pane: 'orderable-faqItem', ws: 'public' },
      },
      {
        kind: 'steps',
        items: [
          'In the **Public website** workspace (where the Studio opens), click **FAQs** under School info.',
          'Open one to edit, or `＋` to add a new question.',
          'Write the question and answer, and choose a **Category** so it lands in the right group.',
          'To move important ones higher, grab the handle on the left of the list and **drag** — the FAQ page groups by category, so dragging changes the order within each category.',
          '`Publish`.',
        ],
      },
    ],
  },

  {
    slug: 'edit-contact',
    category: 'Website pages & menus',
    title: 'Change the phone, email, or address',
    icon: '⚙️',
    lead: 'The school’s basic facts live in one place and appear all over the site.',
    diy: 'self',
    body: [
      {
        kind: 'callout',
        tone: 'positive',
        title: 'Change it once.',
        text: 'The phone number, email, and address show up in the header, the footer, the Visit Us page, and various buttons. They all read from **Site Settings**, so you update them in one spot.',
      },
      {
        kind: 'path',
        items: [
          'Public website workspace',
          'Site Settings',
          'Contact / Location tab',
          'edit',
          'Publish',
        ],
        link: { doc: 'siteSettings' },
      },
      {
        kind: 'p',
        text: 'Site Settings lives under **Site setup** in the **Public website** workspace. If you are in the Family Hub workspace, switch with the name in the top-left corner.',
      },
      {
        kind: 'p',
        text: 'Site Settings is also where you set the **current school year** label (for example "2026-27") and turn the "Now Enrolling" note on or off.',
      },
      {
        kind: 'p',
        text: 'The **Seasonal touches** option (Identity tab) adds small hand-drawn decorations to the public site footer — leaves in fall, snowflakes in winter, flowers in spring, sunshine in summer. "Automatic" follows the calendar on its own; pick a season to hold it, or Off to hide them.',
      },
      { kind: 'h', text: 'Hide a detail in the header or footer' },
      {
        kind: 'p',
        text: 'Three switches let you take a detail out of the bar at the top of the page and the footer, without deleting it. Leave them alone and everything shows, which is how the site has always looked.',
      },
      {
        kind: 'bullets',
        items: [
          '**Show the phone number in the header and footer** (Contact tab). Off hides the call links in the chrome. The number still shows on the Visit Us page.',
          '**Show the email link in the header and footer** (Contact tab). Off hides the email icon at the top and the email line in the footer.',
          '**Show the social icons in the header and footer** (Social & reviews tab). Off hides the Facebook and Instagram buttons. The links stay saved, so you can bring them back at any time.',
        ],
      },
      { kind: 'h', text: 'Use a different logo' },
      {
        kind: 'p',
        text: 'On the **Identity** tab there is an optional **Logo** picture. Upload one and it takes the place of the built-in WCP logo in the header, at the same size. Leave it empty to keep the built-in one. The same picture is used on the white bar and over the photo at the top of the page, so pick one that reads on both. A wide picture with a see-through background works best.',
      },
      {
        kind: 'callout',
        tone: 'primary',
        title: 'Check your work in Presentation.',
        text: 'Open any page in **Presentation** and the header and footer sit right there beside the fields. Publish, then look at the top and the bottom of the preview page to see the change.',
      },
      {
        kind: 'callout',
        tone: 'primary',
        title: 'Each year, update the school-year dates',
        text: 'On the **School year** tab, fill in the school year’s **start date**, **end date**, and **first day of school**. These power the enrollment packet’s key dates and the countdown and progress bar on the Family Hub home page, so they need a fresh update every year.',
      },
      {
        kind: 'p',
        text: 'The Family Hub’s own yearly numbers and live-data links moved to **Hub settings** in the **Family Hub workspace**:',
      },
      {
        kind: 'bullets',
        items: [
          'The Family Handbook PDF, the co-op hours goal, the family-count override, and the past fundraising totals.',
          'The **Hub welcome line** — the sentence under the big greeting on the hub home. Change it for the season ("Welcome back!", "Happy graduation week!"); empty means the standard line.',
          'The **Super Helper program** (its own tab): the program’s name, its pitch, the requirement cards, and the footnote. Written once, shown in two places — the big band on the hub home and the top of the Become a Super Helper page. A step can carry a link (the training site, the CPR class finder).',
          'The **Family Handbook cover image** — upload the new cover art with the yearly PDF and the hub-home card follows.',
          'The Google connections: the treasurer’s **Budget Google Sheet ID**, the **Calendar feed link**, and the **Google Calendar code**. These rarely change; update them only when the sheet or feed is replaced.',
          'When you link to another page of OUR site inside any text box, use **Page link** (not the raw-URL Link): pick the page from a list, and the link keeps working even if that page’s address changes later.',
          'Little **status chips** now appear on documents: an amber “Past its end date” on a spotlight still switched on, “Past event”, “Publishes …” on a scheduled draft, “Pinned” on updates. They are hints, not buttons.',
          'The **new-document menus** offer pre-filled starting points: a two-week Spotlight, a Meeting-minutes post, an Announcement post — half the boxes already sensible.',
          'You can leave **comments** on any document (the speech-bubble icon top-right of the editor) and assign **tasks** — handy for “can you check this wording?” between board members, without leaving the Studio.',
          'On the public site: the **Building note**, **Summer tour note**, and the **secular statement** live in Site settings; the tuition table’s **age-cutoff column label**, **billed months per year**, and the **deposit note** live in Tuition & Fees; each review card can carry its own **Stars**. The Septembers wall and the home heritage numbers now compute themselves from the founding year and the school-year dates.',
          'One quirk by design: every page’s big hero shows ONE button — the tour invitation — no matter how many buttons are stored on the hero. That is the site’s conversion doctrine, not a bug; your first stored non-tour button shows as the quieter second link.',
          'On the **Family Hub menu**: the **Phone tab bar** picks which three destinations sit on the phone’s bottom bar. On **First-visit tour**: “Steps to skip” trims the tour. On the **Merch store card**: the shipping-perk line, the treasurer-sheet row name for store sales, and the “selling since” label. On **Tuition & Fees**: every word on the two enrollment-fee cards. The weather-closure statement lives in **Site settings** and shows on the hub’s Calendar and Health pages too.',
        ],
      },
      {
        kind: 'p',
        text: '**Past fundraising totals** (Hub settings → Each year) is the list behind the "What we’ve raised together" band on the Family Hub Fundraising page. Each fall, add the school year that just ended with the treasurer’s final grand total (newest first).',
      },
      { kind: 'h', text: 'Live "Spots open / Waitlist" badges' },
      {
        kind: 'p',
        text: 'The class cards on the public site can show a live availability badge under each class. It reads from a small Google Sheet so the enrollment chair updates ONE cell and the site follows within minutes — no publishing needed.',
      },
      {
        kind: 'steps',
        items: [
          'Make a Google Sheet with a tab named **Availability**.',
          'Two columns: the class (**twos**, **threes**, **pre-k-am**, **pre-k-pm**) and its status (**open**, **few**, **waitlist**, or **full**). One row per class.',
          'Share it: **Anyone with the link can view**.',
          'Copy the ID from the sheet link (the long code between /d/ and /edit) into **Site Settings → Connected services → Class availability spreadsheet code**, then Publish.',
        ],
      },
      {
        kind: 'callout',
        tone: 'primary',
        title: 'A row you leave out just shows no badge.',
        text: 'Misspelled statuses are ignored on purpose — the badge hides rather than showing something wrong. To turn the badges off entirely, clear the Sheet ID from Site Settings.',
      },
    ],
  },

  {
    slug: 'photos',
    category: 'Photos & community',
    title: 'Photos and images',
    icon: '📷',
    lead: 'How to add or swap a picture, and the one field not to skip.',
    diy: 'self',
    body: [
      {
        kind: 'steps',
        items: [
          'Click any image box, then **Upload** and choose a photo from your computer.',
          'Drag the little circle to set the focus point, so the photo crops nicely on phones.',
          'Fill in **Alt text**: a short description of the photo for people using screen readers.',
        ],
      },
      {
        kind: 'callout',
        tone: 'primary',
        title: 'A quick word on alt text',
        text: '**Alt text** is a plain sentence describing the picture, like "A child painting at an easel". It helps visually impaired visitors and is good for search results. A few words is plenty.',
      },
      { kind: 'h', text: 'The Media library' },
      {
        kind: 'p',
        text: 'Click **Media** in the left menu to see every photo you have ever uploaded in one grid, like a photo album. You can search by name, add **tags** to group photos (for example "classroom" or "events"), fix a photo’s alt text, and see which pages use it. It is the easiest way to reuse a photo you have already uploaded instead of uploading it again.',
      },
      {
        kind: 'callout',
        tone: 'caution',
        title: 'Deleting from Media is forever',
        text:
          'Removing a photo from the Media library deletes it everywhere it is used. If a photo might still be on a page, leave it. When in doubt, ask ' +
          SITE.contactName +
          '.',
      },
    ],
  },

  {
    slug: 'community-content',
    category: 'Photos & community',
    title: 'Programs, board, downloads & more',
    icon: '🌟',
    lead: 'A few simple lists — programs, board, partners, downloads, jobs, photo albums — that appear on your pages as ready-made sections.',
    diy: 'self',
    body: [
      {
        kind: 'p',
        text: 'Under **Community & content** you will find a few small collections. Each one powers a matching **section** you can add to any page. You keep the list up to date here, and the page updates itself, so you never type the same thing in two places. This group lives under **School info** in the **Public website** workspace (where the Studio opens).',
      },
      {
        kind: 'bullets',
        items: [
          '**Programs** — enrichment, summer, or special offerings. Shows as a row of cards (the *Programs* section).',
          '**Board / leadership** — your officers, separate from teaching Staff. Shows as a people grid (the *Board* section).',
          '**Partners / sponsors** and **Accreditations** — logos. Show as a tidy logo row (the *Logo strip* section).',
          '**Fundraising campaigns** — one active campaign with a goal, shown as a progress bar (the *Fundraising progress* section). These moved to **Money & payments** in the everyday menu, since they are money.',
          '**Job postings** — open positions. Show as a list (the _Open positions_ section).',
          '**Downloads & resources** — a handbook, calendar, or form, as an uploaded file or a link (the *Downloads* section).',
          '**Photo albums** — a reusable set of photos you can show on any page (the *Photo album* section).',
        ],
      },
      {
        kind: 'steps',
        items: [
          'Add or edit items in the collection (for example **Programs**), then `Publish`.',
          'Open the **page** where you want them shown.',
          'Add the matching section (for example **Programs**) and `Publish` the page.',
          'The section fills itself from the list, and re-orders when you drag the list.',
        ],
      },
      {
        kind: 'callout',
        tone: 'positive',
        title: 'Empty sections hide themselves.',
        text: 'If a list has nothing in it yet, its section simply does not appear on the page, so you can add the section first and fill the list later with nothing looking broken in between. (The _Open positions_ section is the one exception: it shows a friendly "nothing open right now" message.)',
      },
      {
        kind: 'callout',
        tone: 'positive',
        title: 'Drag to reorder.',
        text: 'Programs, board members, partners, accreditations, job postings, and downloads all use the same drag handle you know from Classes and Testimonials: grab it on the left and drag to set the order the page shows.',
      },
      { kind: 'seealso', items: ['Build or edit a page', 'Photos and images'] },
    ],
  },

  {
    slug: 'redirects',
    category: 'Website pages & menus',
    title: 'Fix a broken old link',
    icon: '↪️',
    lead: 'Renaming a page keeps old links working. We forward the old address for you.',
    diy: 'self',
    body: [
      {
        kind: 'p',
        text: 'Every page has a web address (its slug). If you change it, anyone who bookmarked the old one, or found it on Google, would land on a "page not found". A **redirect** quietly forwards them to the right new page instead.',
      },
      {
        kind: 'callout',
        tone: 'positive',
        title: 'Renaming a page is safe. You do not have to do anything.',
        text: 'Change a published page’s **Web address (slug)** and press `Publish`, and we write the redirect for you. A message says "Old link kept working". The old address forwards to the new one from then on. The same happens for a News post.',
      },
      {
        kind: 'p',
        text: 'You only add one by hand for an address that never existed on this site: a link from our old Squarespace site, or a path from a printed flyer.',
      },
      {
        kind: 'path',
        items: ['Public website workspace', 'Site setup', 'Redirects', '＋ new', 'Publish'],
        link: { pane: 'redirect', ws: 'public' },
      },
      {
        kind: 'steps',
        items: [
          'In the **Public website** workspace (where the Studio opens), scroll to **Site setup**.',
          'Open **Redirects**, then `＋`.',
          'In **Old address**, type the path people still use, starting with a slash, e.g. "/co-op-life".',
          'In **Send them to**, type the new page path, e.g. "/community" (or a full https:// link).',
          'Leave **Permanent move?** on, then `Publish`. It works a minute or two after the site rebuilds.',
        ],
      },
      {
        kind: 'callout',
        tone: 'primary',
        title: 'Redirects is also the list of every forward.',
        text: 'Open **Site setup → Redirects** to see them all, written as "old address → new address". The ones we wrote for you carry a note saying which page moved and when.',
      },
      {
        kind: 'callout',
        tone: 'positive',
        title: 'You can also fix an old typo redirect here.',
        text: 'If a forward ever points at the wrong place, just add a redirect here for that old address — your entry wins over the built-in ones.',
      },
    ],
  },

  {
    slug: 'export-list',
    category: 'Yearly jobs & housekeeping',
    title: 'Download a list (subscribers, messages, directory)',
    icon: '📤',
    lead: 'Get your newsletter list, form messages, or the family directory out as a spreadsheet, any time.',
    diy: 'self',
    body: [
      {
        kind: 'p',
        text: 'Handy for moving to a new email tool, handing off to next year’s board, or just keeping your own copy. The file is a **CSV**, which opens in Excel or Google Sheets.',
      },
      {
        kind: 'path',
        items: ['Export (top nav, either workspace)', 'pick a list', 'Download CSV'],
        link: { tool: 'export' },
      },
      {
        kind: 'steps',
        items: [
          'Click **Export** in the top navigation. It is there in both workspaces.',
          'Choose Newsletter subscribers, Form submissions, or the Family directory.',
          'Click `Download CSV`. The file saves to your computer.',
        ],
      },
      {
        kind: 'callout',
        tone: 'caution',
        title: 'The directory file has private info.',
        text: 'The family directory export includes names and contact details. Keep the file somewhere safe and delete it when you’re done with it.',
      },
      { kind: 'seealso', items: ['Clear out old records'] },
    ],
  },

  {
    slug: 'cleanup',
    category: 'Yearly jobs & housekeeping',
    title: 'Clear out old records',
    icon: '🧹',
    lead: 'Old form messages and sign-up responses build up over the years. Clear the old ones in one go.',
    diy: 'self',
    body: [
      {
        kind: 'p',
        text: 'The **Clean up** tool removes old **Form messages** you have already handled, and old **sign-up / RSVP responses**, in one step instead of deleting them one at a time.',
      },
      {
        kind: 'callout',
        tone: 'caution',
        title: 'This is permanent, so it double-checks with you.',
        text: 'The tool never touches anything recent, it shows you the exact count first, and it asks you to type DELETE before anything is removed. If you want a copy first, use the Export tool.',
      },
      {
        kind: 'path',
        items: [
          'Family Hub workspace',
          'Clean up (top nav)',
          'pick what + how old',
          'Check',
          'confirm',
        ],
        link: { tool: 'cleanup', ws: 'family-hub' },
      },
      {
        kind: 'steps',
        items: [
          'Switch to the **Family Hub** workspace (the name in the top-left corner), then click **Clean up** in the top navigation.',
          'Choose what to clear (handled messages, or sign-up responses) and how old (6 months, 1 year, 2 years).',
          'Click **Check how many** to see the count.',
          'If you want a copy, open **Export** first. Then type **DELETE** and press the delete button.',
        ],
      },
      { kind: 'seealso', items: ['Download a list (subscribers, messages, directory)'] },
    ],
  },

  {
    slug: 'checkup',
    category: 'Yearly jobs & housekeeping',
    title: 'Run a site checkup',
    icon: '🩺',
    lead: 'A one-click "what needs attention?" report — a banner left on, old messages, stale pages, gaps in your classes.',
    diy: 'self',
    body: [
      {
        kind: 'p',
        text: 'The **Checkup** tool looks over the site and lists anything worth a look. It never changes anything, it just points you to what to fix.',
      },
      { kind: 'path', items: ['Checkup (top nav, either workspace)'], link: { tool: 'checkup' } },
      {
        kind: 'p',
        text: 'It flags things like: the Alert banner still on, announcements past their end date, form messages over a month old and unanswered, pages not touched in months, classes missing tuition or a teacher, and edits you saved but never published. It also shows a **Coming up** list of what is due or happening in the next two weeks (the enrollment deadline, events, and sign-up sheets closing). Handy at the start of each month.',
      },
      {
        kind: 'callout',
        tone: 'primary',
        title: 'Get it by email instead',
        text: 'Nathan can turn on a daily 7am email of this same list to the board, so nobody has to remember to open Checkup. Ask him if you would like it on.',
      },
      { kind: 'seealso', items: ['Start a new school year'] },
    ],
  },

  {
    slug: 'site-stats',
    category: 'Yearly jobs & housekeeping',
    title: 'See how many people visit',
    icon: '📈',
    lead: 'A simple traffic panel: the last 7 days, the last 28 days, and a bar for each day.',
    diy: 'self',
    body: [
      {
        kind: 'p',
        text: 'The **Site stats** tool shows how busy the website has been. It is read only. Nothing you do here changes the website.',
      },
      {
        kind: 'path',
        items: ['Site stats (top nav, Public website)'],
        // Public workspace only, so a reader in the Family Hub workspace gets
        // switched across rather than sent to a tool that is not there.
        link: { tool: 'stats', ws: 'public' },
      },
      { kind: 'h', text: 'What you see' },
      {
        kind: 'bullets',
        items: [
          '**Last 7 days** and **Last 28 days**: two big numbers.',
          'A **bar for each day**, oldest on the left, today on the right. Hover a bar to read its number.',
          'An **Errors** card, but only when there were errors. A few are normal.',
        ],
      },
      { kind: 'h', text: 'What the number really means' },
      {
        kind: 'callout',
        tone: 'caution',
        title: 'This is not a count of people.',
        text: 'The number counts **requests**, not visitors. One person reading one page makes many requests: the page itself, each photo, the fonts. So the number is much larger than the number of families. Use it to compare one week with another, and do not quote it as "visitors" in a board report.',
      },
      {
        kind: 'p',
        text: 'Days are counted in UTC time, so a day here starts in the late evening our time. That is fine for comparing weeks. It is not exact enough for "how many people came this morning".',
      },
      { kind: 'h', text: 'If it says to open the preview first' },
      {
        kind: 'steps',
        items: [
          'Open any page from the left menu.',
          'Click the `Presentation` tab, so the website shows beside the editor.',
          'Go back to `Site stats` and click `Try again`.',
        ],
      },
      {
        kind: 'p',
        text: 'You only do that once on each computer. It is how the website knows you are a board member and not a stranger.',
      },
      { kind: 'h', text: 'If it says it is not set up yet' },
      {
        kind: 'p',
        text: 'That is a one-time setup step on the website, not something you can fix from the Studio. Tell Nathan and he will turn it on.',
      },
      {
        kind: 'callout',
        tone: 'primary',
        title: 'Want more detail?',
        text: 'The full report lives in the Cloudflare dashboard, including which countries people come from. The `Open the Cloudflare dashboard` button takes you there. Ask Nathan for a login.',
      },
      { kind: 'seealso', items: ['Run a site checkup'] },
    ],
  },

  {
    slug: 'start-of-year',
    category: 'Yearly jobs & housekeeping',
    title: 'Start a new school year',
    icon: '🍂',
    lead: 'The once-a-year rollover checklist, in order, with a jump to each thing to change.',
    diy: 'self',
    body: [
      {
        kind: 'p',
        text: 'The **Start of year** tool is a guided checklist for rolling the site over to a new school year. It reads your current settings, marks what already looks set, and gives you a one-click jump to each thing to update. It never changes anything itself.',
      },
      {
        kind: 'path',
        items: ['Start of year (top nav, either workspace)'],
        link: { tool: 'setup' },
      },
      {
        kind: 'p',
        text: 'Work top to bottom. Each card opens the right editor; make your change and `Publish` as usual, then come back to the list.',
      },
      {
        kind: 'bullets',
        items: [
          '**Set the year**: the school-year label, the key dates (start, end, first day), and the enrollment status.',
          '**Money**: this year’s tuition and class prices.',
          '**Co-op hours goal**: how many volunteer hours each family gives this year.',
          '**Calendar**: this year’s open houses, breaks, and picture days.',
          '**Refresh for families**: the president’s welcome note, teacher notes, and the family directory.',
          '**Wrap up last year**: turn off old notices and record last year’s fundraising total.',
        ],
      },
      { kind: 'seealso', items: ['Run a site checkup', 'Co-op hours tracking'] },
    ],
  },

  {
    slug: 'glossary',
    category: 'Start here',
    title: 'Words you might not know',
    icon: '📖',
    lead: 'Plain definitions for the few technical words you will run into.',
    diy: 'self',
    body: [
      {
        kind: 'bullets',
        items: [
          '`Publish` — the button that makes your changes go live on the public website.',
          '**Draft** — your unpublished work. Only you see it until you publish.',
          '**Hero** — the big banner at the very top of a page, with the headline and main photo or video.',
          '**Section** — one band of a page, like a row of cards, a photo gallery, or a quote. Pages are built by stacking sections.',
          '**Slug** — the last part of a web address. For the Twos class it is "twos". Click `Generate` and it fills itself in.',
          '**Reference** — a link from one thing to another. A class points at its teacher, so you set a fact once and reuse it.',
          '**Alt text** — a short description of a photo, for screen readers.',
          '**Singleton** — a one-of-a-kind page, like **Site Settings**. There is only ever one, on purpose.',
          '**Field** — one box you type into, like "Phone number".',
          '**Workspace** — a view of the Studio, one per audience. **Public website** (where you start) holds everything the world sees; **Family Hub** (the icon with the little lock) holds the private, families-only content. Switch with the name in the top-left corner. Both edit the same website.',
          '**PayPal button** — the box that connects a Pay button to the school’s PayPal. Newer buttons are a full payment link (Copy link in PayPal, starts with paypal.com/ncp/payment/); older ones were a short code of letters and numbers, which still works. Never a price.',
        ],
      },
      {
        kind: 'callout',
        tone: 'primary',
        title: 'Empty boxes are okay',
        text: 'Many boxes can be left blank on purpose. When a box is empty, the website shows its built-in wording instead. Leaving it blank is perfectly safe.',
      },
    ],
  },

  {
    slug: 'edit-directory',
    category: 'Family Hub',
    title: 'Add or edit a family in the directory',
    icon: '👪',
    lead: 'The family directory is private to signed-in families. Add a new family, or update anyone’s details, in a few clicks.',
    diy: 'self',
    body: [
      {
        kind: 'callout',
        tone: 'caution',
        title: 'This is private family information.',
        text: 'The directory holds real names, photos, addresses, and phone numbers. It only ever shows to signed-in families, never on the public website, so please treat it with care.',
      },
      {
        kind: 'path',
        items: ['Family Hub', 'Directory', 'pick a family (or ＋ new)'],
        link: { pane: 'directoryEntry', ws: 'family-hub' },
      },
      { kind: 'h', text: 'What you can fill in' },
      {
        kind: 'bullets',
        items: [
          '**Family name**: the surname only, like "Nixon". The page shows it as "The Nixon Family" and sorts the whole list by it.',
          '**Parents & other adults**: one entry per adult, each with a role (Parent, Grandparent, and so on) and their own email and phone.',
          '**Children**: each child’s name and which class they are in.',
          '**Family photo**, **home address**, and **notes**: all optional.',
          '**Neighborhood**, **Open to carpooling**, **Open to playdates**: optional. When set, the family shows friendly tags so nearby families can connect.',
          '**Show in directory**: the toggle that makes a family appear. Leave it off to keep a family hidden.',
        ],
      },
      { kind: 'h', text: 'Add a new family' },
      {
        kind: 'steps',
        items: [
          'Open **Directory** and click the `＋` (new) button.',
          'Type the surname in **Family name**, then add the parents, the children, and any photo or notes.',
          'If you add a **home address**, save it, then ask ' +
            SITE.contactName +
            ' to run the map step so the pin appears. Families without an address simply do not show on the map, which is fine.',
          'Turn on **Show in directory**, then `Publish`.',
        ],
      },
      { kind: 'h', text: 'When a family leaves the school' },
      {
        kind: 'steps',
        items: [
          'Open the family in **Directory**.',
          'If they might come back, or you are not sure, just turn **Show in directory** off and `Publish`. They disappear from the list straight away and nothing is lost.',
          'If they have left for good, delete the family instead, so their contact details do not sit in the system: open the `⋮` menu at the bottom of the family page and choose **Delete**.',
        ],
      },
      {
        kind: 'callout',
        tone: 'caution',
        title: 'Deleting cannot be undone.',
        text:
          'A deleted family cannot be brought back from the Studio. If several families are leaving at once, ask ' +
          SITE.contactName +
          ' — there is a script that removes them together and checks each one with you first.',
      },
      { kind: 'seealso', items: ['Do it yourself vs. ask for help', 'Post a celebration'] },
    ],
  },

  {
    slug: 'spotlight-popups',
    category: 'Family Hub',
    title: 'Put a spotlight in front of families',
    icon: '🔦',
    lead: 'A pop-up that greets families on any Family Hub page, for the one thing you want them to notice.',
    diy: 'self',
    body: [
      {
        kind: 'p',
        text: 'A **spotlight** is a pop-up in the same style as the President’s note, but you can have as many as the year needs: the supply lists in August, the auction in March, a store offer in December. It greets a family on **whatever hub page they open**, not only the hub home, and each family sees each one **once**.',
      },
      {
        kind: 'path',
        items: ['Family Hub', 'Spotlight pop-ups', '＋ new', 'turn on', 'Publish'],
        link: { pane: 'orderable-hubSpotlight', ws: 'family-hub' },
      },
      {
        kind: 'steps',
        items: [
          'Open **Spotlight pop-ups** in the left menu, under Everyday edits, then `＋`.',
          'Give it a **name** (just for you) and a **heading** families read first. Add a **short line**, and a **message** if you want more.',
          'The message uses the same editor as News and Updates: **bold**, italic, links, lists, pictures, and **attachments** families can download.',
          'Optional: add a **picture** across the top, a little **icon**, and pick one of the four **colours** for the pop-up edge.',
          'Optional: add ONE **button**. It can open a page that came with the site, a page you made, an update, an outside link, or the merch store.',
          'Under **When it shows**, flip **Turn it on**. Add **Start showing** / **Stop showing** dates if you want it to appear and stop on its own.',
          '`Publish`. Families see it on their next hub page, about a minute later.',
        ],
      },
      {
        kind: 'callout',
        tone: 'positive',
        title: 'Edited it after families saw it? Show it again.',
        text: 'Change the **version stamp** (e.g. from "v1" to "v2") and everyone sees that pop-up one more time. Turn **Turn it on** off to retire it.',
      },
      {
        kind: 'bullets',
        items: [
          '**Several at once:** turn on as many as you like. Families get ONE pop-up with **arrows** to page through them, in the order you drag them in the list. Drag the most important to the top.',
          '**One pop-up per visit:** on a family’s very first sign-in the President’s note and the tour come first, so the spotlight waits for their next page. Nobody ever gets two pop-ups stacked.',
          '**It is a nudge, not the only way in:** put the real content on a hub page or an update, and let the spotlight point at it.',
          '**Tidy up:** the **Checkup** tool lists any spotlight left switched on past its end date, and the **Start of year** tool reminds you each summer.',
        ],
      },
      {
        kind: 'callout',
        tone: 'caution',
        title: 'Use them sparingly.',
        text: 'A pop-up on every page is the fastest way to teach families to close it without reading. One at a time, for something that really matters.',
      },
      {
        kind: 'seealso',
        items: [
          'The first-visit tour',
          'Post an announcement bar or popup',
          'Edit a Family Hub page',
        ],
      },
    ],
  },

  {
    slug: 'celebrations',
    category: 'Family Hub',
    title: 'Post a celebration',
    icon: '🎉',
    lead: 'Birthdays, shout-outs, welcomes — little happy notes on the Family Hub.',
    diy: 'self',
    body: [
      {
        kind: 'p',
        text: 'The **Celebrations** page in the Family Hub is a warm spot for birthdays, thank-yous to volunteers, welcomes for new families, and milestones. Anything you post shows there, newest first.',
      },
      {
        kind: 'path',
        items: ['Family Hub', 'Celebrations', '＋ new', 'Publish'],
        link: { pane: 'celebration', ws: 'family-hub' },
      },
      {
        kind: 'steps',
        items: [
          'Open **Celebrations** in the left menu, then `＋`.',
          'Pick a **type** (Birthday, Shout-out, Welcome, Milestone), write a short happy **headline**, and add a line of detail if you like.',
          '`Publish`. It appears on the hub Celebrations page for families.',
          'Tidy up old ones now and then by deleting them.',
        ],
      },
    ],
  },

  {
    slug: 'family-photos',
    category: 'Family Hub',
    title: 'Review family photos',
    icon: '📷',
    lead: 'Families upload photos on the hub; you approve the ones that appear.',
    diy: 'self',
    body: [
      {
        kind: 'p',
        text: 'Families can share photos on the **Family Photos** page in the Family Hub. Each one waits for your approval before it shows to anyone. These are pictures of children, so they only ever appear inside the gated hub, never on the public website.',
      },
      {
        kind: 'path',
        items: ['Inboxes', 'Family photos (review)', 'pick a photo'],
        link: { pane: 'photoSubmission', ws: 'family-hub' },
      },
      {
        kind: 'steps',
        items: [
          'Open **Family photos (review)** — new ones show an hourglass (⏳).',
          'Click a photo to see it full size.',
          'If it’s good to share, turn on **Approved** and `Publish`. It then appears in the hub gallery for families.',
          'If you don’t want it, just **delete** it.',
        ],
      },
      {
        kind: 'callout',
        text: 'Uploads are limited to JPEG, PNG, or WebP images up to 8 MB, and the page is behind the family login — so only signed-in families can add a photo.',
      },
      { kind: 'seealso', items: ['Photos and images'] },
    ],
  },

  {
    slug: 'coop-hours',
    category: 'Family Hub',
    title: 'Co-op hours tracking',
    icon: '⏱️',
    lead: 'Set the yearly hours goal and confirm the hours families log.',
    diy: 'self',
    body: [
      {
        kind: 'p',
        text: 'As a co-op, each family gives volunteer hours every year. The **My Co-op Hours** page in the Family Hub lets families see their progress and log hours; you set the goal and confirm what they log.',
      },
      { kind: 'h', text: 'Set this year’s goal' },
      {
        kind: 'path',
        items: ['Family Hub workspace', 'Hub settings', 'Co-op hours per family'],
        link: { doc: 'hubSettings' },
      },
      {
        kind: 'p',
        text: 'Enter the number of hours each family is asked to give (for example 20). Leave it blank or 0 to hide the whole hours tracker. Update it once a year.',
      },
      { kind: 'h', text: 'Confirm hours a family logs' },
      {
        kind: 'p',
        text: 'When a family logs hours on the hub, a new row appears in **Family Hub → Co-op hours (ledger)** marked with an hourglass (⏳). It already counts toward their total, but is not yet confirmed.',
      },
      {
        kind: 'steps',
        items: [
          'Open **Co-op hours (ledger)** and click a ⏳ entry.',
          'Check it looks right, then turn on **Verified** and `Publish`. It shows a ✅ from then on.',
          'To credit hours yourself (for a family that did not log their own), click `＋`, fill in the family name, hours, and date, turn on **Verified**, and `Publish`.',
        ],
      },
      {
        kind: 'callout',
        text: 'Families are matched by the exact name they type, so gently keep names consistent (for example always "Nixon", not sometimes "The Nixons").',
      },
      { kind: 'seealso', items: ['Post a celebration', 'Do it yourself vs. ask for help'] },
    ],
  },

  {
    slug: 'diy-vs-ask',
    category: 'Start here',
    title: 'Do it yourself vs. ask for help',
    icon: '🧭',
    lead: 'The quick "am I allowed to touch this" cheat sheet.',
    diy: 'mixed',
    body: [
      { kind: 'h', text: 'Go ahead on your own' },
      {
        kind: 'bullets',
        items: [
          'Fixing a typo or rewriting a sentence.',
          'Adding or editing an FAQ, a testimonial, a teacher, or a photo.',
          'Editing a class’s schedule or description.',
          'Adding or editing a family in the directory.',
          'Posting a Family Hub announcement.',
          'Updating the phone, email, address, or Facebook and Instagram links in Site Settings.',
          'Updating a PayPal button link the treasurer gave you (then click the Pay button to check it opens the right amount).',
        ],
      },
      { kind: 'h', text: 'Check with the board / ' + SITE.contactName + ' first' },
      {
        kind: 'bullets',
        items: [
          'Changing tuition or fee amounts (the board sets these).',
          'Adding a brand-new class that needs its own pay button.',
          'Anything you are unsure about. Asking is always free.',
        ],
      },
      {
        kind: 'callout',
        tone: 'critical',
        title: 'The one hard rule: never click "Remove field".',
        text: 'Clearing the **text inside** a box is fine and undoable. But if you ever see an option to **Remove field** itself, do not click it. It erases that field on every document and is very hard to undo. Clear the box, do not remove the box.',
      },
      {
        kind: 'callout',
        tone: 'primary',
        title: 'Stuck? Just reach out.',
        text:
          'Email ' + SITE.contactName + ' at ' + SITE.contactEmail + '. No question is too small.',
      },
    ],
  },
];
