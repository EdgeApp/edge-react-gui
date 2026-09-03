import { type Command, UsageError } from './command'

export type FlagKind = 'string' | 'boolean' | 'repeat' | 'boolstr'

export interface ParseSpec {
  /** Default `required` when omitted and a positional is expected. */
  positional?: 'required' | 'optional' | 'none'
  flags?: Record<string, FlagKind>
}

export interface ParsedCommandArgs {
  positional?: string
  string: (name: string) => string | undefined
  requireString: (name: string) => string
  strings: (name: string) => string[]
  boolean: (name: string) => boolean
  boolstr: (name: string) => boolean | undefined
}

function flagKind(spec: ParseSpec, name: string): FlagKind | undefined {
  return spec.flags?.[name]
}

function parseBoolstr(cmd: Command, name: string, raw: string): boolean {
  if (raw === 'true' || raw === '1') return true
  if (raw === 'false' || raw === '0') return false
  throw new UsageError(cmd, `--${name} must be true or false`)
}

/**
 * Parse command-local argv after the command name.
 * `--name=value` is preferred; `--name value` is accepted.
 * Boolean flags are presence-only (`--dry-run`).
 */
export function parseCommandArgs(
  cmd: Command,
  argv: string[],
  spec: ParseSpec
): ParsedCommandArgs {
  const positionalMode = spec.positional ?? 'none'
  const strings: Record<string, string[]> = Object.create(null)
  const booleans: Record<string, boolean> = Object.create(null)
  let positional: string | undefined
  let sawPositional = false

  const takeValue = (
    name: string,
    current: string,
    i: number
  ): { value: string; next: number } => {
    const eq = current.indexOf('=')
    if (eq !== -1) {
      const value = current.slice(eq + 1)
      if (value === '') {
        throw new UsageError(cmd, `--${name} requires a value`)
      }
      return { value, next: i }
    }
    const next = argv[i + 1]
    if (next == null || next.startsWith('-')) {
      throw new UsageError(cmd, `--${name} requires a value`)
    }
    return { value: next, next: i + 1 }
  }

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]
    if (arg === '--') {
      throw new UsageError(cmd, 'Unexpected --')
    }
    if (arg.startsWith('--')) {
      const name = arg.slice(2).split('=')[0]
      const kind = flagKind(spec, name)
      if (kind == null) {
        throw new UsageError(cmd, `Unknown option --${name}`)
      }
      if (kind === 'boolean') {
        if (arg.includes('=')) {
          throw new UsageError(cmd, `--${name} does not take a value`)
        }
        booleans[name] = true
        continue
      }
      const { value, next } = takeValue(name, arg, i)
      i = next
      if (kind === 'repeat') {
        strings[name] = [...(strings[name] ?? []), value]
      } else {
        strings[name] = [value]
      }
      continue
    }
    if (arg.startsWith('-')) {
      throw new UsageError(cmd, `Unknown option ${arg}`)
    }
    if (positionalMode === 'none' || sawPositional) {
      throw new UsageError(cmd)
    }
    positional = arg
    sawPositional = true
  }

  if (positionalMode === 'required' && positional == null) {
    throw new UsageError(cmd)
  }

  return {
    positional,
    string: name => strings[name]?.[0],
    requireString: name => {
      const value = strings[name]?.[0]
      if (value == null) throw new UsageError(cmd, `Missing --${name}`)
      return value
    },
    strings: name => strings[name] ?? [],
    boolean: name => booleans[name],
    boolstr: name => {
      const raw = strings[name]?.[0]
      if (raw == null) return undefined
      return parseBoolstr(cmd, name, raw)
    }
  }
}
