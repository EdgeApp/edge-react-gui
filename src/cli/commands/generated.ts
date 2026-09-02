/**
 * Registers every command that is just an argument mapping.
 *
 * The table comes from `src/cli/generated/commands.json`, produced from the
 * route declarations. A command listed there needs no code: its positional,
 * flags, method and path are all in the declaration, so the mapping below is
 * the same for all of them.
 *
 * Commands doing something the request shape cannot describe are hand-written
 * in their own module and marked `custom: true` on the route.
 */
import { printJson } from '../client/output'
import { command, requireSession, UsageError } from '../command'
import { type FlagKind, parseCommandArgs } from '../commandArgs'
import table from '../generated/commands.json'

interface ArgSpec {
  flag?: string
  field: string
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
  pathPositional?: string
  args: ArgSpec[]
  bodyFlag?: string
  preset?: Record<string, boolean>
}

/** Argument kinds map onto the parser's flag kinds. */
function flagKind(kind: ArgSpec['kind']): FlagKind {
  if (kind === 'boolean') return 'boolean'
  if (kind === 'repeat') return 'repeat'
  return 'string'
}

function parseJson(raw: string, spec: CommandSpec, what: string): unknown {
  try {
    return JSON.parse(raw)
  } catch {
    throw new UsageError(undefined, `--${what} must be valid JSON`)
  }
}

for (const spec of (table as { commands: CommandSpec[] }).commands) {
  const cmd = command(
    spec.command,
    {
      usage: spec.usage,
      help: spec.help,
      needsSession: spec.needsSession
    },
    async (ctx, argv) => {
      const flags: Record<string, FlagKind> = {}
      for (const a of spec.args) {
        if (a.flag != null) flags[a.flag] = flagKind(a.kind)
      }
      if (spec.bodyFlag != null) flags[spec.bodyFlag] = 'string'

      const args = parseCommandArgs(cmd, argv, {
        positional: spec.pathPositional != null ? 'required' : 'none',
        flags
      })

      const query = new URLSearchParams()
      let body: Record<string, unknown> | undefined

      const put = (a: ArgSpec, value: unknown): void => {
        if (a.target === 'query') {
          query.set(a.field, String(value))
        } else {
          body = body ?? {}
          body[a.field] = value
        }
      }

      if (spec.preset != null) {
        body = { ...(body ?? {}), ...spec.preset }
      }
      if (spec.bodyFlag != null) {
        const raw = args.requireString(spec.bodyFlag)
        body = parseJson(raw, spec, spec.bodyFlag) as Record<string, unknown>
      } else {
        for (const a of spec.args) {
          if (a.flag == null) continue
          if (a.kind === 'boolean') {
            if (args.boolean(a.flag)) put(a, true)
            continue
          }
          if (a.kind === 'repeat') {
            const values = args.strings(a.flag)
            if (values.length > 0) put(a, values)
            else if (a.required)
              throw new UsageError(cmd, `Missing --${a.flag}`)
            continue
          }
          const value = args.string(a.flag)
          if (value == null) {
            if (a.required) throw new UsageError(cmd, `Missing --${a.flag}`)
            continue
          }
          put(a, a.kind === 'json' ? parseJson(value, spec, a.flag) : value)
        }
      }

      // `{sessionId}` is filled from the stored session; other path params
      // come from the command's positional.
      let path = spec.path
      if (spec.needsSession) {
        path = path.replace(
          '{sessionId}',
          encodeURIComponent(requireSession(ctx))
        )
      }
      if (spec.pathPositional != null) {
        path = path.replace(
          `{${spec.pathPositional}}`,
          encodeURIComponent(String(args.positional ?? ''))
        )
      }

      const qs = query.toString()
      if (qs !== '') path += (path.includes('?') ? '&' : '?') + qs

      const result =
        spec.method === 'GET'
          ? await ctx.client.get(path)
          : await ctx.client.post(path, body)
      printJson(result ?? { ok: true })
    }
  )
}
