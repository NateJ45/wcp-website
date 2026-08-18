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
      { kind: 'h', text: 'The left menu, band by band' },
      {
        kind: 'p',
        text: 'The left menu is grouped by how often you need things, with a small heading over each band. The full set below is what the **Everything** workspace shows; **Everyday edits** keeps just the first band plus the Family Hub and the Inboxes.',
      },
      {
        kind: 'bullets',
        items: [
          '**Everyday edits** — the usual jobs. **Alert banner** (an urgent snow-day banner), **Announcements** (ready-made bars and popups you turn on/off, like a waitlist or open-house notice), **Money & payments** (tuition, fees, PayPal buttons, fundraising — every dollar in one place), **News** (your blog), **Events** (open houses and tours), and **Pages** (every public page, built from stacked sections — brand-new pages start here too).',
          '**School info** — the school facts: **Classes** (schedule, ages, tuition per class), **Staff** (teacher names and bios), **FAQs**, **Testimonials**, **School-Year Events**, and **Community & content** (programs, board, partners, photo albums).',
          '**Family Hub** — the private, families-only content (announcements, documents, sign-ups, the directory).',
          '**Site setup** — set-once things: **Site Settings** (phone, email, address, school year), **Menus (header & footer)**, and **Redirects** (forward old links when you rename a page).',
          '**Inboxes** — what the site sends YOU: **Form submissions** and **Newsletter subscribers**.',
          'And in the top bar: **Media** — every photo you have uploaded, in one searchable place.',
        ],
      },
      { kind: 'h', text: 'Two views of the same Studio' },
      {
        kind: 'p',
        text: 'The Studio opens in **Everyday edits** — a short menu with just the publish-something-now jobs: the alert banner, money, news, events, pages, the Family Hub, and your inboxes. Click the workspace name in the top-left corner to switch to **Everything**, which adds the occasional stuff: School info (classes, staff, FAQs, testimonials, the school-year timeline), Community & content, Site Settings, Menus, Redirects, and the Export tool. Both edit the same website; nothing is different except how much menu you see.',
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
          'To add one, click **Add item** and pick a section type (for example "Cards", "FAQ", "Photo gallery", "Story timeline", "Tabs"). Fill in its boxes.',
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
        kind: 'callout',
        tone: 'caution',
        title: 'The home page’s "Come find us" block is temporarily fixed.',
        text: 'On the home page, the block with our address, phone number, and when tours run is currently built into the site rather than editable here, so you will not find it in the Sections list. The address and phone number come from Site Settings, so update those there if they change. It will move back into the page builder later.',
      },
      {
        kind: 'seealso',
        items: ['Edit the menus', 'Photos and images', 'Do it yourself vs. ask for help'],
      },
    ],
  },

  {
    slug: 'edit-hub-page',
    title: 'Edit a Family Hub page',
    icon: '🔒',
    lead: 'The private, families-only pages (Calendar, Documents, Tuition, the classrooms, and the rest) are editable too, the same way public pages are.',
    diy: 'self',
    body: [
      { kind: 'h', text: 'Where they live' },
      { kind: 'path', items: ['Family Hub', 'Hub pages (edit content)'] },
      {
        kind: 'p',
        text: 'Each Family Hub page has its own entry here. Open one and you can change its **heading**, its **intro** line, and add a stack of **sections** below, exactly like a public page. Only signed-in families ever see these pages.',
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
        text: 'The **Teacher welcome notes** work exactly the same way, one per class — each pops up the first time a family visits that class’s hub page. Same rules: rewrite freely, bump the version stamp for a new year, toggle it off to retire it. The note’s **photo, name, role, email, and phone** do triple duty: they fill the "Your teacher" card at the top of the class page (a **Say hi** and a **Call or text** link), and they sign off the handbook’s closing section as a little signature card — the teacher’s headshot with **Email** and **Call or text** buttons. So keep them current in one place. Each class page also opens with a photo **"How our day flows"** story — swap its starter photos for real shots of your class right on the page’s Story timeline section.',
      },
      {
        kind: 'p',
        text: 'Every **class page** carries that teacher’s entire parent handbook as editable sections — daily schedules, drop-off and pick-up, the helper-day playbook, snack duty, and more (Pre-K shares one page for both AM and PM). When the teacher changes a routine, edit the matching section right here so the page stays the source of truth.',
      },
      {
        kind: 'p',
        text: 'Want families to be able to download the teacher’s **original handbook PDF** too? Open that class’s hub page and upload it to the **Handbook PDF** field. A "Download the handbook (PDF)" button then appears at the top of the class page. Leave it empty and no button shows.',
      },
      {
        kind: 'p',
        text: 'The **store card** at the bottom of the Family Hub home is set in **Site Settings → Social & store**: a headline, a blurb, the store link, and **Featured merch** (add a few items with a name, price, product link, and image URL to show them as clickable tiles). Clear the featured items to show just the banner.',
      },
      {
        kind: 'p',
        text: 'The **family directory map** (a Map tab that plots each family who shared a home address) is off by default. To turn it on, flip **Site Settings → Connected services → "Show the family directory map"**. With it off, the Directory shows just the List.',
      },
      {
        kind: 'p',
        text: 'When you post an **Update**, pick its **Category**: an *Announcement* shows in the hub home’s Announcements widget; *Meeting minutes* show in its Meeting Minutes widget instead. Both appear on the Updates page.',
      },
      {
        kind: 'callout',
        tone: 'positive',
        title: 'Updates can carry pictures and attachments now.',
        text: 'In the Body, press **＋** between paragraphs to drop in a **photo** (with a caption), a **photo gallery**, a **video** (YouTube or Vimeo — it loads only when a family taps play), or an **Attachment** (a PDF, a form, a flyer). An attachment shows as a tap-to-download card with the name you give it.',
      },
      {
        kind: 'p',
        text: 'For something every family must notice (a closure, a deadline), also turn on **Highlight in the bell menu** on that Update. It sits at the top of the hub’s bell menu with an "Important" tag until you turn it off — so do turn it off once it has run its course.',
      },
      { kind: 'h', text: 'Sign-up sheets and RSVPs' },
      {
        kind: 'p',
        text: 'The hub’s **Sign-ups** page replaces SignUpGenius. Create a sheet under **Family Hub → Sign-ups & RSVPs**: pick *Sign-up sheet* for named slots (helper shifts, snack days — give each slot a "how many needed" cap if you want one) or *Event RSVP* for a simple "we’ll be there" count. Families respond on the hub page; every response lands in **Sign-up responses** (and in the submissions Google Sheet + an email, once the forms inbox is set up).',
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
      },
      {
        kind: 'steps',
        items: [
          'Open **Family Hub → Hub pages** and click **＋** to make a new one.',
          'Give it a **Page name** so you can find it in the list later.',
          'Leave **Which hub page** EMPTY. That box is only for the pages that came with the site.',
          'In **Web address**, type lowercase words joined by hyphens, e.g. `playground-committee`. Your page will live at `/family-hub/playground-committee`.',
          'Add your content in **Content** — the same sections every other hub page uses.',
          '**Publish**. Give it a minute and open the address to see it.',
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
    title: 'Fun days & the daily giggle',
    icon: '🎉',
    lead: 'The "Today is National Kazoo Day" line and the joke at the foot of the hub home.',
    diy: 'self',
    body: [
      {
        kind: 'path',
        items: ['Family Hub', 'Little delights', 'add a row', 'Publish'],
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
      },
      {
        kind: 'steps',
        items: [
          'For a curriculum guide: pick the class document, edit the intro or any section’s objectives, and **Publish**.',
          'For the supply list: update the **School year**, the per-class items, or the wish list, and **Publish**.',
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
      },
      {
        kind: 'p',
        text: 'Open it after a Monday and read the summary. A red row names the broken link in plain English. To fix one: open that file in Google, share it again ("Anyone with the link"), copy the fresh link, and paste it where the site keeps it — the class page fields, Site Settings, or the Documents list.',
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
        items: ['switch to Everything (top-left)', 'Menus (header & footer)', 'edit', 'Publish'],
      },
      {
        kind: 'p',
        text: 'Menus live in the **Everything** workspace (they are easy to break, so they sit out of the everyday menu). Click the workspace name in the top-left corner and pick **Everything** first.',
      },
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
      { kind: 'seealso', items: ['Delete something (and get it back)'] },
    ],
  },

  {
    slug: 'trash',
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
          'Open the item and click the **⋯** menu at the top, then **Delete (move to trash)**.',
          'It disappears from its list and from the website, and a note tells you it went to Recently deleted.',
        ],
      },
      {
        kind: 'callout',
        tone: 'caution',
        title: '"Still in use"?',
        text: 'If other pages link to the thing you are deleting, it won’t let you (that would leave broken links). Open it, check the **Used on** tab to see what points to it, remove those links, then delete.',
      },
      { kind: 'h', text: 'Get it back, or clear it for good' },
      {
        kind: 'path',
        items: ['Recently deleted', 'pick an item', '⋯', 'Restore (or Delete forever)'],
      },
      {
        kind: 'steps',
        items: [
          'Open **Recently deleted** in the left menu (near the bottom).',
          'Click the item you want, then **Restore** to bring it back exactly as it was.',
          'To clear space, use **Delete forever** on an item you are sure about. That one can’t be undone.',
        ],
      },
      { kind: 'seealso', items: ['Undo a change or see history', 'Clear out old records'] },
    ],
  },

  {
    slug: 'write-post',
    title: 'Write a news post',
    icon: '📰',
    lead: 'Share an announcement, update, or story on the News page.',
    diy: 'self',
    body: [
      {
        kind: 'p',
        text: 'The **News** page is your blog. Posts show newest first, and the three most recent also appear on the homepage. Writing one is like writing a document.',
      },
      { kind: 'path', items: ['News', '＋ new', 'write', 'Publish'] },
      {
        kind: 'steps',
        items: [
          'Click **News** in the left menu, then the **＋** (new) button.',
          'Type a **Title**, then click **Generate** next to the slug to make its web address.',
          'Pick a **Category**, add a short **Summary** (this shows on the News list and when the post is shared), and a **Cover image** if you have one.',
          'Write the **Body**. Use the toolbar for headings, bold, links, bullet lists, and to drop in photos or an **Attachment** (a PDF or form families download with one tap).',
          'Add **Alt text** to any photo you place in the body.',
          '**Publish** when you are ready for it to go live (usually within a minute or two).',
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
    title: 'Put out a newsletter',
    icon: '🗞️',
    lead: 'Compose an issue, give it a web page, and (optionally) email it to families.',
    diy: 'self',
    body: [
      {
        kind: 'p',
        text: 'A **Newsletter issue** is written just like a News post, but it lives on its own newsletter pages: each published issue gets a web address at /newsletter/<its slug> and a card in the archive at /newsletter/archive. Families can read it on the web whether or not you email it.',
      },
      { kind: 'path', items: ['Newsletter issues', '＋ new', 'write', 'Publish'] },
      {
        kind: 'steps',
        items: [
          'Click **Newsletter issues** in the left menu, then **＋**.',
          'Type a **Title** (e.g. "October Newsletter") and click **Generate** for its web address.',
          'Add a short **Summary** (shown on the archive card and used as the email teaser), a **Cover image** if you have one, and write the **Body** with the toolbar.',
          '**Publish**. The issue is now live at its web address and in the archive.',
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
    title: 'Add an event',
    icon: '📅',
    lead: 'Put an open house, tour day, or community event on the public Events page.',
    diy: 'self',
    body: [
      {
        kind: 'p',
        text: 'The **Events** page shows what is coming up. An event drops off the page on its own once it has passed (and moves into a "Past events" list at the bottom), so the list stays current with no cleanup.',
      },
      { kind: 'path', items: ['Events', '＋ new', 'fill in', 'Publish'] },
      {
        kind: 'steps',
        items: [
          'Click **Events** in the left menu, then **＋**.',
          'Give it a title and pick the **Starts** date and time. Add an **Ends** time if it has one.',
          'Turn on **All-day** for something without a set time (like a closure).',
          'For a repeating event (a weekly class, a monthly meeting), set **Does it repeat?** and, if you like, a **Repeat until** date. The page shows the upcoming dates automatically.',
          'Choose a **Type**, and add a location, description, or a button link (like an RSVP form) if you want. For a place you use often, pick a **Saved location** instead of retyping the address (add these under Community & content → Locations / venues in the Everything workspace).',
          '**Publish**. Visitors get an "Add to calendar" button automatically.',
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
    ],
  },

  {
    slug: 'alert-banner',
    title: 'Post a closure or alert',
    icon: '🚨',
    lead: 'Show a banner at the top of every page — for a snow day, an early dismissal, or any urgent notice.',
    diy: 'self',
    body: [
      { kind: 'path', items: ['Alert banner', 'turn on + write message', 'Publish'] },
      {
        kind: 'steps',
        items: [
          'Click **Alert banner** near the top of the left menu.',
          'Turn on **Show this alert on the site?**',
          'Write the **Message** (for example "Closed today due to snow. Class resumes tomorrow.").',
          'Pick a **Style** — Info (blue), Warning (amber), or Urgent (red). Add a button link if useful.',
          '**Publish**. It shows on every page a minute or two later.',
        ],
      },
      {
        kind: 'callout',
        tone: 'critical',
        title: 'Remember to turn it off',
        text: 'When the closure is over, come back, turn **Show this alert** off, and Publish. Otherwise the banner stays up.',
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
    title: 'Post an announcement bar or popup',
    icon: '📢',
    lead: 'Ready-made bars and popups you turn on and off — waitlist status, open house, fundraiser, and more.',
    diy: 'self',
    body: [
      {
        kind: 'p',
        text: 'This is for planned, friendly messages on the public site. (The **Alert banner** is the separate, urgent snow-day one.) You can have several going at once, each turned on or off on its own, and set to appear and disappear on their own dates.',
      },
      { kind: 'path', items: ['Announcements', '＋ new', 'pick a type', 'turn on', 'Publish'] },
      {
        kind: 'steps',
        items: [
          'Click **Announcements** near the top of the left menu, then **＋**.',
          'Pick a ready-made type: **Open house bar**, **Enrollment / waitlist bar**, **Fundraiser bar**, **General notice**, **Welcome popup**, or **Event popup**. It fills in sensible wording and colors.',
          'Edit the message, color, and (optional) button. For a bar, it shows across the top of every page; a popup opens in the middle of the screen.',
          'Under **When it shows**, flip **Turn it on**. Optionally set **Start showing** / **Stop showing** dates so it appears and vanishes on its own.',
          '**Publish**. To take it down, come back and turn it off (or just let its end date pass).',
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
        items: ['Everything workspace', 'Classes', 'pick the class', 'edit', 'Publish'],
      },
      {
        kind: 'p',
        text: 'Classes live under **School info** in the **Everything** workspace (switch with the name in the top-left corner). Shortcut from Everyday edits: **Money & payments** → **Class tuition (open a class)** opens the very same class editor.',
      },
      {
        kind: 'steps',
        items: [
          'Click **Classes** in the left menu.',
          'Click the class you want to change.',
          'Use the tabs at the top (Basics, Schedule & ages, Tuition & payment, Page details) to find the field.',
          'Change the boxes, then **Publish**.',
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
        text: 'Maybe a summer class or a new session. You can add as many as you like.',
      },
      {
        kind: 'steps',
        items: [
          'Click **Classes**, then the **＋** (new) button at the top of the list.',
          'Fill in the name, then click **Generate** next to the web address (slug).',
          'Fill in the schedule, ages, and tuition. Pick the teacher from the Staff list.',
          '**Publish**. The new class appears on the site automatically.',
        ],
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
      {
        kind: 'path',
        items: ['Money & payments', 'Class tuition (open a class)', 'Tuition & payment tab'],
      },
      { kind: 'h', text: 'Registration and participation fees' },
      {
        kind: 'p',
        text: 'The one-time fees and the "how payments work" answers live in **Tuition & Fees**, inside **Money & payments** — the one folder that gathers every dollar amount on the site (fees, class tuition, the yearly budget, fundraising campaigns).',
      },
      { kind: 'path', items: ['Money & payments', 'Tuition & Fees'] },
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
        text: 'Each class’s tuition button is on the class (**Classes**, pick the class, **Tuition & payment** tab, "PayPal button"). The registration, participation, and student-fee buttons are in **Tuition & Fees**. For a button made in PayPal’s current system, open the button in PayPal, choose **Copy link**, and paste the whole link — it starts with paypal.com/ncp/payment/. (Buttons made in PayPal’s old system used a short code of letters and numbers instead; a code that is already in a box keeps working until that button is replaced.)',
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
      },
      {
        kind: 'steps',
        items: [
          'Open **Money & payments → Operating budget (yearly)**.',
          'Set the **Budget year** and the **Comparison year** the "last year" column refers to.',
          'Under **The budget**, each section is either money coming in or money going out. Open one and edit its lines.',
          'Each line has a name, **This year**, an optional **Last year**, and an optional note. Type plain numbers — 54810, not $54,810.',
          '**Publish**.',
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
          'Everything workspace',
          'Site Settings',
          'School year',
          'Enrollment mode',
          'Publish',
        ],
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
        items: ['Everything workspace', 'Staff', 'pick the person (or ＋ new)', 'edit', 'Publish'],
      },
      {
        kind: 'steps',
        items: [
          'Switch to the **Everything** workspace (the name in the top-left corner), then click **Staff**.',
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
    slug: 'whos-who',
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
      },
      {
        kind: 'steps',
        items: [
          'Open **Family Hub → Who’s who this year**. There is one card per seat on the chart.',
          'Click the role that changed and type the new person’s name in **Who holds it**.',
          'Nobody has taken the job yet? Leave the name **empty**. The chart shows it as an open role, which is exactly how someone notices it needs filling.',
          '**Publish**. Give it a minute, then reload the Family Hub to see it.',
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
        tone: 'primary',
        title: 'The roles are a fixed list.',
        text:
          'You pick a role from a dropdown rather than typing one, because the chart has to know where to put it. Need a seat that is not on the list, or one retired? That is a chart change — ask ' +
          SITE.contactName +
          '.',
      },
      {
        kind: 'p',
        text: 'A **photo** is optional on every one of these. Without one the card shows their initials, which looks perfectly fine — never hold up the update chasing headshots.',
      },
      {
        kind: 'seealso',
        items: ['Edit a Family Hub page', 'Add or edit a teacher', 'Photos and images'],
      },
    ],
  },

  {
    slug: 'edit-testimonial',
    title: 'Add a parent quote',
    icon: '💬',
    lead: 'Collect a nice thing a family said and show it on the site.',
    diy: 'self',
    body: [
      {
        kind: 'path',
        items: ['Everything workspace', 'Testimonials', '＋ new', 'edit', 'Publish'],
      },
      {
        kind: 'steps',
        items: [
          'Switch to the **Everything** workspace (the name in the top-left corner), click **Testimonials**, then **＋**.',
          'Paste the quote, and add who said it (first name and last initial is fine).',
          'Add their **connection** (for example "Twos parent") and pick a **tag** so it shows on the right pages.',
          'Skip **Family photo** for now. The field is here ready for later, but photos on quotes are still built into the site by hand, so one you add here will not show up on the website yet.',
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
          'If it’s a good fit, click **Approve into Testimonials** at the bottom right. It becomes a real testimonial you can then feature or reorder.',
          'Nothing a family submits appears on the site until you approve it.',
        ],
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
      {
        kind: 'path',
        items: ['Everything workspace', 'FAQs', 'pick one (or ＋ new)', 'edit', 'Publish'],
      },
      {
        kind: 'steps',
        items: [
          'Switch to the **Everything** workspace (the name in the top-left corner), then click **FAQs**.',
          'Open one to edit, or **＋** to add a new question.',
          'Write the question and answer, and choose a **Category** so it lands in the right group.',
          'To move important ones higher, grab the handle on the left of the list and **drag** — the FAQ page groups by category, so dragging changes the order within each category.',
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
        text: 'The phone number, email, and address show up in the header, the footer, the Visit Us page, and various buttons. They all read from **Site Settings**, so you update them in one spot.',
      },
      {
        kind: 'path',
        items: [
          'Everything workspace',
          'Site Settings',
          'Contact / Location tab',
          'edit',
          'Publish',
        ],
      },
      {
        kind: 'p',
        text: 'Site Settings lives in the **Everything** workspace — switch with the workspace name in the top-left corner.',
      },
      {
        kind: 'p',
        text: 'Site Settings is also where you set the **current school year** label (for example "2026-27") and turn the "Now Enrolling" note on or off.',
      },
      {
        kind: 'p',
        text: 'The **Seasonal touches** option (Identity tab) adds small hand-drawn decorations to the public site footer — leaves in fall, snowflakes in winter, flowers in spring, sunshine in summer. "Automatic" follows the calendar on its own; pick a season to hold it, or Off to hide them.',
      },
      {
        kind: 'callout',
        tone: 'primary',
        title: 'Each year, update the school-year dates',
        text: 'On the **School year** tab, fill in the school year’s **start date**, **end date**, and **first day of school**. These power the countdown and progress bar on the Family Hub home page, so they need a fresh update every year. Leave **Family count** blank unless the Directory undercounts (for example, mid-migration) — otherwise it uses a live count of families in the Directory automatically.',
      },
      {
        kind: 'p',
        text: 'The **School year** tab also holds the Family Hub’s live-data links: the **Budget Google Sheet ID** (the treasurer’s tracking sheet that powers the Budget Snapshot and Fundraising numbers) and the **Calendar feed link** (powers the Upcoming Events list). These rarely change — update them only when the sheet or feed is replaced.',
      },
      {
        kind: 'p',
        text: 'Same tab: **Past fundraising totals** — the list behind the "What we’ve raised together" band on the Family Hub Fundraising page. Each fall, add the school year that just ended with the treasurer’s final grand total (newest first).',
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
          'Copy the ID from the sheet link (the long code between /d/ and /edit) into **Site Settings → School year → Class availability Google Sheet ID**, then Publish.',
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
    title: 'Programs, board, downloads & more',
    icon: '🌟',
    lead: 'A few simple lists — programs, board, partners, downloads, jobs, photo albums — that appear on your pages as ready-made sections.',
    diy: 'self',
    body: [
      {
        kind: 'p',
        text: 'Under **Community & content** you will find a few small collections. Each one powers a matching **section** you can add to any page. You keep the list up to date here, and the page updates itself, so you never type the same thing in two places. This group lives in the **Everything** workspace — click the workspace name in the top-left corner and pick **Everything** to see it.',
      },
      {
        kind: 'bullets',
        items: [
          '**Programs** — enrichment, summer, or special offerings. Shows as a row of cards (the *Programs* section).',
          '**Board / leadership** — your officers, separate from teaching Staff. Shows as a people grid (the *Board* section).',
          '**Partners / sponsors** and **Accreditations** — logos. Show as a tidy logo row (the *Logo strip* section).',
          '**Fundraising campaigns** — one active campaign with a goal, shown as a progress bar (the *Fundraising progress* section). These moved to **Money & payments** in the everyday menu, since they are money.',
          '**Job postings** — open positions. Show as a list (the *Open positions* section).',
          '**Downloads & resources** — a handbook, calendar, or form, as an uploaded file or a link (the *Downloads* section).',
          '**Photo albums** — a reusable set of photos you can show on any page (the *Photo album* section).',
        ],
      },
      {
        kind: 'steps',
        items: [
          'Add or edit items in the collection (for example **Programs**), then **Publish**.',
          'Open the **page** where you want them shown.',
          'Add the matching section (for example **Programs**) and **Publish** the page.',
          'The section fills itself from the list, and re-orders when you drag the list.',
        ],
      },
      {
        kind: 'callout',
        tone: 'positive',
        title: 'Empty sections hide themselves.',
        text: 'If a list has nothing in it yet, its section simply does not appear on the page, so you can add the section first and fill the list later with nothing looking broken in between. (The *Open positions* section is the one exception: it shows a friendly "nothing open right now" message.)',
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
    title: 'Fix a broken old link',
    icon: '↪️',
    lead: 'Renamed or removed a page? Send its old link to the new place so nobody hits a dead end.',
    diy: 'self',
    body: [
      {
        kind: 'p',
        text: 'Every page has a web address (its slug). If you change it, anyone who bookmarked the old one, or found it on Google, would land on a "page not found". A **redirect** quietly forwards them to the right new page instead.',
      },
      {
        kind: 'callout',
        tone: 'primary',
        title: 'Better yet, avoid renaming.',
        text: 'The simplest fix is not to change an existing page’s web address in the first place. But when you must, add a redirect so no links break.',
      },
      {
        kind: 'path',
        items: ['Everything workspace', 'Site setup', 'Redirects', '＋ new', 'Publish'],
      },
      {
        kind: 'steps',
        items: [
          'Switch to the **Everything** workspace (the name in the top-left corner).',
          'Open **Redirects** under Site setup, then **＋**.',
          'In **Old address**, type the path people still use, starting with a slash, e.g. "/co-op-life".',
          'In **Send them to**, type the new page path, e.g. "/community" (or a full https:// link).',
          'Leave **Permanent move?** on, then **Publish**. It works a minute or two after the site rebuilds.',
        ],
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
        items: ['Everything workspace', 'Export (top nav)', 'pick a list', 'Download CSV'],
      },
      {
        kind: 'steps',
        items: [
          'Switch to the **Everything** workspace (the name in the top-left corner).',
          'Click **Export** in the top navigation.',
          'Choose Newsletter subscribers, Form submissions, or the Family directory.',
          'Click **Download CSV**. The file saves to your computer.',
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
          'Everything workspace',
          'Clean up (top nav)',
          'pick what + how old',
          'Check',
          'confirm',
        ],
      },
      {
        kind: 'steps',
        items: [
          'Switch to the **Everything** workspace (the name in the top-left corner), then click **Clean up**.',
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
    title: 'Run a site checkup',
    icon: '🩺',
    lead: 'A one-click "what needs attention?" report — a banner left on, old messages, stale pages, gaps in your classes.',
    diy: 'self',
    body: [
      {
        kind: 'p',
        text: 'The **Checkup** tool looks over the site and lists anything worth a look. It never changes anything, it just points you to what to fix.',
      },
      { kind: 'path', items: ['Everything workspace', 'Checkup (top nav)'] },
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
    slug: 'start-of-year',
    title: 'Start a new school year',
    icon: '🍂',
    lead: 'The once-a-year rollover checklist, in order, with a jump to each thing to change.',
    diy: 'self',
    body: [
      {
        kind: 'p',
        text: 'The **Start of year** tool is a guided checklist for rolling the site over to a new school year. It reads your current settings, marks what already looks set, and gives you a one-click jump to each thing to update. It never changes anything itself.',
      },
      { kind: 'path', items: ['Everything workspace', 'Start of year (top nav)'] },
      {
        kind: 'p',
        text: 'Work top to bottom. Each card opens the right editor; make your change and **Publish** as usual, then come back to the list.',
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
          '**Workspace** — a view of the Studio. **Everyday edits** (where you start) shows the usual menu; **Everything** adds the rare extras. Switch with the name in the top-left corner. Both edit the same website.',
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
      { kind: 'path', items: ['Family Hub', 'Directory', 'pick a family (or ＋ new)'] },
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
          'Open **Directory** and click the **＋** (new) button.',
          'Type the surname in **Family name**, then add the parents, the children, and any photo or notes.',
          'If you add a **home address**, save it, then ask ' +
            SITE.contactName +
            ' to run the map step so the pin appears. Families without an address simply do not show on the map, which is fine.',
          'Turn on **Show in directory**, then **Publish**.',
        ],
      },
      { kind: 'h', text: 'When a family leaves the school' },
      {
        kind: 'steps',
        items: [
          'Open the family in **Directory**.',
          'If they might come back, or you are not sure, just turn **Show in directory** off and **Publish**. They disappear from the list straight away and nothing is lost.',
          'If they have left for good, delete the family instead, so their contact details do not sit in the system: open the **⋮** menu at the bottom of the family page and choose **Delete**.',
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
    slug: 'celebrations',
    title: 'Post a celebration',
    icon: '🎉',
    lead: 'Birthdays, shout-outs, welcomes — little happy notes on the Family Hub.',
    diy: 'self',
    body: [
      {
        kind: 'p',
        text: 'The **Celebrations** page in the Family Hub is a warm spot for birthdays, thank-yous to volunteers, welcomes for new families, and milestones. Anything you post shows there, newest first.',
      },
      { kind: 'path', items: ['Family Hub', 'Celebrations', '＋ new', 'Publish'] },
      {
        kind: 'steps',
        items: [
          'Open **Celebrations** in the left menu, then **＋**.',
          'Pick a **type** (Birthday, Shout-out, Welcome, Milestone), write a short happy **headline**, and add a line of detail if you like.',
          '**Publish**. It appears on the hub Celebrations page for families.',
          'Tidy up old ones now and then by deleting them.',
        ],
      },
    ],
  },

  {
    slug: 'family-photos',
    title: 'Review family photos',
    icon: '📷',
    lead: 'Families upload photos on the hub; you approve the ones that appear.',
    diy: 'self',
    body: [
      {
        kind: 'p',
        text: 'Families can share photos on the **Family Photos** page in the Family Hub. Each one waits for your approval before it shows to anyone. These are pictures of children, so they only ever appear inside the gated hub, never on the public website.',
      },
      { kind: 'path', items: ['Inboxes', 'Family photos (review)', 'pick a photo'] },
      {
        kind: 'steps',
        items: [
          'Open **Family photos (review)** — new ones show an hourglass (⏳).',
          'Click a photo to see it full size.',
          'If it’s good to share, turn on **Approved** and **Publish**. It then appears in the hub gallery for families.',
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
        items: ['Site Settings', 'School year', 'Co-op hours per family'],
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
          'Check it looks right, then turn on **Verified** and **Publish**. It shows a ✅ from then on.',
          'To credit hours yourself (for a family that did not log their own), click **＋**, fill in the family name, hours, and date, turn on **Verified**, and **Publish**.',
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
