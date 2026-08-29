// =============================================================================
// emphasis-write — unit tests for the WRITE half of the rich twins
// =============================================================================
// The in-canvas text card hands this module whatever a browser's contenteditable
// produced, plus whatever an editor pasted out of Word. Three promises are worth
// pinning, because all three fail silently:
//   1. NO TAG NAME SURVIVES. The output is built from plain strings and two
//      booleans, so a paste can never carry markup into the dataset.
//   2. LINE BREAKS SURVIVE. This site joins stored blocks with <br />, so a twin
//      an editor typed on two lines has two blocks. Collapsing them would delete
//      a line break the moment somebody opened the card.
//   3. AN EMPTY BOX STORES NOTHING, so the plain string underneath renders
//      again, exactly as clearing the twin's box in the Studio form does.
// =============================================================================
import { describe, expect, it } from 'vitest';
import { emphasisHtml, RUN_BREAK, type InlineRun } from './emphasis';
import {
  emphasisToHtml,
  escapeRunHtml,
  htmlToEmphasis,
  htmlToRuns,
  normalizeRuns,
  runsToEmphasis,
  runsToHtml,
} from './emphasis-write';

/** Predictable keys, so a whole block is comparable. */
const keys = () => {
  let n = 0;
  return () => `k${(n += 1)}`;
};

const run = (text: string, strong = false, em = false): InlineRun => ({ text, strong, em });

describe('htmlToRuns', () => {
  it('reads bold and italic under either tag name', () => {
    expect(htmlToRuns('a <b>bee</b> <i>see</i> <strong>dee</strong> <em>ee</em>')).toEqual([
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
    expect(htmlToRuns('<span style="font-weight: 700">heavy</span>')).toEqual([run('heavy', true)]);
    expect(htmlToRuns("<span style='font-style:italic'>lean</span>")).toEqual([
      run('lean', false, true),
    ]);
  });

  it('nests marks', () => {
    expect(htmlToRuns('<strong>bold <em>both</em></strong>')).toEqual([
      run('bold ', true),
      run('both', true, true),
    ]);
  });

  it('keeps the text of an unknown tag and drops the tag', () => {
    expect(htmlToRuns('<table><tr><td><font color="red">red</font></td></tr></table>')).toEqual([
      run('red'),
    ]);
  });

  it('drops a script tag CONTENTS AND ALL', () => {
    // The script contributes NOTHING, not even a boundary, so what is left is
    // one run: no tag name, and no argument of a tag, can reach the dataset.
    expect(htmlToRuns('before<script>alert(1)</script>after')).toEqual([run('beforeafter')]);
    expect(htmlToRuns('<style>p{color:red}</style>text')).toEqual([run('text')]);
  });

  it('decodes the entities a contenteditable actually emits', () => {
    expect(htmlToRuns('a &amp; b &lt;c&gt; &#39;d&#39; &nbsp;e')).toEqual([run("a & b <c> 'd' e")]);
  });

  it('treats a lone angle bracket as text, not a tag', () => {
    expect(htmlToRuns('5 < 6')).toEqual([run('5 < 6')]);
  });

  it('turns a block boundary into ONE line break', () => {
    expect(htmlToRuns('<div>one</div><div>two</div>')).toEqual([
      run('one'),
      run(RUN_BREAK),
      run('two'),
    ]);
    expect(htmlToRuns('one<br>two')).toEqual([run('one'), run(RUN_BREAK), run('two')]);
  });

  it('is empty for empty input', () => {
    expect(htmlToRuns('')).toEqual([]);
    expect(htmlToRuns(undefined)).toEqual([]);
    expect(htmlToRuns('   ')).toEqual([]);
  });
});

describe('normalizeRuns', () => {
  it('squeezes whitespace, merges neighbours and trims the ends', () => {
    expect(normalizeRuns([run('  Come   and '), run('see'), run('  us.  ')])).toEqual([
      run('Come and see us.'),
    ]);
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

  it('keeps runs whose marks differ side by side', () => {
    expect(normalizeRuns([run('plain '), run('bold', true)])).toEqual([
      run('plain '),
      run('bold', true),
    ]);
  });
});

describe('runsToEmphasis', () => {
  it('builds one block per line, with the marks the schema allows', () => {
    expect(
      runsToEmphasis(
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
    const [block] = runsToEmphasis([run('x', true, true)], keys()) as never[];
    expect((block as { children: { marks: string[] }[] }).children[0].marks).toEqual([
      'strong',
      'em',
    ]);
  });

  it('stores NOTHING for an emptied box, so the plain string renders again', () => {
    expect(runsToEmphasis([], keys())).toEqual([]);
    expect(runsToEmphasis([run('   ')], keys())).toEqual([]);
    expect(runsToEmphasis([run(RUN_BREAK)], keys())).toEqual([]);
  });
});

describe('htmlToEmphasis', () => {
  it('is the whole write direction, allow-list and all', () => {
    const blocks = htmlToEmphasis(
      '<p>Two mornings a <b>week</b>.</p><p><script>x</script>Ages 2 to 5.</p>',
      keys(),
    );
    expect(blocks).toHaveLength(2);
    expect(emphasisHtml(blocks)).toBe(
      '<span class="wcp-emphasis">Two mornings a <strong>week</strong>.<br />Ages 2 to 5.</span>',
    );
  });
});

describe('runsToHtml and emphasisToHtml', () => {
  it('escapes the three characters that would otherwise be markup', () => {
    expect(escapeRunHtml('a & <b> c')).toBe('a &amp; &lt;b&gt; c');
    expect(runsToHtml([run('<script>')])).toBe('&lt;script&gt;');
  });

  it('renders em inside strong, so identical content is identical markup', () => {
    expect(runsToHtml([run('x', true, true)])).toBe('<strong><em>x</em></strong>');
  });

  it('renders a line break as a <br> the contenteditable understands', () => {
    expect(runsToHtml([run('one'), run(RUN_BREAK), run('two')])).toBe('one<br>two');
  });

  it('round-trips a stored twin through the box and back unchanged', () => {
    const stored = htmlToEmphasis('Two mornings a <b>week</b>.<br>Ages <i>2 to 5</i>.', keys());
    const seeded = emphasisToHtml(stored);
    expect(seeded).toBe('Two mornings a <strong>week</strong>.<br>Ages <em>2 to 5</em>.');
    expect(htmlToEmphasis(seeded, keys())).toEqual(stored);
  });

  it('is empty for a twin holding nothing', () => {
    expect(emphasisToHtml(undefined)).toBe('');
    expect(emphasisToHtml([])).toBe('');
  });
});
