// The whole registry, generated and hand-written, since the convention is
// about every command's usage line and not one module's.
import '../../cli/commands/all'

import { describe, expect, it } from '@jest/globals'

import { findCommand, listCommands } from '../../cli/command'

/**
 * Every usage string starts with its own command name.
 *
 * `formatUsage` prints `Usage: edge-cli ${usage}` and omits the name,
 * crediting a gate for the prefix. The generated lines hold by construction
 * (`cliUsage.ts` builds them from `cli.command`); the hand-written ones in
 * `src/cli/commands/` comply by hand, so one typo would print
 * `Usage: edge-cli --wallet-id <id>` with no command in it. This is the gate
 * that comment names.
 */
describe('usage lines', () => {
  it('each begin with the command they belong to', () => {
    const wrong: string[] = []
    for (const name of listCommands()) {
      const { usage } = findCommand(name)
      if (usage == null) continue
      if (usage !== name && !usage.startsWith(`${name} `)) {
        wrong.push(`${name}: ${usage}`)
      }
    }
    expect(wrong).toStrictEqual([])
  })
})
