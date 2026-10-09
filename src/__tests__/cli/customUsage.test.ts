// Side-effect import: each command file registers itself by calling
// `command()`.
import '../../cli/commands/all'

import { describe, expect, it } from '@jest/globals'
import fs from 'fs'
import path from 'path'

import { findCommand, listCommands } from '../../cli/command'
import { asCommandsTableJson, asHelpDocsJson } from '../../cli/generatedSchemas'

const ROOT = path.resolve(__dirname, '../../..')

/**
 * A hand-written command and the reference must describe the same flags.
 *
 * `usageFor` assembles one argument per declared field, which is exactly
 * right for a generated command: `commands/generated.ts` is built from the
 * same declaration, so the two cannot disagree. A `custom: true` command is
 * written by hand against that declaration and nothing compared them, and
 * both halves had drifted:
 *
 *  - `change-enabled-token-ids` published `--token-ids='<json>'`, because
 *    the field is `asArray(asRequestTokenId)` and `valueForm` renders a
 *    structured field that way, while the command splits the raw value on
 *    commas — so the documented spelling came back
 *    `404 TOKEN_NOT_FOUND Unknown token: ["…"]`, taken as one literal id.
 *    The command's own `UsageError` printed the real form all along, which
 *    is the asymmetry this case is for. `CliFlagSpec.valueForm` is the
 *    declaration that fixes it.
 *  - `change-wallet-states` published a single line carrying both
 *    `--wallet-states` and `--wallet-id`, which the command refuses in so
 *    many words ("`--wallet-states` is the whole map; drop `--wallet-id`").
 *    `CliSpec.usage` is the declaration that fixes it.
 *
 * Two rules, chosen because they are the two that can be checked without
 * turning prose into a contract. The flag *names* must match exactly. And a
 * flag the reference publishes as `'<json>'` must be JSON in the command's
 * own usage too, and the reverse — which is the thing that was wrong, and
 * the thing a caller acts on. Placeholder *names* are deliberately not
 * compared: a hand-written line may say `--fiat=USD` or
 * `--export-format=csv,qbo,bitwave` where the reference says `<fiat>`, and
 * the example is the better line.
 */
const helpDocs = asHelpDocsJson(
  fs.readFileSync(path.join(ROOT, 'src/cli/generated/helpDocs.json'), 'utf8')
)
const generated = new Set(
  asCommandsTableJson(
    fs.readFileSync(path.join(ROOT, 'src/cli/generated/commands.json'), 'utf8')
  ).commands.map(c => c.command)
)

/** Every `--flag` named in a usage line. */
function flagNames(text: string): Set<string> {
  return new Set([...text.matchAll(/--([a-z0-9-]+)/g)].map(m => m[1]))
}

/** Every flag the line says takes a JSON blob. */
function jsonFlags(text: string): Set<string> {
  return new Set([...text.matchAll(/--([a-z0-9-]+)='<json>'/g)].map(m => m[1]))
}

describe('custom commands', () => {
  it('publish an alternative grammar when they have one', () => {
    // The gap the first case cannot see. A command whose own usage string
    // offers alternatives — `(a | b)`, or two lines joined by `|` — has a
    // grammar `usageFor` cannot assemble, because one argument per field
    // assumes every field is passed alongside every other. Without
    // `CliSpec.usage` the reference publishes the one combination the
    // command refuses: `change-wallet-states` advertised `--wallet-states`
    // *and* `--wallet-id`, and `change-enabled-token-ids` advertised
    // `--token-ids` as required with `--add`, `--remove` and
    // `--disable-all` as optional extras beside it. Comparing flag names
    // passes for both, which is why this is its own case.
    const problems: string[] = []
    for (const name of listCommands()) {
      const entry = helpDocs.commands[name]
      if (generated.has(name) || entry == null) continue
      // ` | ` with spaces, which is an alternation; `true|false` without
      // them is one flag's value form and is not one.
      const own = findCommand(name).usage ?? ''
      if (!own.includes(' | ')) continue
      // The published side must offer the alternation too, either in the
      // line itself or as a second line — two routes that share a command
      // name (`local-settings` reads on GET and writes on POST) publish
      // each form separately, which says the same thing.
      const published = [entry.usage, ...(entry.alsoUsage ?? [])]
      if (published.length === 1 && !entry.usage.includes(' | ')) {
        problems.push(
          `${name}: the command's usage offers alternatives, the reference publishes a single form`
        )
      }
    }
    expect(problems).toStrictEqual([])
  })

  it('describe the same flags as the reference', () => {
    const problems: string[] = []
    let checked = 0
    for (const name of listCommands()) {
      const entry = helpDocs.commands[name]
      if (generated.has(name) || entry == null) continue
      const own = findCommand(name).usage
      if (own == null) continue
      ++checked
      const published = [entry.usage, ...(entry.alsoUsage ?? [])].join(' ')
      const pubNames = flagNames(published)
      const ownNames = flagNames(own)
      for (const flag of pubNames) {
        if (!ownNames.has(flag)) {
          problems.push(
            `${name}: the reference publishes --${flag}, the command's usage does not`
          )
        }
      }
      for (const flag of ownNames) {
        if (!pubNames.has(flag)) {
          problems.push(
            `${name}: the command's usage prints --${flag}, the reference does not`
          )
        }
      }
      const pubJson = jsonFlags(published)
      const ownJson = jsonFlags(own)
      for (const flag of pubJson) {
        if (!ownJson.has(flag)) {
          problems.push(
            `${name}: the reference publishes --${flag}='<json>', the command spells it otherwise`
          )
        }
      }
      for (const flag of ownJson) {
        if (!pubJson.has(flag)) {
          problems.push(
            `${name}: the command takes --${flag} as JSON, the reference does not say so`
          )
        }
      }
    }
    expect(problems).toStrictEqual([])
    // The sweep must do work: a filter that resolved nothing would pass.
    expect(checked).toBeGreaterThan(10)
  })
})
