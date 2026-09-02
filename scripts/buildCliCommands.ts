/**
 * Generates the CLI's command table from the route declarations.
 *
 * A command that only maps arguments onto a request needs no code: its
 * positional, flags, method and path all come from the route. This emits that
 * table as JSON, which `src/cli/commands/generated.ts` turns into commands at
 * startup.
 *
 * Commands marked `custom` in their declaration are hand-written, because they
 * do something the request shape cannot describe — writing export files,
 * storing a session, holding a stream open.
 *
 * The file is committed, so `src/` never depends on `scripts/`.
 *
 *   node -r sucrase/register scripts/buildCliCommands.ts
 */
import path from 'path'

import {
  type ExtractedCli,
  type ExtractedRoute,
  extractRoutes,
  kebab
} from './extractRoutes'
import { writeIfChanged } from './writeIfChanged'

const OUT = path.resolve(__dirname, '../src/cli/generated/commands.json')

interface ArgSpec {
  /** Flag name, without dashes. Absent when taken as the positional. */
  flag?: string
  /** Request field it fills. */
  field: string
  /** Where it goes. */
  target: 'query' | 'body'
  kind: 'string' | 'boolean' | 'repeat' | 'json'
  required: boolean
}

interface CommandSpec {
  command: string
  method: string
  path: string
  usage: string
  help: string
  needsSession: boolean
  /** Field taken as the bare positional argument. */
  positional?: ArgSpec
  /** Path parameter taken as the positional, e.g. `{walletId}`. */
  pathPositional?: string
  args: ArgSpec[]
  /** Flag carrying the whole body as one JSON argument. */
  bodyFlag?: string
  /** Fields sent at fixed values. */
  preset?: Record<string, boolean>
}

/** A JSON blob is anything the caller cannot express as a scalar flag. */
function kindOf(type: string): ArgSpec['kind'] {
  const t = type.replace(/ \| (null|undefined)/g, '').trim()
  if (t === 'boolean') return 'boolean'
  if (t.endsWith('[]') || t.startsWith('Array<') || t.startsWith('{')) {
    return 'json'
  }
  if (t === 'unknown') return 'json'
  return 'string'
}

function specFor(r: ExtractedRoute, cli: ExtractedCli): CommandSpec {
  const fields = [
    ...(r.query ?? []).map(f => ({ f, target: 'query' as const })),
    ...(r.body ?? []).map(f => ({ f, target: 'body' as const }))
  ]

  // `{sessionId}` comes from the stored session; any other path parameter is
  // the command's positional argument.
  const pathPositional = r.pathParams.find(p => p !== 'sessionId')
  let positional: ArgSpec | undefined
  const args: ArgSpec[] = []
  for (const { f, target } of fields) {
    const mapped = cli.flags.find(x => x.maps === f.name)
    const spec: ArgSpec = {
      flag: mapped?.name ?? kebab(f.name),
      field: f.name,
      target,
      kind: mapped?.repeat === true ? 'repeat' : kindOf(f.type),
      required: !f.optional
    }
    if (cli.positional === f.name) {
      positional = { ...spec, flag: undefined }
    } else {
      args.push(spec)
    }
  }

  if (pathPositional != null && positional != null) {
    throw new Error(
      `${cli.command}: takes both a path parameter and a positional field; ` +
        'mark it `custom: true` and hand-write it.'
    )
  }
  const parts = [cli.command]
  if (pathPositional != null) parts.push(`<${pathPositional}>`)
  if (positional != null) parts.push(`<${positional.field}>`)
  if (cli.bodyFlag != null) parts.push(`--${cli.bodyFlag}='<json>'`)
  else {
    for (const a of args) {
      const token =
        a.kind === 'boolean'
          ? `--${a.flag ?? ''}`
          : a.kind === 'json'
          ? `--${a.flag ?? ''}='<json>'`
          : `--${a.flag ?? ''}=<${a.field}>`
      parts.push(a.required ? token : `[${token}]`)
    }
  }

  return {
    command: cli.command,
    method: r.method,
    path: r.routePath,
    usage: parts.join(' '),
    help: r.summary,
    needsSession: r.pathParams.includes('sessionId'),
    positional,
    pathPositional,
    args: cli.bodyFlag != null ? [] : args,
    bodyFlag: cli.bodyFlag,
    preset: Object.keys(cli.preset).length > 0 ? cli.preset : undefined
  }
}

const commands: CommandSpec[] = []
const custom: string[] = []
for (const r of extractRoutes()) {
  if (r.isStream) continue
  for (const cli of [r.cli, ...r.cliExtra]) {
    if (cli == null) continue
    if (cli.custom) {
      custom.push(cli.command)
      continue
    }
    if (commands.some(c => c.command === cli.command)) {
      throw new Error(
        `Command "${cli.command}" is declared on more than one route. ` +
          'Mark it `custom: true` and hand-write the dispatch.'
      )
    }
    commands.push(specFor(r, cli))
  }
}
commands.sort((a, b) => a.command.localeCompare(b.command))

const payload = {
  $comment:
    'GENERATED FILE — DO NOT EDIT. Produced by scripts/buildCliCommands.ts ' +
    'from the route declarations in src/cli/engine/routes. Commands marked ' +
    '`custom: true` in a declaration are hand-written instead; see ' +
    'src/cli/commands/.',
  commands
}

const changed = writeIfChanged(OUT, JSON.stringify(payload, null, 2) + '\n')
console.log(
  `${changed ? '✓ wrote' : '· unchanged'} src/cli/generated/commands.json ` +
    `(${commands.length} generated, ${custom.length} hand-written)`
)
