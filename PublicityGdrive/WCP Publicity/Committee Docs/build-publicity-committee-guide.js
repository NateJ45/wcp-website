/**
 * Builds the West Chester Preschool Publicity Committee Guide (2026-2027) as a
 * one-page .docx.
 *
 * Formatting mirrors the other WCP committee guides (Family Activities, etc.):
 *   - three-line centered title block at the top
 *   - bold + underlined section headings
 *   - short bulleted sections
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
const BODY_SIZE = 21; // half-points, so 21 = 10.5pt (keeps the guide to one page)

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
    spacing: { before: 190, after: 80 },
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
    spacing: { after: 40 },
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
//
// Scope note: this guide is deliberately narrow. Committee reps do one monthly
// ClassDojo photo pull plus optional sharing, capped at about an hour a month.
// Event photography, flyer distribution, and photo-permission checking sit with
// the chair and the board, not with reps.
// ---------------------------------------------------------------------------

const children = [
  // --- Title block ---------------------------------------------------------
  titleLine("West Chester Preschool"),
  titleLine("Publicity Committee Guide"),
  titleLine("2026-2027", { after: 160 }),

  // --- What the committee does --------------------------------------------
  heading("What the Publicity Committee Does"),
  body(
    "Publicity keeps West Chester Preschool visible, both to the families already here and to the families " +
      "still looking for a preschool. Committee reps are the eyes inside the classroom. Once a month you pass " +
      "along the best photos from your class so they can become posts. That is the job.",
  ),

  // --- The monthly routine -------------------------------------------------
  heading("Your Job, About One Hour a Month"),
  bullet([
    { text: "Pull classroom highlights, about 45 minutes. ", bold: true },
    {
      text:
        "Once a month, scroll through your classroom's ClassDojo feed, pick 3 to 5 photos that show kids " +
        "busy and happy, and drop them into the shared Publicity folder (link in the committee email). " +
        "That is the heart of the role.",
    },
  ]),
  bullet([
    { text: "Share a post when you can, about 15 minutes. ", bold: true },
    {
      text:
        "When WCP posts on Facebook or Instagram, share it to your own page or a local community group if it " +
        "fits. No quota, just when it is easy.",
    },
  ]),

  // --- Guardrails ----------------------------------------------------------
  heading("Good to Know"),
  bullet([
    { text: "Time: ", bold: true },
    {
      text:
        "this role is built for about one hour a month, roughly eight hours across the school year, and it " +
        "can be done from your phone.",
    },
  ]),
  bullet([
    { text: "Approval: ", bold: true },
    {
      text:
        "board leadership reviews content before it is published. Margot approves what goes on the school's " +
        "pages, so nothing reaches the public without a board member seeing it first.",
    },
  ]),
  bullet([
    { text: "Photos: ", bold: true },
    {
      text:
        "send them to the shared folder rather than posting them yourself. The chair and board check photo " +
        "permissions before anything is published, so it is not yours to track.",
    },
  ]),
  bullet([
    { text: "Experience: ", bold: true },
    {
      text:
        "none needed. No design skills, no social media know-how. If you can use ClassDojo, you can do this job.",
    },
  ]),

  // --- What the chair handles ---------------------------------------------
  heading("What the Chair Handles, So You Do Not Have To"),
  bullet([
    { text: "Posting and scheduling on Facebook and Instagram" },
  ]),
  bullet([
    { text: "The website, the calendar, and family announcements" },
  ]),
  bullet([
    { text: "Graphics, flyers, signs, and enrollment materials" },
  ]),
  bullet([
    {
      text:
        "Photos and video at school events, and filing the year's photos and graphics in the Publicity Google Drive",
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
    "Questions, or a month where you cannot get to it? Text Nathan. A heads up ahead of time is always fine.",
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
