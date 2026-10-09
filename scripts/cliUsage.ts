/**
 * How a command is typed, derived from its route declaration.
 *
 * There were three copies of this: one for the command table the CLI runs on,
 * one for `help`, and one for the HTML reference. They drifted, which is how
 * `local-settings` came to document `--spam-filter-on=<spamFilterOn>` in the
 * reference while `help` correctly said `--spam-filter-on=true|false`. One
 * function means they cannot disagree again.
 */
import {
  type ExtractedCli,
  type ExtractedCliExtra,
  type ExtractedField,
  type ExtractedRoute,
  kebab
} from './extractRoutes'

/** The declared type, with the optional/null wrappers taken off. */
function bareType(type: string): string {
  return type.replace(/ \| (null|undefined)/g, '').trim()
}

/**
 * The allowed values, when the declared type is a union of literals.
 *
 * `asValue('active', 'archived', …)` resolves to `"active" | "archived" | …`,
 * which is exactly the list a reader wants in the usage line. Rendering it as
 * `<value>` throws away something the declaration already knows.
 */
function literalChoices(type: string): string | null {
  const parts = bareType(type)
    .split('|')
    .map(p => p.trim())
  if (parts.length < 2) return null
  if (!parts.every(p => /^(['"]).*\1$/.test(p))) return null
  return parts.map(p => p.slice(1, -1)).join('|')
}

/**
 * True for a field the command takes as a bare switch.
 *
 * Only an optional boolean qualifies, and `commandArgs` accepts `=false` for
 * one of those too — so the usage line says `[--flag[=false]]` rather than a
 * bare `[--flag]`. For `spend`'s `broadcast` and `save` the bare form is
 * inert (both default to true server-side), so advertising only that form
 * left no discoverable way to reach a sign-only or a no-save spend and
 * `edge-cli help spend` showed a flag that did nothing.
 */
function isSwitch(field: ExtractedField): boolean {
  return field.optional && bareType(field.type) === 'boolean'
}

/**
 * Whether a field has to be passed as a JSON argument.
 *
 * Structured is the default and scalar is the exception, because getting this
 * backwards is silent: a field whose cleaner names an interface — an
 * `EdgeMetadataChange` rather than a bare `unknown` — used to fall through to
 * a plain string flag and the engine received the *text* of the JSON.
 *
 * `buildCliCommands` picks a flag's `kind` from this, so the generated usage
 * line and the generated parser cannot disagree.
 */
export function isJson(type: string): boolean {
  const bare = bareType(type)
  // A union of string literals is still one word on the command line.
  if (/^"[^"]*"( \| "[^"]*")*$/.test(bare)) return false
  return (
    bare !== 'string' &&
    bare !== 'number' &&
    bare !== 'boolean' &&
    bare !== 'Date'
  )
}

/**
 * The flag kind a field is parsed with.
 *
 * Here beside the usage line, because the two have to agree: `isSwitch`
 * publishes an optional boolean as `[--flag[=false]]`, which only parses as
 * `'boolean'`. `login-with-key` and `login-with-pin` hand-wrote
 * `'use-login-id': 'boolstr'` against that usage line, and `'boolstr'`
 * demands a value — so the bare form the bracket advertises answered
 * `--use-login-id requires a value`.
 *
 * A JSON blob is anything the caller cannot express as a scalar flag.
 * Structured is the default and scalar is the exception, because getting this
 * backwards is silent: a field whose cleaner names an interface — an
 * `EdgeMetadataChange` rather than a bare `unknown` — used to fall through to
 * a string flag, and the engine then received the *text* of the JSON. The
 * body cleaner rejects that, but a route forwarding the value untouched would
 * have written the string into a synced file.
 */
export function kindOf(
  type: string,
  required: boolean
): 'string' | 'boolean' | 'boolstr' | 'json' {
  const bare = bareType(type)
  // `boolean` now accepts both `--flag` and `--flag=false`, so requiredness
  // is no longer the thing that decides. `boolstr` stays for a field that
  // must be sent either way, where a bare `--flag` would be ambiguous about
  // whether the caller meant to send anything at all.
  if (bare === 'boolean') return required ? 'boolstr' : 'boolean'
  return isJson(bare) ? 'json' : 'string'
}

/**
 * What a field's value looks like on the command line.
 *
 * The placeholder names the field rather than saying `<value>`, so a usage
 * line reads as something a person could type. Where the declaration knows
 * the exact values — a boolean, or a union of literals — it says them.
 */
function valueForm(field: ExtractedField, override?: string): string {
  // A `custom: true` command may parse a field some other way than the
  // generated client would, and then its declaration says so.
  if (override != null) return override
  if (bareType(field.type) === 'boolean') return 'true|false'
  const choices = literalChoices(field.type)
  if (choices != null) return choices
  if (isJson(field.type)) return "'<json>'"
  return `<${field.name}>`
}

/** How one request field is supplied on the command line. */
export function passForm(cli: ExtractedCli, field: ExtractedField): string {
  // A positional rides on the path, so it is typed bare, not as a flag.
  if (cli.positional === field.name) return `<${field.name}>`
  const mapped = cli.flags.find(f => f.maps === field.name)
  const name = mapped?.name ?? kebab(field.name)
  const token = isSwitch(field)
    ? `--${name}[=false]`
    : mapped?.repeat === true
    ? `--${name}=<${field.name}> …`
    : `--${name}=${valueForm(field, mapped?.valueForm)}`
  return cliOptional(cli, field) ? `[${token}]` : token
}

/**
 * Whether the *command* treats a field as optional.
 *
 * The route's own optionality, unless the declaration says the command
 * differs — see `CliFlagSpec.cliRequired`.
 */
export function cliOptional(cli: ExtractedCli, field: ExtractedField): boolean {
  const mapped = cli.flags.find(f => f.maps === field.name)
  if (mapped?.cliRequired != null) return !mapped.cliRequired
  return field.optional
}

/**
 * How one client-side flag is supplied, unbracketed.
 *
 * Shared by the usage line and the parameter table, which had their own
 * copies — the line bracketed an optional and the table did not, so
 * `get-transactions --out` read as required in the one place a caller looks
 * up a single parameter. The placeholder names the flag rather than saying
 * `<value>`, for the same reason `valueForm` names the field.
 */
export function extraPassForm(x: ExtractedCliExtra): string {
  if (x.kind === 'boolean') return `--${x.name}`
  if (x.kind === 'boolstr') return `--${x.name}=true|false`
  if (x.kind === 'repeat') return `--${x.name}=<${x.name}> …`
  return `--${x.name}=<${x.name}>`
}

/** The full usage line: command, positional, then every named argument. */
export function usageFor(r: ExtractedRoute, cli: ExtractedCli): string {
  // A grammar the field list cannot express. One argument per field assumes
  // every field is passed alongside every other, and a command with two
  // mutually exclusive forms is then published as the one combination it
  // refuses.
  if (cli.usage != null) return cli.usage
  const parts = [cli.command]
  // A positional is a path parameter, so the path is the single source for
  // it; `cli.positional` only names which field it carries.
  for (const p of r.pathParams) if (p !== 'sessionId') parts.push(`<${p}>`)
  for (const f of [...(r.query ?? []), ...(r.body ?? [])]) {
    if (r.pathParams.includes(f.name)) continue
    // A field this binding presets is not the caller's to pass: the preset
    // is the whole reason the alias exists. `spend-max` advertised
    // `[--use-max]`, and because `generated.ts` applies the preset *before*
    // the flags, `spend-max --use-max=false` was accepted and silently
    // became a plain `spend`.
    if (Object.prototype.hasOwnProperty.call(cli.preset, f.name)) continue
    parts.push(passForm(cli, f))
  }
  for (const x of cli.extra) {
    const token = extraPassForm(x)
    parts.push(x.required === true ? token : `[${token}]`)
  }
  return parts.join(' ')
}
