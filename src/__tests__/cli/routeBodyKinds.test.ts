// Side-effect import: each route file registers itself by calling `route()`.
import '../../cli/engine/routes'

import fs from 'fs'
import path from 'path'

import { allRoutes } from '../../cli/engine/route'
import { asCommandsTableJson } from '../../cli/generatedSchemas'

/**
 * A body field the CLI can only send as text must accept text.
 *
 * `kindOf` resolves a body field to `kind: 'string'` unless its cleaner is a
 * structured one, and `generated.ts` then puts the raw flag text into the
 * body. So a `kind: 'string'` field declared with a cleaner that refuses a
 * string is a command nobody can run: `enable-otp --timeout=604800` sent
 * `{"timeout":"604800"}` into `asOptional(asNumber)` and came back
 * `BAD_REQUEST: Expected a number, got "604800" at .timeout`.
 *
 * `asBodyNumber`'s docblock has claimed this test exists since that fix. It
 * did not, which is worse than no claim — the next reader stops checking.
 *
 * The check runs each route's real body cleaner over a string, rather than
 * comparing published types: the OpenAPI type is the cleaner's *output*, so
 * `asBodyNumber` publishes `number` while accepting both, and a type
 * comparison would report the two fields that are already correct.
 */
const ROOT = path.resolve(__dirname, '../../..')

/** Whether a cleaner rejects `value` specifically at `field`. */
function rejectsAt(
  cleaner: (raw: unknown) => unknown,
  field: string,
  body: Record<string, unknown>
): boolean {
  try {
    cleaner(body)
    return false
  } catch (error: unknown) {
    // Cleaners name the path they failed at. Another field's complaint — a
    // required one this minimal body does not have — is not this field's
    // problem, so only a message naming this one counts.
    const message = error instanceof Error ? error.message : String(error)
    return message.includes(`.${field}`)
  }
}

describe('route body kinds', () => {
  const commands = asCommandsTableJson(
    fs.readFileSync(path.join(ROOT, 'src/cli/generated/commands.json'), 'utf8')
  ).commands

  /** Every route by `METHOD path`, which is what the table records. */
  const byRoute = new Map<string, { body?: (raw: unknown) => unknown }>()
  for (const route of allRoutes()) {
    byRoute.set(`${route.method} ${route.path}`, route as never)
  }

  it('accepts a string for every body field the CLI sends as text', () => {
    const offenders: string[] = []
    let checked = 0
    for (const command of commands) {
      // `json`, `boolean`, `boolstr` and `repeat` are parsed by the client
      // before they reach the body, so their cleaner sees a real value.
      const fields = command.args
        .filter(a => a.target === 'body' && a.kind === 'string')
        .map(a => a.field)
      if (fields.length === 0) continue
      const route = byRoute.get(`${command.method} ${command.path}`)
      const cleaner = route?.body
      if (cleaner == null) continue
      for (const field of fields) {
        checked++
        // The value a flag actually produces: text, never empty — an empty
        // one is refused by the argument parser before this.
        //
        // The number is probed too, and only a field that takes the number
        // and refuses the *string* is reported. A cleaner may legitimately
        // refuse `1` on its merits — `enable-otp --timeout` floors at an
        // hour, because a shorter 2FA reset delay leaves no window for
        // `cancel-otp-reset` — and that is a judgement about the value, not
        // the "the CLI sends text" bug this gate is for.
        const refusesText = rejectsAt(cleaner, field, { [field]: '1' })
        const refusesNumber = rejectsAt(cleaner, field, { [field]: 1 })
        if (refusesText && !refusesNumber) {
          offenders.push(`${command.command}: --${field} refuses a string`)
        }
      }
    }
    // A guard against the check silently resolving nothing, which is how a
    // gate starts passing for the wrong reason.
    expect(checked).toBeGreaterThan(50)
    expect(offenders).toStrictEqual([])
  })
})
