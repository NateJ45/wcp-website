/**
 * Builds the West Chester Preschool Publicity Committee Guide (2026-2027) as a .docx.
 *
 * Formatting mirrors the other WCP committee guides (Family Activities, etc.):
 *   - three-line centered title block at the top
 *   - bold + underlined section headings
 *   - bulleted instructions with one level of sub-bullets
 *   - simple bordered tables for the chair and committee roster
 *
 * Section headings use WCP navy (#01457e) as the one brand touch; everything
 * else is plain black so it prints cleanly and uploads to Google Docs intact.
 *
 * Run: node build.js   (writes ./WCP-Publicity-Committee-Guide-2026-2027.docx)
 */

const fs = require("fs");
const {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
  AlignmentType,
  LevelFormat,
  ShadingType,
  BorderStyle,
} = require("docx");

// ---------------------------------------------------------------------------
// Shared constants
// ---------------------------------------------------------------------------

const NAVY = "01457E"; // WCP navy, used for section headings
const FONT = "Arial";
const BODY_SIZE = 21; // half-points, so 21 = 10.5pt (keeps the guide to two pages)

// US Letter, 1" margins on the sides, a little tighter top/bottom for page fit.
const PAGE = {
  size: { width: 12240, height: 15840 },
  margin: { top: 1080, bottom: 1080, left: 1080, right: 1080 },
};

// Table width = page width minus margins (12240 - 1080 - 1080).
const TABLE_WIDTH = 10080;

// ---------------------------------------------------------------------------
// Small builders: one function per repeated piece of the document
// ---------------------------------------------------------------------------

/** One centered line of the title block at the top of the page. */
function titleLine(text, opts = {}) {
  return new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: opts.after ?? 0 },
    children: [
      new TextRun({
        text,
        font: FONT,
        size: opts.size ?? 26, // 13pt
        bold: !!opts.bold,
        color: opts.color ?? "000000",
      }),
    ],
  });
}

/** Bold, underlined, navy section heading (matches the other committee guides). */
function heading(text) {
  return new Paragraph({
    spacing: { before: 260, after: 100 },
    children: [
      new TextRun({
        text,
        font: FONT,
        size: 24, // 12pt
        bold: true,
        underline: {},
        color: NAVY,
      }),
    ],
  });
}

/**
 * A body bullet. `runs` is an array of {text, bold} so a bullet can open with a
 * bold lead-in phrase and continue in regular weight.
 * `level` 0 is a top-level bullet, 1 is an indented sub-bullet.
 */
function bullet(runs, level = 0) {
  return new Paragraph({
    numbering: { reference: "wcp-bullets", level },
    spacing: { after: 60 },
    children: runs.map(
      (r) =>
        new TextRun({
          text: r.text,
          font: FONT,
          size: BODY_SIZE,
          bold: !!r.bold,
        }),
    ),
  });
}

/** A plain paragraph of body text (used for the short intro). */
function body(text, opts = {}) {
  return new Paragraph({
    spacing: { after: opts.after ?? 100 },
    children: [
      new TextRun({
        text,
        font: FONT,
        size: BODY_SIZE,
        italics: !!opts.italics,
      }),
    ],
  });
}

/** One table cell. Header cells get navy fill and white bold text. */
function cell(text, width, isHeader = false) {
  return new TableCell({
    width: { size: width, type: WidthType.DXA },
    shading: isHeader
      ? { type: ShadingType.CLEAR, color: "auto", fill: NAVY }
      : undefined,
    margins: { top: 60, bottom: 60, left: 110, right: 110 },
    children: [
      new Paragraph({
        spacing: { after: 0 },
        children: [
          new TextRun({
            text,
            font: FONT,
            size: BODY_SIZE,
            bold: isHeader,
            color: isHeader ? "FFFFFF" : "000000",
          }),
        ],
      }),
    ],
  });
}

/**
 * Builds a bordered table.
 * `widths` must sum to TABLE_WIDTH; `rows` is an array of string arrays,
 * with the first row treated as the header.
 */
