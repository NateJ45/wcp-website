// =============================================================================
// patch-add-summer-announcements.mjs — two Board/Admin `update` docs on the hub
// =============================================================================
// Adds two Announcement-category `update` documents to the Family Hub:
//   1. Lexie's (the Administrator) enrollment-paperwork + background-check
//      reminder email
//   2. The Board's full summer checklist email (paperwork, background checks,
//      tuition payments, the Family Hub, co-op job requests, calendar)
// Wording is preserved verbatim from the source emails; only Portable Text
// structure (headings/bold/lists/links) was added so the hub's blockContent
// renderer (src/lib/portable-text.ts) can present it cleanly. Idempotent
// (fixed ids — re-running replaces the same two docs). Queued behind the
// Sanity quota freeze, see docs/PENDING.md.
// Run: node scripts/patch-add-summer-announcements.mjs [--commit]
// =============================================================================
import { client, COMMIT, apply, done } from './patch-lib.mjs';
import { block, bullet, p, strong, link } from './pagebuilder-lib.mjs';

// blockContent only defines styles normal/h3("Heading")/h4("Subheading")/
// blockquote (see src/sanity/schemaTypes/blockContent.ts) — h2 is NOT valid
// here, unlike the page-builder's richProse. h3 renders as the top heading
// (portable-text.ts dense-ranks it to <h2> under the article's own <h1>).
const h3 = (text) => block(text, 'h3');
const h4 = (text) => block(text, 'h4');
// A numbered-list sibling to pagebuilder-lib's bullet() (blockContent allows
// both `bullet` and `number` listItem values; bullet() just hardcodes bullet).
const numbered = (...parts) => ({ ...bullet(...parts), listItem: 'number' });

const mailto = (address) => link(address, `mailto:${address}`);

// ─────────────────────────────────────────────────────────────────────────────
// 1) Lexie's enrollment paperwork / background check reminder
// ─────────────────────────────────────────────────────────────────────────────
const lexieBody = [
  p('Hello friends, old and new!'),
  p(
    "If we haven't met in person, my name is Lexie and I am the administrator for our lovely preschool. While I have held several different jobs within the school, the admin role is new to me, and I appreciate everyone's patience as I get settled in.",
  ),
  p(
    "I'm reaching out today with reminders on enrollment paperwork and background checks - exciting!",
  ),

  h3('Enrollment Paperwork - Due in 17 Days (August 1st)'),
  p('There are two parts to enrollment paperwork:'),

  h4('1) Docusign packet (required for everyone)'),
  p(
    'This contains the required state and school forms necessary for your child to start school. ',
    strong('Please fill out in its entirety'),
    " - this is especially important on the very first form, which is inspectable by the state and must have every field filled. If you have questions about anything in the packet, please let me know before you sign. If you can't find your Docusign packet, please let me know and I will resend it.",
  ),
  p(
    'Big thanks to those who have filled out their packets already, I am working through them and will reach out if corrections are needed.',
  ),

  h4('2) Medical forms (not in the Docusign packet)'),
  p(
    'These require input from medical providers; included in the email attachments below. Email to me (',
    mailto('admin@westchesterpreschool.org'),
    ') when complete.',
  ),
  bullet(
    strong('Child Medical Form'),
    ' - required for all new students. You should be able to have your provider fill this out using the most recent checkup information if your child is not currently due for a checkup. Returning Families: if your child is within 13 months of their last checkup, your form on file is still valid. I will be reaching out in the next week if you will need an updated form before school starts.',
  ),
  bullet(
    strong('Employee Medical Statement'),
    ' - required for all new volunteers and those who have not worked at the school in the last 6 months. If you have worked continuously at the school, you do not need to re-do this form.',
  ),
  bullet(
    strong('Medical Condition form'),
    ' - only required for children with documented allergies or medical conditions. This must be on file and staff trained before your child starts class.',
  ),

  h3('Background Checks and Fingerprinting - Due in 17 Days (August 1st)'),
  p(
    'Background checks and fingerprinting are required for anyone that volunteers in the classroom - you will not be able to complete this co-op commitment until your background check/fingerprinting is received.',
  ),
  p(
    'If you have not yet completed your background check request and fingerprinting, please refer to the attached "Becoming a WCP Employee_July Edit". The Ohio Department of Children and Youth (DCY) enacted changes on July 1st that affect what information is required in OCCRRA, and these changes are highlighted in this updated document. Please follow the steps in the document exactly, especially going back into OCCRRA to request a background check within 7 days of visiting the sheriff\'s station.',
  ),
  p(
    strong('Returning Families: '),
    'if I have contacted you about an expiring background check/fingerprinting, please reference the "WCP Returning Employee Background Check" document. Because our insurance requires background checks more frequently than the state requirement (every 2 years vs. every 5 years), we have to include an additional comment in the background request. Please note: if you are returning to the school after a break, you will almost certainly need to do a new background check for insurance purposes.',
  ),

  h3('Super Helper Update!'),
  p(
    'Super Helpers are volunteers with extra qualifications that allow them to be alone with children (in our program, this is mainly used to walk an individual child to the bathroom instead of the teacher dragging the whole class down the hall). The DCY changes on July 1st changed some of the required course names in OCCRRA, which are now reflected in the attached document.',
  ),

  p('🥳 Congrats! You made it to the bottom of the email! 🥳'),
  p(
    "I know that was a TON of information - please don't hesitate to reach out with questions or concerns. I hope to meet you at one of our playdates this summer!",
  ),
  p(strong('Warmly,')),
  p('Lexie Lenavitt'),
  p('West Chester Preschool Administrator'),
  p('803-800-7352'),
];

