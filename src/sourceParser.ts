// https://www.ecma-international.org/ecma-262/9.0/index.html#sec-html-like-comments
// explains that JavaScript parsers may or may not recognize html
// comment tokens "<" immediately followed by "!--" and "--"
// immediately followed by ">" in non-module source text, and treat
// them as a kind of line comment. Since otherwise both of these can
// appear in normal JavaScript source code as a sequence of operators,
// we have the terrifying possibility of the same source code parsing
// one way on one correct JavaScript implementation, and another way
// on another.
//
// This shim takes the conservative strategy of just rejecting source
// text that contains these strings anywhere. Note that this very
// source file is written strangely to avoid mentioning these
// character strings explicitly.

// We do not write the regexp in a straightforward way, so that an
// apparennt html comment does not appear in this file. Thus, we avoid
// rejection by the overly eager rejectDangerousSources.
const htmlCommentPattern = new RegExp(`(?:${"<"}!--|--${">"})`);

function rejectHtmlComments(s: string) {
  const index = s.search(htmlCommentPattern);
  if (index !== -1) {
    const linenum = s.slice(0, index).split("\n").length; // more or less
    throw new SyntaxError(
      `possible html comment syntax rejected around line ${linenum}`
    );
  }
}

// The proposed dynamic import expression is the only syntax currently
// proposed, that can appear in non-module JavaScript code, that
// enables direct access to the outside world that cannot be
// surpressed or intercepted without parsing and rewriting. Instead,
// this shim conservatively rejects any source text that seems to
// contain such an expression. To do this safely without parsing, we
// must also reject some valid programs, i.e., those containing
// apparent import expressions in literal strings or comments.

// The current conservative rule looks for the identifier "import"
// followed by either an open paren or something that looks like the
// beginning of a comment. We assume that we do not need to worry
// about html comment syntax because that was already rejected by
// rejectHtmlComments.

// this \s *must* match all kinds of syntax-defined whitespace. If e.g.
// U+2028 (LINE SEPARATOR) or U+2029 (PARAGRAPH SEPARATOR) is treated as
// whitespace by the parser, but not matched by /\s/, then this would admit
// an attack like: import\u2028('power.js') . We're trying to distinguish
// something like that from something like importnotreally('power.js') which
// is perfectly safe.

const importPattern = /\bimport\s*(?:\(|\/[/*])/;

// Still allow JSDocs that use `import()` such as:
// * @param {import('./foo.js').MyType}
// * @param {typeof import('./foo.js').Obj}
//
// Note that this is not valid syntax outside of a comment
// (import expressions cannot be the start of an object literal,
// nor can decorators adorn blocks).
//
// Also note that the dollar at the end matches where the import begins
// since the 's' modifier is given.
//
// BE CAREFUL not to use `\s`, as that will match newlines.
const allowedImportPrefix = /@[a-z]+ +\{((type|key)of +)?$/s;

function rejectImportExpressions(s: string) {
  let index = 0;
  for (;;) {
    // Find the next `import` string in the source.
    const nextMatch = s.slice(index).search(importPattern);
    if (nextMatch === -1) {
      // Not found, the source is okay.
      return;
    }
    // Advance our index to the beginning of `import`.
    index += nextMatch;
    // Take the source up to the match, and see if
    // it ends in the allowed prefix.
    if (s.slice(0, index).match(allowedImportPrefix)) {
      // Move the search one character forward, and go again.
      index += 1;
      continue;
    }
    // It doesn't end in the allowed prefix, so reject the source entirely.
    const linenum = s.slice(0, index).split("\n").length; // more or less
    throw new SyntaxError(
      `possible import expression rejected around line ${linenum}`
    );
  }
}

export function rejectDangerousSources(s: string) {
  rejectHtmlComments(s);
  rejectImportExpressions(s);
}

// Export a rewriter transform.
export const rejectDangerousSourcesTransform = {
  rewrite<T extends { src: string }>(rs: T) {
    rejectDangerousSources(rs.src);
    return rs;
  },
};
