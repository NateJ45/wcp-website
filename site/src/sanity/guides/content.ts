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
          '**Everyday edits** — the usual jobs. **Alert banner** (a snow-day banner across every page), **Money & payments** (tuition, fees, PayPal buttons, fundraising — every dollar in one place), **News** (your blog), **Events** (open houses and tours), and **Pages** (every public page, built from stacked sections — brand-new pages start here too).',
          '**School info** — the school facts: **Classes** (schedule, ages, tuition per class), **Staff** (teacher names and bios), **FAQs**, **Testimonials**, **School-Year Events**, and **Community & content** (programs, board, partners, photo albums).',
          '**Family Hub** — the private, families-only content (announcements, documents, sign-ups, the directory).',
          '**Site setup** — set-once things: **Site Settings** (phone, email, address, school year) and **Menus (header & footer)**.',
          '**Inboxes** — what the site sends YOU: **Form submissions** and **Newsletter subscribers**.',
          'And in the top bar: **Media** — every photo you have uploaded, in one searchable place.',
        ],
      },
      { kind: 'h', text: 'Two views of the same Studio' },
      {
        kind: 'p',
        text: 'The Studio opens in **Everyday edits** — a short menu with just the publish-something-now jobs: the alert banner, money, news, events, pages, the Family Hub, and your inboxes. Click the workspace name in the top-left corner to switch to **Everything**, which adds the occasional stuff: School info (classes, staff, FAQs, testimonials, the school-year timeline), Community & content, Site Settings, and Menus. Both edit the same website; nothing is different except how much menu you see.',
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
        text: 'The **Teacher welcome notes** work exactly the same way, one per class — each pops up the first time a family visits that class’s hub page. Same rules: rewrite freely, bump the version stamp for a new year, toggle it off to retire it. The note’s **photo, name, role, and email** also fill the "Your teacher" card at the top of that class page, so keeping them current does double duty. Each class page also opens with a photo **"How our day flows"** story — swap its starter photos for real shots of your class right on the page’s Story timeline section.',
      },
      {
        kind: 'p',
        text: 'The **Pre-K page** (one page for both AM and PM) carries the entire parent handbook as editable sections — daily schedules, drop-off and pick-up, the helper-day playbook, snack duty, and more. When the teacher changes a routine, edit the matching section right here so the page stays the source of truth.',
      },
      {
        kind: 'p',
        text: 'When you post an **Update**, pick its **Category**: an *Announcement* shows in the hub home’s Announcements widget; *Meeting minutes* show in its Meeting Minutes widget instead. Both appear on the Updates page.',
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
      {
        kind: 'callout',
        tone: 'caution',
        title: "Don't see a Schedule option?",
        text:
          'Scheduling is part of a paid Sanity plan. If the Publish button has no Schedule choice, the school is on the free plan, so just Publish when you want it live. Check with ' +
          SITE.contactName +
          ' if you need scheduling turned on.',
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
          'Write the **Body**. Use the toolbar for headings, bold, links, bullet lists, and to drop in photos.',
          'Add **Alt text** to any photo you place in the body.',
          '**Publish**. To post it on a future day instead, use **Schedule** (see "Schedule a change for later").',
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
      { kind: 'seealso', items: ['Schedule a change for later', 'Photos and images'] },
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
        text: 'The **Events** page shows what is coming up. An event drops off the page on its own once it has passed, so the list stays current with no cleanup.',
      },
      { kind: 'path', items: ['Events', '＋ new', 'fill in', 'Publish'] },
      {
        kind: 'steps',
        items: [
          'Click **Events** in the left menu, then **＋**.',
          'Give it a title and pick the **Starts** date and time. Add an **Ends** time if it has one.',
          'Turn on **All-day** for something without a set time (like a closure).',
          'Choose a **Type**, and add a location, description, or a button link (like an RSVP form) if you want.',
          '**Publish**. Visitors get an "Add to calendar" button automatically.',
        ],
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
        title: 'For a planned closure, schedule it',
        text: 'You can prepare the message ahead of time and use **Schedule** so it appears on its own the morning of (see "Schedule a change for later").',
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
          'The **PayPal button code** fields connect the "Pay Tuition" buttons to real money. If you are adding a new class that needs its own pay button, check with ' +
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
      { kind: 'h', text: 'Registration, participation, and student fees' },
      {
        kind: 'p',
        text: 'The one-time fees and the "how payments work" answers live in **Tuition & Fees**, inside **Money & payments** — the one folder that gathers every dollar amount on the site (fees, class tuition, fundraising campaigns).',
      },
      { kind: 'path', items: ['Money & payments', 'Tuition & Fees'] },
      { kind: 'h', text: 'The PayPal "Pay" buttons' },
      {
        kind: 'p',
        text: 'Each class’s tuition button is on the class (**Classes**, pick the class, **Tuition & payment** tab, "PayPal button code"). The registration, participation, and student-fee buttons are in **Tuition & Fees**. Paste only the button code, the short mix of letters and numbers from PayPal, and not a full web link.',
      },
      {
        kind: 'callout',
        tone: 'caution',
        title: 'Double-check a new PayPal button.',
        text: 'A wrong ID sends a family’s payment to the wrong place. After you change one, open the tuition page, click that Pay button, and confirm it shows the right amount in PayPal before you tell families.',
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
        text: 'The phone number, email, and address show up in the header, the footer, the contact page, and various buttons. They all read from **Site Settings**, so you update them in one spot.',
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
          '**PayPal button code** — the short mix of letters and numbers that connects a Pay button to the school’s PayPal. Not a price and not a web link.',
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
      { kind: 'seealso', items: ['Do it yourself vs. ask for help'] },
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
          'Updating a PayPal button code the treasurer gave you (then click the Pay button to check it opens the right amount).',
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