function table(widths, rows) {
  const border = { style: BorderStyle.SINGLE, size: 4, color: "9AA5B1" };
  return new Table({
    width: { size: TABLE_WIDTH, type: WidthType.DXA },
    columnWidths: widths,
    borders: {
      top: border,
      bottom: border,
      left: border,
      right: border,
      insideHorizontal: border,
      insideVertical: border,
    },
    rows: rows.map(
      (cells, rowIndex) =>
        new TableRow({
          tableHeader: rowIndex === 0,
          children: cells.map((text, colIndex) =>
            cell(text, widths[colIndex], rowIndex === 0),
          ),
        }),
    ),
  });
}

/** Blank spacer paragraph, used after tables so sections do not collide. */
function spacer(size = 120) {
  return new Paragraph({ spacing: { after: size }, children: [] });
}

// ---------------------------------------------------------------------------
// Document content
// ---------------------------------------------------------------------------

const children = [
  // --- Title block ---------------------------------------------------------
  titleLine("West Chester Preschool"),
  titleLine("Publicity Committee Guide"),
  titleLine("2026-2027", { after: 160 }),

  // --- What the committee does --------------------------------------------
  heading("What the Publicity Committee Does"),
  body(
    "Publicity tells the WCP story, both to the families already here and to the families who have not " +
      "found us yet. That covers photos and video at school events, social media, the website, the family " +
      "newsletter, flyers and signs around West Chester, and anything else that carries the school name or " +
      "logo. Enrollment is the reason this committee exists. A full school is what keeps tuition low and the " +
      "co-op running, and most families find us through a photo, a post, or a friend sharing one.",
  ),

  // --- Committee instructions ---------------------------------------------
  heading("Publicity Committee Instructions"),
  bullet([
    { text: "The chair holds the accounts. ", bold: true },
    {
      text:
        "Only the chair posts to the WCP Facebook and Instagram pages, the website, and the family email " +
        "list, so the look and voice stay consistent and nothing private lands on the public web. " +
        "Everything below is committee work, and all of it matters.",
    },
  ]),
  bullet([
    { text: "Take photos at events you attend. ", bold: true },
    {
      text:
        "Phone photos are perfect. Send them to the chair within a day or two, while the event is still " +
        "news. Candid shots of kids busy and happy work better than posed lineups, and a few seconds of " +
        "video is gold for a reel.",
    },
  ]),
  bullet(
    [
      {
        text:
          "Check the photo permission list before you shoot. A few families have opted out of photos. " +
          "The chair keeps the current list and will share it at the start of the year. When in doubt, " +
          "send the photo to the chair rather than posting it anywhere yourself.",
      },
    ],
    1,
  ),
  bullet([
    { text: "Share every post. ", bold: true },
    {
      text:
        "Share WCP posts to your own page and into local parent groups: West Chester and Liberty Township " +
        "community pages, moms groups, Buy Nothing groups, your neighborhood page, your church. This is the " +
        "single highest-value thing a member can do, it costs nothing, and it is how most new families hear " +
        "about us.",
    },
  ]),
  bullet([
    { text: "Help with the enrollment push, January through March. ", bold: true },
    {
      text:
        "This is the busy stretch. Members hang flyers and drop postcards at libraries, pediatric and " +
        "dentist offices, coffee shops, gyms, churches, and community centers. The chair prints and " +
        "supplies the materials, so members just need to deliver them.",
    },
  ]),
  bullet([
    { text: "Cover an event when the chair cannot. ", bold: true },
    {
      text:
        "If the chair is not able to be at a school event, one member volunteers to be the camera for that " +
        "night. No experience needed, just a charged phone.",
    },
  ]),
  bullet([
    { text: "Bring ideas, and proofread. ", bold: true },
    {
      text:
        "Classroom milestones, a teacher doing something wonderful, an alumni family with good news, a " +
        "community event we should be at. Pass it along. If you spot a typo or a wrong date on a post or " +
        "flyer, text the chair right away.",
    },
  ]),

  // --- What the chair handles ---------------------------------------------
  heading("What the Chair Handles"),
  body(
    "Listed so members know what is already covered and can ask to help with any of it:",
    { after: 60 },
  ),
  bullet([
    {
      text:
        "Facebook and Instagram: the posting schedule, stories, reels, event promotion, and enrollment ads",
    },
  ]),
  bullet([
    {
      text: "The website: page edits, the calendar, announcements, and the family area",
    },
  ]),
  bullet([
    { text: "The family newsletter and email announcements" },
  ]),
  bullet([
    {
      text:
        "Graphics, flyers, signs, and banners, all built in the WCP brand colors, fonts, and logo",
    },
  ]),
  bullet([
    {
      text:
        "Board headshots, class boards, and keeping the year's photos and graphics filed in the Publicity Google Drive",
    },
  ]),
  bullet([
    {
      text:
        "Community outreach: open house promotion, yard signs, local parent groups, and community events",
    },
  ]),

  // --- Year at a glance ----------------------------------------------------
  heading("The Publicity Year at a Glance"),
  table(
    [2300, 7780],
    [
      ["When", "Publicity Focus"],
      [
        "Aug - Sept",
        "Welcome back posts, teacher introductions, first day photos, board headshots",
      ],
      [
        "Oct - Dec",
        "Fall VIP Night, classroom and holiday moments, fundraiser promotion",
      ],
      [
        "Jan - Mar",
        "Enrollment season: open house, registration dates, flyers and postcards out in the community, paid social ads. All hands on deck.",
      ],
      [
        "Apr - May",
        "Spring VIP Night, spring fundraiser, class photos, continued enrollment",
      ],
      [
        "May - June",
        "End of year picnic, graduation, thank-you posts, and handoff to next year's chair",
      ],
    ],
  ),
  spacer(),

  // --- Time commitment -----------------------------------------------------
  heading("Time Commitment"),
  bullet([
    {
      text:
        "A few hours a month for most of the year, and more during the January through March enrollment push.",
    },
  ]),
  bullet([
    {
      text:
        "Most of the work can be done from your phone, on your own schedule. If you cannot attend an event, you can still help by sharing posts, distributing flyers, or prepping materials.",
    },
  ]),

  // --- Reimbursement -------------------------------------------------------
  heading("Purchasing and Reimbursement"),
  bullet([
    {
      text:
        "Publicity has a budget for printing, signage, and social media ads. Check with the chair before spending, so we do not double up.",
    },
  ]),
  bullet([
    {
      text:
        "Keep your receipts and give them to the VP or Treasurer for reimbursement. A board member can also purchase items with the school credit card if that is easier.",
    },
  ]),

  // --- Rosters -------------------------------------------------------------
  heading("Publicity Committee Chair"),
  table(
    [3200, 1600, 2240, 3040],
    [
      ["Name", "Class", "Phone", "Email"],
      ["Nathan Nixon", "AM PreK", "256-318-6627", "nathanjnixon86@gmail.com"],
    ],
  ),
  spacer(),

  heading("Publicity Committee Members"),
  table(
    [3200, 1600, 2240, 3040],
    [
      ["Name", "Class", "Phone", "Email"],
      ["", "", "", ""],
      ["", "", "", ""],
      ["", "", "", ""],
      ["", "", "", ""],
    ],
  ),
  spacer(60),
  body(
    "Questions about anything in here, ask Nathan. Nothing on this list requires design or social media experience, just a phone and a willingness to talk up the school.",
    { italics: true },
  ),
];

// ---------------------------------------------------------------------------
// Assemble and write the file
// ---------------------------------------------------------------------------

const doc = new Document({
  // Bullet list definition. Never type a literal bullet character; Word needs
  // a real numbering config so the list behaves in Google Docs too.
  numbering: {
    config: [
      {
        reference: "wcp-bullets",
        levels: [
          {
            level: 0,
            format: LevelFormat.BULLET,
            text: "•",
            alignment: AlignmentType.LEFT,
            style: { paragraph: { indent: { left: 400, hanging: 220 } } },
          },
          {
            level: 1,
            format: LevelFormat.BULLET,
            text: "◦",
            alignment: AlignmentType.LEFT,
            style: { paragraph: { indent: { left: 800, hanging: 220 } } },
          },
        ],
      },
    ],
  },
  sections: [{ properties: { page: PAGE }, children }],
});

Packer.toBuffer(doc).then((buffer) => {
  fs.writeFileSync("WCP-Publicity-Committee-Guide-2026-2027.docx", buffer);
  console.log("wrote WCP-Publicity-Committee-Guide-2026-2027.docx");
});
