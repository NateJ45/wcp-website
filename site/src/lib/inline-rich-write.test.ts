// =============================================================================
// inline-rich-write — unit tests for the WRITE half of the rich twins
// =============================================================================
// The module under test is CANONICAL: ncs-astro-sanity-starter owns it and
// `sync-check` fails on any drift (PORTS.md cards 28 and 28b). These tests are
// NOT canonical, because the starter runs `node --test` and this repo runs
// vitest. They are this site's own reading of the same file, and they pin the
// promises that matter here, all of which fail silently:
//   1. NO TAG NAME SURVIVES. The output is built from plain strings and two
//      booleans, so a paste can never carry markup into the dataset.
//   2. LINE BREAKS SURVIVE. This site joins stored blocks with <br />, so a twin
//      an editor typed on two lines has two blocks. Collapsing them would delete
//      a line break the moment somebody opened the card. That is what the
//      `multiline` seam buys, and every call site here passes it.
//   3. A DOUBLE SPACE NEVER REACHES THE DATASET, mark boundary or not.
//   4. AN EMPTY BOX STORES NOTHING, so the plain string underneath renders
//      again, exactly as clearing the twin's box in the Studio form does.
// =============================================================================
import { describe, expect, it } from 'vitest';
import { emphasisHtml, RUN_BREAK, type InlineRun } from './emphasis';
import {
  escapeHtml,
  htmlToInlineRich,
  htmlToRuns,
  inlineRichToHtml,
  normalizeRuns,
  runsToHtml,
  runsToInlineRich,
  textToRuns,
} from './inline-rich-write';

/** This site keeps its lines. Every call site in the overlay passes this. */
const MULTI = { multiline: true } as const;

/** Predictable keys, so a whole block is comparable. */
const keys = () => {
  let n = 0;
  return () => `k${(n += 1)}`;
};

const run = (text: string, strong = false, em = false): InlineRun => ({ text, strong, em });

describe('htmlToRuns', () => {
  it('reads bold and italic under either tag name', () => {
    expect(htmlToRuns('a <b>bee</b> <i>see</i> <strong>dee</strong> <em>ee</em>', MULTI)).toEqual([
      run('a '),
      run('bee', true),
      run(' '),
      run('see', false, true),
      run(' '),
      run('dee', true),
      run(' '),
      run('ee', false, true),
    ]);
  });

  it('reads a span that carries its emphasis as an inline style', () => {
    expect(htmlToRuns('<span style="font-weight: 700">heavy</span>', MULTI)).toEqual([
      run('heavy', true),
    ]);
    expect(htmlToRuns("<span style='font-style:italic'>lean</span>", MULTI)).toEqual([
      run('lean', false, true),
    ]);
  });

  it('nests marks', () => {
    expect(htmlToRuns('<strong>bold <em>both</em></strong>', MULTI)).toEqual([
      run('bold ', true),
      run('both', true, true),
    ]);
  });

  it('keeps the text of an unknown tag and drops the tag', () => {
    expect(
      htmlToRuns('<table><tr><td><font color="red">red</font></td></tr></table>', MULTI),
    ).toEqual([run('red')]);
  });

  it('drops a script tag CONTENTS AND ALL', () => {
    // The script contributes NOTHING, not even a boundary, so what is left is
    // one run: no tag name, and no argument of a tag, can reach the dataset.
    expect(htmlToRuns('before<script>alert(1)</script>after', MULTI)).toEqual([run('beforeafter')]);
    expect(htmlToRuns('<style>p{color:red}</style>text', MULTI)).toEqual([run('text')]);
  });

  it('decodes the entities a contenteditable actually emits', () => {
    expect(htmlToRuns('a &amp; b &lt;c&gt; &#39;d&#39; &nbsp;e', MULTI)).toEqual([
      run("a & b <c> 'd' e"),
    ]);
  });

  it('treats a lone angle bracket as text, not a tag', () => {
    expect(htmlToRuns('5 < 6', MULTI)).toEqual([run('5 < 6')]);
  });

  it('turns a block boundary into ONE line break', () => {
    expect(htmlToRuns('<div>one</div><div>two</div>', MULTI)).toEqual([
      run('one'),
      run(RUN_BREAK),
      run('two'),
    ]);
    expect(htmlToRuns('one<br>two', MULTI)).toEqual([run('one'), run(RUN_BREAK), run('two')]);
  });

  it('collapses a break to a space when a repo does NOT keep its lines', () => {
    // The seam, from the other side. The default is the starter's behaviour:
    // one paragraph, and a break is a space. This site never asks for it, and
    // this test is what says so on purpose rather than by omission.
    expect(htmlToRuns('one<br>two')).toEqual([run('one two')]);
  });

  it('is empty for empty input', () => {
    expect(htmlToRuns('', MULTI)).toEqual([]);
    expect(htmlToRuns(undefined, MULTI)).toEqual([]);
    expect(htmlToRuns('   ', MULTI)).toEqual([]);
  });
});

