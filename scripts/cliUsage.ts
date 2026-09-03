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
 * Only an optional boolean qualifies. A required one needs `=true|false`,
 * because a bare flag has no way to say false — which is how `change-paused`
 * came to have no way to unpause a wallet.
 */
function isSwitch(field: ExtractedField): boolean {
  return field.optional && bareType(field.type) === 'boolean'
}

/** How one request field is supplied on the command line. */
/** True when the value has to be written as JSON rather than a bare word. */
function isJson(type: string): boolean {
  const t = bareType(type)
  return (
    t.endsWith('[]') ||
    t.startsWith('Array<') ||
    t.startsWith('{') ||
    t === 'unknown'
  )
}

/**
 * What a field's value looks like on the command line.
 *
 * The placeholder names the field rather than saying `<value>`, so a usage
 * line reads as something a person could type. Where the declaration knows
 * the exact values — a boolean, or a union of literals — it says them.
 */
function valueForm(field: ExtractedField): string {
  if (bareType(field.type) === 'boolean') return 'true|false'
  const choices = literalChoices(field.type)
  if (choices != null) return choices
  if (isJson(field.type)) return "'<json>'"
  return `<${field.name}>`
}

export function passForm(cli: ExtractedCli, field: ExtractedField): string {
  // A positional rides on the path, so it is typed bare, not as a flag.
  if (cli.positional === field.name) return `<${field.name}>`
  const mapped = cli.flags.find(f => f.maps === field.name)
  const name = mapped?.name ?? kebab(field.name)
  const token = isSwitch(field)
    ? `--${name}`
    : mapped?.repeat === true
    ? `--${name}=<${field.name}> …`
    : `--${name}=${valueForm(field)}`
  return field.optional ? `[${token}]` : token
}

/** The full usage line: command, positional, then every named argument. */
export function usageFor(r: ExtractedRoute, cli: ExtractedCli): string {
  const parts = [cli.command]
  // A positional is a path parameter, so the path is the single source for
  // it; `cli.positional` only names which field it carries.
  for (const p of r.pathParams) if (p !== 'sessionId') parts.push(`<${p}>`)
  for (const f of [...(r.query ?? []), ...(r.body ?? [])]) {
    if (r.pathParams.includes(f.name)) continue
    parts.push(passForm(cli, f))
  }
  for (const x of cli.extra) {
    const token = x.kind === 'boolean' ? `--${x.name}` : `--${x.name}=<value>`
    parts.push(x.required === true ? token : `[${token}]`)
  }
  return parts.join(' ')
}
