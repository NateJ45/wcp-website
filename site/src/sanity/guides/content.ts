// =============================================================================
// Help & Guide content — plain-language walkthroughs for volunteers
// =============================================================================
// This is DATA, not code: each guide is a list of typed blocks. It lives in the
// repo (not editable in the Studio) so it can never be accidentally deleted, and
// so future volunteers always inherit it. Editing conventions:
//   - Use **double asterisks** for bold. No other formatting.
//   - Do NOT use em-dashes. Use commas or "and".
//   - Define any jargon in plain words.
//   - Keep site-specific values in SITE below.
// =============================================================================

export type DiyLevel = 'self' | 'ask' | 'mixed';

export type GuideBlock =
  | { kind: 'h'; text: string }
  | { kind: 'p'; text: string }
  | { kind: 'steps'; items: string[] }
  | { kind: 'bullets'; items: string[] }
  | { kind: 'path'; items: string[] }
  | {
      kind: 'callout';
      tone?: 'primary' | 'positive' | 'caution' | 'critical' | 'default';
      title?: string;
      text: string;
    }
  | { kind: 'seealso'; items: string[] };

export interface Guide {
  slug: string;
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
        text: 'While you type, you are editing a private **draft**. The public website does not change until you click **Publish**. So click around, try things, and only publish when it looks right.',
      },
      { kind: 'h', text: 'How a change goes live' },
      {
        kind: 'steps',
        items: [
          'Open the thing you want to change from the left menu.',
          'Edit the boxes. Your work saves automatically as a draft.',
          'When it looks right, click the green **Publish** button (bottom right).',
          'A few minutes later the website rebuilds itself and your change appears.',
        ],
      },
      {
        kind: 'callout',
        tone: 'primary',
        title: 'Give it a minute.',
        text: 'The website does not update the instant you publish. It rebuilds in the background, so wait a couple of minutes and then refresh the page you changed.',
      },
      { kind: 'h', text: 'The left menu, top to bottom' },
      {
        kind: 'bullets',
        items: [
          '**Site Settings** — the school’s phone, email, address, and the current school year. Set once, used everywhere.',
          '**Menus (header & footer)** — the links along the top of the site and in the footer.',
          '**Pages** — every public page, built from stacked sections you can add, reorder, and edit. This is where you build a brand-new page too.',
          '**Classes** — one card per class, with its schedule, ages, and tuition.',
          '**Staff** — your teachers. Their names and bios come from here.',
          '**Tuition & Fees** — registration and participation fees, and how payments work.',
          '**FAQs**, **Testimonials** — the FAQ page and parent quotes.',
          '**Family Hub** — the private, families-only content (announcements, documents, and more).',
        ],
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
      { kind: 'h', text: 'The easiest way to edit: click it on the page' },
      {
        kind: 'steps',
        items: [
          'Open **Pages**, then click the page you want. A live preview of the page opens on the right.',
          'Click any text or photo in the preview. The matching box opens on the left, ready to edit.',
          'Type your change. A moment after you pause, the preview refreshes on its own so you can see how it looks.',
          'When it looks right, click **Publish**.',
        ],
      },
      {
        kind: 'callout',
        tone: 'primary',
        title: 'This is the "click anything to edit" view.',
        text: 'The preview on the right is the real page. Clicking straight on the thing you want to change is usually faster than hunting through the boxes on the left.',
      },
      { kind: 'h', text: 'Add, remove, or reorder sections' },
      {
        kind: 'steps',
        items: [
          'Open a page and find the **Sections** list on the left.',
          'To add one, click **Add item** and pick a section type (for example "Cards", "FAQ", "Photo gallery"). Fill in its boxes.',
          'To move a section, drag it by the handle to a new spot in the list. Top of the list is top of the page.',
          'To remove one, use its **⋮** menu and choose Remove. (Removing a section is undoable before you publish.)',
          '**Publish** when you are happy.',
        ],
      },
      { kind: 'h', text: 'Make a brand-new page' },
      {
        kind: 'steps',
        items: [
          'Open **Pages**, then click **Pages (section builder)** and the **＋** (new) button.',
          'Give it a **Title**, then a **Slug** (the last part of the web address, like "summer-camp"). Use lowercase letters and dashes, no spaces.',
          'Fill in the hero, then add sections one at a time until the page is built.',
          'To put it in the top menu, open **Menus (header & footer)** and add a link to it (see "Edit the menus").',
          '**Publish**. A couple of minutes later the new page is live on the website.',
        ],
      },
      {
        kind: 'callout',
        tone: 'caution',
        title: 'The hero stays at the top.',
        text: 'Every page needs exactly one hero banner at the very top, so that part is fixed and cannot be removed or moved. Everything below it is yours to arrange.',
      },
      {
        kind: 'seealso',
        items: ['Edit the menus', 'Photos and images', 'Do it yourself vs. ask for help'],
      },
    ],
  },

  {
    slug: 'edit-menus',
    title: 'Edit the menus',
    icon: '🔗',
    lead: 'The links along the top of the site and down in the footer live in one place.',
    diy: 'self',
    body: [
      {
        kind: 'callout',
        tone: 'positive',
        title: 'One place for every menu.',
        text: 'The top navigation bar, the footer columns, and the small legal links at the very bottom all come from **Menus (header & footer)**. Change a link once here and it updates everywhere that menu shows.',
      },
      { kind: 'path', items: ['Menus (header & footer)', 'edit', 'Publish'] },
      { kind: 'h', text: 'Add a link to the top menu' },
      {
        kind: 'steps',
        items: [
          'Open **Menus (header & footer)**.',
          'In **Main navigation**, click **Add item**, then choose **Link**.',
          'Type the label people will see, then pick **Link to a page** and choose the page. (For an outside website, pick **Web address** and paste the link instead.)',
          '**Publish**.',
        ],
      },
      {
        kind: 'p',
        text: 'A **dropdown** (a menu item with links tucked under it) is the "Group" option instead of "Link". Give the group a label, then add the links inside it.',
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
    slug: 'schedule',
    title: 'Schedule a change for later',
    icon: '🗓️',
    lead: 'Write something now and have it go live on its own at a future date and time.',
    diy: 'self',
    body: [
      {
        kind: 'p',
        text: 'Handy for an announcement that should appear on a certain day, or a page you want to prepare ahead of time. Instead of clicking **Publish**, you tell the site when to publish it for you.',
      },
      {
        kind: 'steps',
        items: [
          'Make your edits as usual (they save as a draft).',
          'Next to the green **Publish** button, click the small arrow to open its menu and choose **Schedule**.',
          'Pick the date and time you want it to go live, and confirm.',
          'That is it. You can close the Studio. At that time it publishes on its own, and the website updates a couple of minutes later.',
        ],
      },
      {
        kind: 'callout',
        tone: 'primary',
        title: 'Changed your mind?',
        text: 'A scheduled item shows a little clock. Open it before its time and you can edit the schedule or cancel it and publish now instead.',
      },
      { kind: 'seealso', items: ['Undo a change or see history'] },
    ],
  },

  {
    slug: 'history',
    title: 'Undo a change or see history',
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
          'Click the **⋯** menu at the top right and choose **Review changes** (or the history/clock icon).',
          'Scroll the timeline on the right to see each past version and exactly what was edited.',
        ],
      },
      { kind: 'h', text: 'Put an old version back' },
      {
        kind: 'steps',
        items: [
          'In that history view, find the version you want.',
          'Use its menu to **Restore** it. That brings the old wording back as your current draft.',
          'Review it, then **Publish** to make it live again.',
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
    ],
  },

  {
    slug: 'edit-class',
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
      { kind: 'path', items: ['Classes', 'pick the class', 'edit', 'Publish'] },
      {
        kind: 'steps',
        items: [
          'Click **Classes** in the left menu.',
          'Click the class you want to change.',
          'Use the tabs at the top (Basics, Schedule & ages, Tuition & payment, Page details) to find the field.',
          'Change the boxes, then **Publish**.',
        ],
      },
      { kind: 'h', text: 'To add a brand-new class' },
      {
        kind: 'p',
        text: 'Maybe a summer class or a new session. You can add as many as you like.',
      },
      {
        kind: 'steps',
        items: [
          'Click **Classes**, then the **＋** (new) button at the top of the list.',
          'Fill in the name, then click **Generate** next to the URL slug.',
          'Fill in the schedule, ages, and tuition. Pick the teacher from the Staff list.',
          '**Publish**. The new class appears on the site automatically.',
        ],
      },
      {
        kind: 'callout',
        tone: 'caution',
        title: 'PayPal buttons',
        text:
          'The **PayPal button ID** fields connect the "Pay Tuition" buttons to real money. If you are adding a new class that needs its own pay button, check with ' +
          SITE.contactName +
          ' before filling those in.',
      },
      { kind: 'seealso', items: ['Change tuition or fees', 'Add or edit a teacher'] },
    ],
  },

  {
    slug: 'edit-tuition',
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
      { kind: 'path', items: ['Classes', 'pick the class', 'Tuition & payment tab'] },
      { kind: 'h', text: 'Registration, participation, and student fees' },
      {
        kind: 'p',
        text: 'The one-time fees and the "how payments work" answers live in **Tuition & Fees**.',
      },
      { kind: 'path', items: ['Tuition & Fees'] },
      {
        kind: 'callout',
        tone: 'caution',
        title: 'Prices are a big deal. Loop in ' + SITE.contactName + '.',
        text:
          'Because tuition is set by the board and tied to the budget, please confirm any price change with the board and ' +
          SITE.contactName +
          ' before you publish. Editing the number is easy; the point is to make sure it is the agreed number.',
      },
      { kind: 'seealso', items: ['Add or change a class'] },
    ],
  },

  {
    slug: 'edit-staff',
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
      { kind: 'path', items: ['Staff', 'pick the person (or ＋ new)', 'edit', 'Publish'] },
      {
        kind: 'steps',
        items: [
          'Click **Staff** in the left menu.',
          'Click a person to edit, or **＋** to add someone new.',
          'Fill in their name, title (Mrs.), role, and bio. Add a photo if you have one.',
          '**Publish**.',
        ],
      },
      {
        kind: 'p',
        text: 'To connect a teacher to a class, open the **class** and pick them in the **Teacher** field. That link is the only place you set it.',
      },
      { kind: 'seealso', items: ['Add or change a class', 'Photos and images'] },
    ],
  },

  {
    slug: 'edit-testimonial',
    title: 'Add a parent quote',
    icon: '💬',
    lead: 'Collect a nice thing a family said and show it on the site.',
    diy: 'self',
    body: [
      { kind: 'path', items: ['Testimonials', '＋ new', 'edit', 'Publish'] },
      {
        kind: 'steps',
        items: [
          'Click **Testimonials**, then **＋**.',
          'Paste the quote, and add who said it (first name and last initial is fine).',
          'Add their **connection** (for example "Twos parent") and pick a **tag** so it shows on the right pages.',
          'Turn on **Feature this one?** if you want it on the homepage.',
          '**Publish**.',
        ],
      },
      {
        kind: 'callout',
        tone: 'primary',
        title: 'Get permission first.',
        text: 'Before quoting a family by name on the public site, make sure they are comfortable with it.',
      },
    ],
  },

  {
    slug: 'edit-faq',
    title: 'Add or edit an FAQ',
    icon: '❓',
    lead: 'Answer a common question once and it appears on the FAQ page.',
    diy: 'self',
    body: [
      { kind: 'path', items: ['FAQs', 'pick one (or ＋ new)', 'edit', 'Publish'] },
      {
        kind: 'steps',
        items: [
          'Click **FAQs**.',
          'Open one to edit, or **＋** to add a new question.',
          'Write the question and answer, and choose a **Category** so it lands in the right group.',
          'Use **Sort order** to move important ones higher (lower numbers show first).',
          '**Publish**.',
        ],
      },
    ],
  },

  {
    slug: 'edit-contact',
    title: 'Change the phone, email, or address',
    icon: '⚙️',
    lead: 'The school’s basic facts live in one place and appear all over the site.',
    diy: 'self',
    body: [
      {
        kind: 'callout',
        tone: 'positive',
        title: 'Change it once.',
        text: 'The phone number, email, and address show up in the header, the footer, the contact page, and various buttons. They all read from **Site Settings**, so you update them in one spot.',
      },
      { kind: 'path', items: ['Site Settings', 'Contact / Location tab', 'edit', 'Publish'] },
      {
        kind: 'p',
        text: 'Site Settings is also where you set the **current school year** label (for example "2026-27") and turn the "Now Enrolling" note on or off.',
      },
    ],
  },

  {
    slug: 'photos',
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
    slug: 'glossary',
    title: 'Words you might not know',
    icon: '📖',
    lead: 'Plain definitions for the few technical words you will run into.',
    diy: 'self',
    body: [
      {
        kind: 'bullets',
        items: [
          '**Publish** — the button that makes your changes go live on the public website.',
          '**Draft** — your unpublished work. Only you see it until you publish.',
          '**Hero** — the big banner at the very top of a page, with the headline and main photo or video.',
          '**Section** — one band of a page, like a row of cards, a photo gallery, or a quote. Pages are built by stacking sections.',
          '**Slug** — the last part of a web address. For the Twos class it is "twos". Click **Generate** and it fills itself in.',
          '**Reference** — a link from one thing to another. A class points at its teacher, so you set a fact once and reuse it.',
          '**Alt text** — a short description of a photo, for screen readers.',
          '**Singleton** — a one-of-a-kind page, like **Site Settings**. There is only ever one, on purpose.',
          '**Field** — one box you type into, like "Phone number".',
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
    slug: 'diy-vs-ask',
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
          'Posting a Family Hub announcement.',
          'Updating the phone, email, or address in Site Settings.',
        ],
      },
      { kind: 'h', text: 'Check with the board / ' + SITE.contactName + ' first' },
      {
        kind: 'bullets',
        items: [
          'Changing tuition or fee amounts.',
          'Changing a PayPal button ID.',
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