describe('normalizeRuns', () => {
  it('squeezes whitespace, merges neighbours and trims the ends', () => {
    expect(normalizeRuns([run('  Come   and '), run('see'), run('  us.  ')])).toEqual([
      run('Come and see us.'),
    ]);
  });

  it('drops a double space that meets ACROSS a mark boundary', () => {
    // THE BUG THIS TEST EXISTS FOR (2026-08-28). The merge above fires only for
    // runs with IDENTICAL marks, so `<b>a </b><i> b</i>` never reached it and
    // TWO spaces were stored. The space goes from the SECOND run, because a
    // leading space inside an emphasised span renders as a wide bold or an
    // over-long underline.
    expect(normalizeRuns([run('a ', true), run(' b', false, true)])).toEqual([
      run('a ', true),
      run('b', false, true),
    ]);
    expect(htmlToRuns('<b>a </b><i> b</i>', MULTI)).toEqual([
      run('a ', true),
      run('b', false, true),
    ]);
    // A break tag inside ONE mark still merges into a single run, so the rule
    // cannot cost a span where the old behaviour was already right.
    expect(htmlToRuns('<b>a<br>b</b>')).toEqual([run('a b', true)]);
  });

  it('never merges across a line break', () => {
    expect(normalizeRuns([run('one'), run(RUN_BREAK), run('two')])).toEqual([
      run('one'),
      run(RUN_BREAK),
      run('two'),
    ]);
  });

  it('trims each line, not only the whole value', () => {
    expect(normalizeRuns([run(' one '), run(RUN_BREAK), run(' two ')])).toEqual([
      run('one'),
      run(RUN_BREAK),
      run('two'),
    ]);
  });

  it('drops blank lines, including leading and trailing ones', () => {
    expect(
      normalizeRuns([
        run(RUN_BREAK),
        run('one'),
        run(RUN_BREAK),
        run('  '),
        run(RUN_BREAK),
        run('two'),
        run(RUN_BREAK),
      ]),
    ).toEqual([run('one'), run(RUN_BREAK), run('two')]);
  });

  it('reads a newline INSIDE a run as whitespace, not as a line', () => {
    // Source formatting reaches the parser as a text node. A pretty-printed
    // paste must not grow a line for every newline its author's editor left in.
    expect(normalizeRuns([run('a\nb')])).toEqual([run('a b')]);
  });

  it('keeps runs whose marks differ side by side', () => {
    expect(normalizeRuns([run('plain '), run('bold', true)])).toEqual([
      run('plain '),
      run('bold', true),
    ]);
  });
});

describe('textToRuns', () => {
  it('reads a clipboard with no HTML flavour, lines and all', () => {
    expect(textToRuns('  two   words  ', MULTI)).toEqual([run('two words')]);
    expect(textToRuns('one\r\ntwo', MULTI)).toEqual([run('one'), run(RUN_BREAK), run('two')]);
    expect(textToRuns('', MULTI)).toEqual([]);
  });
});

describe('runsToInlineRich', () => {
  it('builds one block per line, with the marks the schema allows', () => {
    expect(
      runsToInlineRich(
        [run('one '), run('bold', true), run(RUN_BREAK), run('two', false, true)],
        keys(),
      ),
    ).toEqual([
      {
        _type: 'block',
        _key: 'k1',
        style: 'normal',
        markDefs: [],
        children: [
          { _type: 'span', _key: 'k2', text: 'one ', marks: [] },
          { _type: 'span', _key: 'k3', text: 'bold', marks: ['strong'] },
        ],
      },
      {
        _type: 'block',
        _key: 'k4',
        style: 'normal',
        markDefs: [],
        children: [{ _type: 'span', _key: 'k5', text: 'two', marks: ['em'] }],
      },
    ]);
  });

  it('writes both marks in a fixed order', () => {
    const [block] = runsToInlineRich([run('x', true, true)], keys()) as never[];
    expect((block as { children: { marks: string[] }[] }).children[0].marks).toEqual([
      'strong',
      'em',
    ]);
  });

  it('stores NOTHING for an emptied box, so the plain string renders again', () => {
    expect(runsToInlineRich([], keys())).toEqual([]);
    expect(runsToInlineRich([run('   ')], keys())).toEqual([]);
    expect(runsToInlineRich([run(RUN_BREAK)], keys())).toEqual([]);
  });
});

describe('htmlToInlineRich', () => {
  it('is the whole write direction, allow-list and all', () => {
    const blocks = htmlToInlineRich(
      '<p>Two mornings a <b>week</b>.</p><p><script>x</script>Ages 2 to 5.</p>',
      keys(),
      MULTI,
    );
    expect(blocks).toHaveLength(2);
    expect(emphasisHtml(blocks)).toBe(
      '<span class="wcp-emphasis">Two mornings a <strong>week</strong>.<br />Ages 2 to 5.</span>',
    );
  });
});

describe('runsToHtml and inlineRichToHtml', () => {
  it('escapes the three characters that would otherwise be markup', () => {
    expect(escapeHtml('a & <b> c')).toBe('a &amp; &lt;b&gt; c');
    expect(runsToHtml([run('<script>')])).toBe('&lt;script&gt;');
  });

  it('renders em inside strong, so identical content is identical markup', () => {
    expect(runsToHtml([run('x', true, true)])).toBe('<strong><em>x</em></strong>');
  });

  it('renders a line break as a <br> the contenteditable understands', () => {
    expect(runsToHtml([run('one'), run(RUN_BREAK), run('two')])).toBe('one<br>two');
  });

  it('round-trips a stored twin through the box and back unchanged', () => {
    const stored = htmlToInlineRich(
      'Two mornings a <b>week</b>.<br>Ages <i>2 to 5</i>.',
      keys(),
      MULTI,
    );
    const seeded = inlineRichToHtml(stored);
    expect(seeded).toBe('Two mornings a <strong>week</strong>.<br>Ages <em>2 to 5</em>.');
    expect(htmlToInlineRich(seeded, keys(), MULTI)).toEqual(stored);
  });

  it('is empty for a twin holding nothing', () => {
    expect(inlineRichToHtml(undefined)).toBe('');
    expect(inlineRichToHtml([])).toBe('');
  });
});
