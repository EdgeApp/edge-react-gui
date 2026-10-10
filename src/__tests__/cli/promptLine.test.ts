import { describe, expect, it } from '@jest/globals'

import { splitPromptLine, UnterminatedQuoteError } from '../../cli/promptLine'

/**
 * The prompt must hand a command exactly what the user typed.
 *
 * `docs/EDGE_CLI.md` promises the prompt behaves like one-shot mode, where
 * values arrive verbatim in `process.argv`. The old tokenizer was a shell
 * parser run over text the shell had already unquoted, so it expanded a
 * second time and corrupted values silently. These cases are the ones that
 * were wrong, and they are about credentials and money.
 */
describe('splitPromptLine', () => {
  it('keeps a value containing $ verbatim', () => {
    // The defect this replaces: `$55w0rd` expanded against an empty
    // environment, so the account was created with the password `p` and the
    // user could never log in with what they typed.
    expect(
      splitPromptLine(
        'create-account --username=alice --password=p$55w0rd --pin=1234'
      )
    ).toStrictEqual({
      command: 'create-account',
      args: ['--username=alice', '--password=p$55w0rd', '--pin=1234']
    })
    expect(splitPromptLine('x --password=$HOME').args).toStrictEqual([
      '--password=$HOME'
    ])
    // Assembled, so the lint rule for a `${` inside a plain string does not
    // fire on a case that is specifically about that text surviving.
    const braced = '--password=a' + '$' + '{b}c'
    expect(splitPromptLine(`x ${braced}`).args).toStrictEqual([braced])
  })

  it('keeps # and everything after it', () => {
    // Read as a comment before, which silently truncated a memo or a note.
    expect(splitPromptLine('x --memo=a#b --notes=#1').args).toStrictEqual([
      '--memo=a#b',
      '--notes=#1'
    ])
  })

  it('returns strings for glob and redirect characters', () => {
    // These came back as `{ op: 'glob' }` / `{ op: '>' }` objects, which
    // reached `arg.startsWith('--')` and threw `INTERNAL_ERROR`.
    expect(splitPromptLine('x --search-string=a*b').args).toStrictEqual([
      '--search-string=a*b'
    ])
    expect(splitPromptLine('x --search-string=a?b').args).toStrictEqual([
      '--search-string=a?b'
    ])
    expect(splitPromptLine('x --memo=a>b --memo2=a|b').args).toStrictEqual([
      '--memo=a>b',
      '--memo2=a|b'
    ])
    for (const arg of splitPromptLine('x a*b > out.txt').args) {
      expect(typeof arg).toBe('string')
    }
  })

  it('splits on runs of spaces and tabs', () => {
    expect(splitPromptLine('  wallet-list   --filter=all\t-t  ')).toStrictEqual(
      { command: 'wallet-list', args: ['--filter=all', '-t'] }
    )
  })

  it('reads a blank line as no command', () => {
    for (const line of ['', '   ', '\t']) {
      expect(splitPromptLine(line)).toStrictEqual({ command: null, args: [] })
    }
  })

  it('lets quotes hold a value with spaces, and removes them', () => {
    expect(
      splitPromptLine(`x --notes="two words" --memo='and more'`).args
    ).toStrictEqual(['--notes=two words', '--memo=and more'])
  })

  it('treats everything inside single quotes as literal', () => {
    // Including a backslash, which is the only way to type a password full of
    // them.
    expect(splitPromptLine(`x --password='a\\b$c"d'`).args).toStrictEqual([
      '--password=a\\b$c"d'
    ])
  })

  it('lets a backslash escape a quote or a space', () => {
    expect(splitPromptLine('x --notes=a\\ b').args).toStrictEqual([
      '--notes=a b'
    ])
    expect(splitPromptLine(`x --notes=a\\"b`).args).toStrictEqual([
      '--notes=a"b'
    ])
  })

  it('escapes only a quote and itself inside double quotes', () => {
    // POSIX, and the rule that makes the prompt and one-shot mode agree.
    // Escaping *every* character deleted the backslash from any
    // double-quoted value: `--password="a\b"` became `ab` here and stayed
    // `a\b` in one-shot mode, so an account created at the prompt had a
    // password the user could not reproduce — reported as success, and
    // unrecoverable once `session.json` goes.
    expect(splitPromptLine(`x --password="a\\b"`).args).toStrictEqual([
      '--password=a\\b'
    ])
    expect(splitPromptLine(`x --path="C:\\new\\dir"`).args).toStrictEqual([
      '--path=C:\\new\\dir'
    ])
    // The two it does escape, which is what lets a double-quoted value hold
    // a double quote at all.
    expect(splitPromptLine(`x --v="a\\"b"`).args).toStrictEqual(['--v=a"b'])
    expect(splitPromptLine(`x --v="a\\\\b"`).args).toStrictEqual(['--v=a\\b'])
  })

  it('keeps a trailing backslash rather than continuing the line', () => {
    // One line in, one line out: there is nothing to continue onto.
    expect(splitPromptLine('x --path=C:\\').args).toStrictEqual(['--path=C:\\'])
  })

  it('keeps an empty quoted value as an empty argument', () => {
    // `--notes=` with nothing after it is a value the caller typed, and the
    // argument parser is what decides whether an empty one is allowed.
    expect(splitPromptLine(`x --notes="" --memo=''`).args).toStrictEqual([
      '--notes=',
      '--memo='
    ])
    expect(splitPromptLine(`x ""`).args).toStrictEqual([''])
  })

  it('refuses a quote that is never closed', () => {
    expect(() => splitPromptLine(`x --notes="never ends`)).toThrow(
      UnterminatedQuoteError
    )
    expect(() => splitPromptLine(`x --notes='never ends`)).toThrow(
      /Unterminated single quote/
    )
  })

  it('does not expand ~ or run a subshell', () => {
    expect(splitPromptLine('x -d ~/data --memo=$(whoami)').args).toStrictEqual([
      '-d',
      '~/data',
      '--memo=$(whoami)'
    ])
  })
})