// ─────────────────────────────────────────────────────────────────────────────
// 2) The Board's summer checklist email
// ─────────────────────────────────────────────────────────────────────────────
const boardBody = [
  p(
    'Hello WCP Families! We hope that everyone is enjoying their summer so far – it has been wonderful to see new faces and old friends at our park playdates. While it may feel like the start of the school year is miles away, this email is going to outline some very important steps to work on over summer break – Enrollment paperwork, background checks, and tuition payments. It’s a hefty email - please don’t hesitate to reach out with your questions and concerns as you make your way through it!',
  ),
  p(strong('Warmly, your WCP Board')),

  h3('Enrollment Documents due by August 1st, 2026'),
  p(
    'This year, most enrollment documents will be completed online with Docusign. Please check your email for your Docusign envelope.',
  ),
  p('The following documents are NOT included in the Docusign envelope:'),
  bullet('Child Medical Form (Click here). Filled out by your child’s medical provider.'),
  bullet(
    'Employee Medical Statement (Click here). Filled out for each member of your family that will be volunteering in the classroom – only required for new volunteers.',
  ),
  bullet(
    'Child Medical Condition form (Click here). An additional form that must be filled out in entirety for any documented medical allergies or conditions. Please contact admin for further questions.',
  ),
  p(
    'Documents not included in the Docusign packet can be scanned and emailed to ',
    mailto('Admin@westchesterpreschool.org'),
    ', mailed to the school, or handed to a board member if we catch you at a playdate.',
  ),

  h3('Background Checks due by August 1st, 2026'),
  p(
    'This is one of the most important aspects of the enrollment process! Every volunteer must pass a background check and complete fingerprinting before they are able to work in the classroom.',
  ),
  p('All the information can be found:'),
  bullet('Becoming a WCP Employee'),
  bullet('Butler County WebCheck Fingerprint Information'),
  bullet('Warren County WebCheck Fingerprint Information'),
  p(
    'It is very important that you follow the steps in this document in their entirety – to include linking to your OCCRRA account within 7 days of fingerprinting. Skipping steps may result in having to re-do the fingerprinting and background check process, which is more money out of your pocket and more time before you are able to volunteer in the classroom.',
  ),
  p(
    strong('Returning families: '),
    'Our insurance requires that we complete background checks every 2 years. Check your email for a note from admin if you need to complete this step before the school year starts.',
  ),
  p(
    'Please contact ',
    mailto('admin@westchesterpreschool.org'),
    ' if you run into problems or need assistance!',
  ),

  h3('Tuition Payments due by August 1st, 2026'),
  p('The following payments are due by August 1st, 2026:'),
  bullet('Registration ($100)'),
  bullet('Participation Deposit ($100; waived for returning families in good standing)'),
  bullet('Student fee (varies by class)'),
  bullet('Tuition for September 2026 and May 2027 (varies by class)'),

  h4('What do I owe?'),
  p(
    'Most families paid first month’s tuition and participation deposit during May Gathering, and will owe last month’s tuition and student fee prior to August 1st. Please reach out to our treasurer, Kate, at ',
    mailto('treasurer@westchesterpreschool.org'),
    ' for a more detailed account overview.',
  ),

  h4('How do I pay? Three ways:'),
  numbered(
    'Online payments can be made online on our Family Hub - Tuition & Payments | WCP Family Hub — West Chester Preschool (Password: wcp!1969). There will be a small Paypal transaction fee applied to these payments (about 2%).',
  ),
  numbered(
    'Checks made out to “West Chester Preschool” (include child’s name in the memo). Checks can be mailed to “West Chester Preschool, 9463 Cincinnati Columbus Rd, West Chester, OH 45069” or handed to a board member in person.',
  ),
  numbered(
    'Cash is accepted, but we strongly encourage handing your payment directly to a board member or admin instead of sending by mail.',
  ),

  h4('What if I have a unique situation?'),
  p(
    'If you need to pay an amount that isn’t listed on the tuition section – reach out to Kate at ',
    mailto('treasurer@westchesterpreschool.org'),
    ' for a custom Paypal invoice.',
  ),

  h3('West Chester Preschool Family Hub – Bookmark this site!'),
  p(
    'All enrolled families have access to a password-protected online portal with a wealth of information about the school. Log-on to view detailed descriptions of each co-op job, our school handbook, additional copies of the required documents for enrolling, and more. Please note that the log-on information should only be shared with enrolled family members.',
  ),
  p(
    strong('NEW! '),
    'This year, online payments will also be made through this section of the website, so have the password handy the first time you log on.',
  ),
  p(
    link(
      'https://www.westchesterpreschool.org/families',
      'https://www.westchesterpreschool.org/families',
    ),
  ),
  p('Password: wcp!1969'),

  h3('Co-op Job Requests Open in July'),
  p(
    'The Board will send out a Sign-Up Genius link in the next few weeks requesting your family’s preference for a Co-op job. The description for each job can be found (Click here) or on our Family Hub. If you are a returning family that would like to keep the same job as last year, or have general questions about co-op jobs, please reach to ',
    mailto('contact@westchesterpreschool.org'),
    ' and ',
    mailto('vicepresident@westchesterpreschool.org'),
    ' prior to July 1st.',
  ),

  h3('Subscribe to our School Calendar'),
  p(
    'Subscribe to our school calendar so you never miss an important date! The calendar can be accessed on our Family Hub (School Calendar | WCP Family Hub — West Chester Preschool). A few dates to save:',
  ),
  bullet('September 3rd at 9:30am: School Orientation for all returning families'),
  bullet(
    'September 9th: Back-to-School picnics for Pre-K (AM and PM) and 3’s families at Keehner Park',
  ),
  bullet('September 10th: First day of school for Pre-K (AM) Class!'),
  bullet('September 10th: Back-to-School picnics for 2’s families at Keehner Park'),
  bullet('September 14th: First day of school for Pre-K (PM) and 3’s Classes!'),
  bullet('September 17th: First day of school for 2’s Class!'),
  p('More information to follow about these and other important events in September!'),
];

// ─────────────────────────────────────────────────────────────────────────────
const DOCS = [
  {
    _id: 'update-2026-lexie-paperwork-reminder',
    _type: 'update',
    title: 'Enrollment Paperwork & Background Check Reminders',
    excerpt: 'Reminders on enrollment paperwork and background checks - both due August 1st.',
    publishedAt: '2026-07-18T12:00:00.000Z',
    pinned: true,
    highlight: true,
    category: 'announcement',
    audience: 'all',
    body: lexieBody,
  },
  {
    _id: 'update-2026-summer-board-email',
    _type: 'update',
    title: 'Summer Checklist: Paperwork, Background Checks & Tuition (Due August 1st)',
    excerpt:
      'Enrollment paperwork, background checks, and tuition payments - all due August 1st, 2026 - plus the Family Hub, co-op job requests, and the school calendar.',
    publishedAt: '2026-07-18T12:00:01.000Z',
    pinned: true,
    highlight: true,
    category: 'announcement',
    audience: 'all',
    body: boardBody,
  },
];

for (const doc of DOCS) {
  await apply(`${doc._id} — "${doc.title}"`, () => client.createOrReplace(doc));
}
done(DOCS.length);
