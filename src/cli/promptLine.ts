/**
 * Split one prompt line into a command and its arguments.
 *
 * The prompt used `lib-cmdparse`, which is `shell-quote`'s `parse` called
 * with no environment. A *shell* parser is the wrong tool here, because the
 * shell has already run: in one-shot mode the values arrive verbatim in
 * `process.argv`, and `docs/EDGE_CLI.md` promises the prompt behaves the
 * same way. Running a second expansion pass over text nobody quoted a second
 * time silently rewrote it:
 *
 *  - `--password=p$55w0rd` became `--password=p`, because `$55w0rd` expanded
 *    against an empty environment. `create-account` then made the account
 *    with the password `p`, reported success, and the user could never log in
 *    with what they typed.
 *  - `--memo=a#b` lost everything from the `#`, read as a comment.
 *  - `--search-string=a*b` came back as `{ op: 'glob', pattern: … }` and
 *    `wallet-list > out.txt` as `[{ op: '>' }, 'out.txt']` — objects, not
 *    strings, which reached `arg.startsWith('--')` and threw.
 *
 * So this does quoting and nothing else: a value is literal unless it is
 * quoted, and quotes only decide where a word ends. No parameter expansion,
 * no comments, no globbing, no operators, no `~`. The one escape is a
 * backslash, which is what lets a value contain a quote character.
 */

interface PromptLine {
  /** The command name, or null for a blank line. */
  command: string | null
  /** Everything after it, exactly as typed. */
  args: string[]
}

/** A quote that was opened and never closed. */
export class UnterminatedQuoteError extends Error {
  constructor(quote: string) {
    super(`Unterminated ${quote === '"' ? 'double' : 'single'} quote`)
    this.name = 'UnterminatedQuoteError'
  }
}

export function splitPromptLine(line: string): PromptLine {
  const words: string[] = []
  let word = ''
  // Distinguishes `--notes=` (an empty value the caller typed) from the gap
  // between two words, which produces no word at all.
  let started = false
  let quote: '"' | "'" | null = null

  for (let i = 0; i < line.length; i++) {
    const ch = line[i]

    // Inside single quotes everything is literal, including a backslash —
    // POSIX, and the only way to type a password full of backslashes.
    if (quote === "'") {
      if (ch === "'") quote = null
      else word += ch
      continue
    }

    if (ch === '\\') {
      const next = line[i + 1]
      if (next === undefined) {
        // A trailing backslash is a literal one, not a line continuation:
        // this reads a single line and has nothing to continue onto.
        word += ch
        started = true
      } else if (quote === '"' && next !== '"' && next !== '\\') {
        // Inside double quotes a backslash escapes only `"` and itself —
        // POSIX, minus the `$` and backtick cases this parser has no
        // expansion for. Escaping everything deleted the backslash from any
        // double-quoted value: `--password="a\b"` became `ab` at the
        // prompt and stayed `a\b` in one-shot mode, so an account created
        // here had a password the user could not reproduce, reported as
        // success. The guide promises the two modes take the same flags.
        word += ch
        started = true
      } else {
        word += next
        started = true
        i++
      }
      continue
    }

    if (quote === '"') {
      if (ch === '"') quote = null
      else word += ch
      continue
    }

    if (ch === '"' || ch === "'") {
      quote = ch
      started = true
      continue
    }

    if (ch === ' ' || ch === '\t') {
      if (started) {
        words.push(word)
        word = ''
        started = false
      }
      continue
    }

    word += ch
    started = true
  }

  if (quote != null) throw new UnterminatedQuoteError(quote)
  if (started) words.push(word)

  const [command = null, ...args] = words
  return { command, args }
}
