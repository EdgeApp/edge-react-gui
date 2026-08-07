import crypto from 'crypto'
import type { EdgeAccount } from 'edge-core-js'

import { base58 } from './encoding'
import { engineError } from './errors'
import type { EventHub } from './events'

const DEFAULT_AUTO_LOGOUT_SECONDS = 3600

export type LoginMethod =
  | 'password'
  | 'pin'
  | 'key'
  | 'recovery2'
  | 'create'
  | 'edge'

export interface SessionInfo {
  sessionId: string
  username: string | undefined
  rootLoginId: string
  loginMethod: LoginMethod
  autoLogoutSeconds: number
  expiresAt: string | null
  lastActivityAt: string
  createdAt: string
}

export interface SessionRecord {
  sessionId: string
  account: EdgeAccount
  loginMethod: LoginMethod
  autoLogoutSeconds: number
  lastActivityAt: number
  createdAt: number
}

export function makeSessionId(): string {
  const bytes = crypto.randomBytes(16)
  return 'sess_' + base58.stringify(bytes)
}

async function readAutoLogoutSeconds(account: EdgeAccount): Promise<number> {
  try {
    const text = await account.disklet.getText('Settings.json')
    const json = JSON.parse(text) as { autoLogoutTimeInSeconds?: number }
    if (typeof json.autoLogoutTimeInSeconds === 'number') {
      return json.autoLogoutTimeInSeconds
    }
  } catch {
    // missing or invalid — use default
  }
  return DEFAULT_AUTO_LOGOUT_SECONDS
}

export class SessionStore {
  private readonly sessions = new Map<string, SessionRecord>()
  private ticker: ReturnType<typeof setInterval> | null = null
  private readonly events: EventHub

  constructor(events: EventHub) {
    this.events = events
  }

  get size(): number {
    return this.sessions.size
  }

  list(): SessionInfo[] {
    return [...this.sessions.values()].map(r => this.toInfo(r))
  }

  async create(
    account: EdgeAccount,
    loginMethod: LoginMethod
  ): Promise<SessionInfo> {
    const sessionId = makeSessionId()
    const autoLogoutSeconds = await readAutoLogoutSeconds(account)
    const now = Date.now()
    const record: SessionRecord = {
      sessionId,
      account,
      loginMethod,
      autoLogoutSeconds,
      lastActivityAt: now,
      createdAt: now
    }
    this.sessions.set(sessionId, record)
    this.events.emit('session.created', {
      sessionId: sessionId.slice(0, 10) + '…',
      username: account.username,
      loginMethod
    })
    return this.toInfo(record)
  }

  get(sessionId: string): SessionRecord {
    const record = this.sessions.get(sessionId)
    if (record == null) {
      throw engineError('INVALID_SESSION', 'Unknown sessionId', 401)
    }
    if (this.isExpired(record)) {
      this.forceLogout(sessionId, 'expired').catch(() => {})
      throw engineError('SESSION_EXPIRED', 'Session auto-logged out', 401)
    }
    return record
  }

  touch(sessionId: string): SessionInfo {
    const record = this.get(sessionId)
    record.lastActivityAt = Date.now()
    return this.toInfo(record)
  }

  async logout(sessionId: string): Promise<void> {
    const record = this.sessions.get(sessionId)
    if (record == null) {
      throw engineError('INVALID_SESSION', 'Unknown sessionId', 401)
    }
    this.sessions.delete(sessionId)
    try {
      await record.account.logout()
    } catch {
      // best effort
    }
    this.events.emit('session.expired', {
      sessionId: sessionId.slice(0, 10) + '…',
      reason: 'logout'
    })
  }

  async forceLogout(
    sessionId: string,
    reason: 'expired' | 'shutdown'
  ): Promise<void> {
    const record = this.sessions.get(sessionId)
    if (record == null) return
    this.sessions.delete(sessionId)
    try {
      await record.account.logout()
    } catch {
      // best effort
    }
    this.events.emit('session.expired', {
      sessionId: sessionId.slice(0, 10) + '…',
      reason
    })
  }

  async logoutAll(): Promise<void> {
    const ids = [...this.sessions.keys()]
    for (const id of ids) {
      await this.forceLogout(id, 'shutdown')
    }
  }

  startAutoLogoutTicker(): void {
    if (this.ticker != null) return
    this.ticker = setInterval(() => {
      this.tick().catch(() => {})
    }, 15_000)
    // Don't keep the process alive solely for the ticker
    this.ticker.unref?.()
  }

  stopAutoLogoutTicker(): void {
    if (this.ticker != null) {
      clearInterval(this.ticker)
      this.ticker = null
    }
  }

  private isExpired(record: SessionRecord): boolean {
    if (record.autoLogoutSeconds === 0) return false
    const elapsed = (Date.now() - record.lastActivityAt) / 1000
    return elapsed > record.autoLogoutSeconds
  }

  private async tick(): Promise<void> {
    for (const [id, record] of this.sessions) {
      if (this.isExpired(record)) {
        await this.forceLogout(id, 'expired')
      }
    }
  }

  toInfo(record: SessionRecord): SessionInfo {
    const expiresAt =
      record.autoLogoutSeconds === 0
        ? null
        : new Date(
            record.lastActivityAt + record.autoLogoutSeconds * 1000
          ).toISOString()
    return {
      sessionId: record.sessionId,
      username: record.account.username,
      rootLoginId: record.account.rootLoginId,
      loginMethod: record.loginMethod,
      autoLogoutSeconds: record.autoLogoutSeconds,
      expiresAt,
      lastActivityAt: new Date(record.lastActivityAt).toISOString(),
      createdAt: new Date(record.createdAt).toISOString()
    }
  }
}
