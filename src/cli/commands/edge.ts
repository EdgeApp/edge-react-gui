import type { EdgeAccount } from 'edge-core-js'

import { command, UsageError } from '../command'
import { requireContext } from '../util/session'

command(
  'edge-login',
  {
    usage: '',
    help: 'Requests an edge login',
    needsContext: true
  },
  async function (console, session, argv) {
    if (argv.length !== 0) throw new UsageError(this)
    const context = requireContext(session)

    // Request the login:
    const pending = await context.requestEdgeLogin({})
    console.log(`edge://edge/${pending.id}`)

    // Subscribe to login events:
    await new Promise((resolve, reject) => {
      function handleAccount(account?: EdgeAccount): void {
        if (account == null) return
        session.account = account
        resolve(undefined)
      }

      function handleError(error?: unknown): void {
        if (error == null) return
        reject(error instanceof Error ? error : new Error('Unknown error'))
      }

      function handleUsername(username?: string): void {
        if (username == null) return
        console.log(`Starting login for user ${username}`)
      }

      // Subscribe:
      pending.watch('account', handleAccount)
      pending.watch('error', handleError)
      pending.watch('username', handleUsername)

      // Do an initial check:
      handleAccount(pending.account)
      handleError(pending.error)
      handleUsername(pending.username)
    })
  }
)
