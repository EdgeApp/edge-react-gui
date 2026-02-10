import type { EdgeAccount, EdgeContext, EdgeCurrencyWallet } from 'edge-core-js'

/**
 * Runtime state for the CLI.
 *
 * Fields are optional because not every command needs an account or
 * wallet.  Use `requireContext()` / `requireAccount()` inside commands
 * that declare `needsContext` / `needsAccount` – the runtime guarantees
 * they are set by that point.
 */
export interface Session {
  context?: EdgeContext
  account?: EdgeAccount
  wallet?: EdgeCurrencyWallet
}

/** Asserts that `session.context` is set and returns it. */
export function requireContext(session: Session): EdgeContext {
  if (session.context == null) {
    throw new Error('Session has no context (internal error)')
  }
  return session.context
}

/** Asserts that `session.account` is set and returns it. */
export function requireAccount(session: Session): EdgeAccount {
  if (session.account == null) {
    throw new Error('Session has no account (internal error)')
  }
  return session.account
}
