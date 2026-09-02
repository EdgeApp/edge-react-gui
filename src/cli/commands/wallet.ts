import fs from 'fs'
import path from 'path'

import { parseExportFormats, type TxExportFormat } from '../../util/txExport'
import { printJson } from '../client/output'
import { command, requireSession, UsageError } from '../command'
import { parseCommandArgs } from '../commandArgs'

function walletPath(sessionId: string, walletId: string, suffix = ''): string {
  return `/account/${encodeURIComponent(
    sessionId
  )}/wallets/${encodeURIComponent(walletId)}${suffix}`
}

const walletStateCmd = command(
  'change-wallet-states',
  {
    usage:
      'change-wallet-states <walletId> [--archived=true|false] [--deleted=true|false] [--hidden=true|false] [--sort-index=N]',
    help: 'Set wallet archived/deleted/hidden/sortIndex (account.changeWalletStates)',
    needsSession: true
  },
  async (ctx, argv) => {
    const args = parseCommandArgs(walletStateCmd, argv, {
      positional: 'required',
      flags: {
        archived: 'boolstr',
        deleted: 'boolstr',
        hidden: 'boolstr',
        'sort-index': 'string'
      }
    })
    const state: Record<string, unknown> = {}
    const archived = args.boolstr('archived')
    const deleted = args.boolstr('deleted')
    const hidden = args.boolstr('hidden')
    const sortIndexRaw = args.string('sort-index')
    if (archived != null) state.archived = archived
    if (deleted != null) state.deleted = deleted
    if (hidden != null) state.hidden = hidden
    if (sortIndexRaw != null) {
      const sortIndex = Number(sortIndexRaw)
      if (!Number.isFinite(sortIndex)) {
        throw new UsageError(walletStateCmd, '--sort-index must be a number')
      }
      state.sortIndex = sortIndex
    }
    if (Object.keys(state).length === 0) {
      throw new UsageError(
        walletStateCmd,
        'Provide at least one of --archived, --deleted, --hidden, --sort-index'
      )
    }
    const sessionId = requireSession(ctx)
    await ctx.client.post(
      `/account/${encodeURIComponent(sessionId)}/change-wallet-states`,
      { [args.positional!]: state }
    )
    printJson({ ok: true })
  }
)

const balanceCmd = command(
  'balance-map',
  {
    usage: 'balance-map <walletId> [--token-id=<tokenId>]',
    help: 'Show native and exchange balance-map for a wallet (or one token)',
    needsSession: true
  },
  async (ctx, argv) => {
    const args = parseCommandArgs(balanceCmd, argv, {
      positional: 'required',
      flags: { 'token-id': 'string' }
    })
    const sessionId = requireSession(ctx)
    const tokenId = args.string('token-id')
    const result = await ctx.client.get<{
      balances: Array<{ tokenId: string | null }>
    }>(walletPath(sessionId, args.positional!, '/balance-map'))
    if (tokenId == null) {
      printJson(result)
      return
    }
    printJson({
      balances: result.balances.filter(entry => entry.tokenId === tokenId)
    })
  }
)

const txListCmd = command(
  'get-transactions',
  {
    usage:
      'get-transactions <walletId> [--token-id=<id>] [--limit=<n>] [--offset=<n>] [--start-date=<ISO-8601>] [--end-date=<ISO-8601>] [--search-string=<text>] [--fiat=USD] [--export-format=csv,qbo,bitwave] [--out=<path>] [--bitwave-account=<id>]',
    help: 'List or export wallet transactions (JSON by default; CSV/QBO/Bitwave via REST exportFormat)',
    needsSession: true
  },
  async (ctx, argv) => {
    const args = parseCommandArgs(txListCmd, argv, {
      positional: 'required',
      flags: {
        'token-id': 'string',
        limit: 'string',
        offset: 'string',
        'start-date': 'string',
        'end-date': 'string',
        'search-string': 'string',
        fiat: 'string',
        'export-format': 'string',
        out: 'string',
        'bitwave-account': 'string'
      }
    })
    let formats: TxExportFormat[]
    try {
      formats = parseExportFormats(args.string('export-format'))
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error)
      throw new UsageError(txListCmd, message)
    }
    const out = args.string('out')
    if (formats.length > 0 && out == null) {
      throw new UsageError(
        txListCmd,
        '--export-format requires --out=<path> (relative to the current directory or absolute)'
      )
    }
    if (formats.length === 0 && out != null) {
      throw new UsageError(txListCmd, '--out requires --export-format')
    }
    const bitwaveAccount = args.string('bitwave-account')
    if (bitwaveAccount != null && !formats.includes('bitwave')) {
      throw new UsageError(
        txListCmd,
        '--bitwave-account requires bitwave in --export-format'
      )
    }

    const sessionId = requireSession(ctx)
    const query = new URLSearchParams()
    const tokenId = args.string('token-id')
    const limit = args.string('limit')
    const offset = args.string('offset')
    const startDate = args.string('start-date')
    const endDate = args.string('end-date')
    const searchString = args.string('search-string')
    const fiat = args.string('fiat')
    if (tokenId != null) query.set('tokenId', tokenId)
    if (limit != null) query.set('limit', limit)
    if (offset != null) query.set('offset', offset)
    if (startDate != null) query.set('startDate', startDate)
    if (endDate != null) query.set('endDate', endDate)
    if (searchString != null) query.set('searchString', searchString)
    if (fiat != null) query.set('fiat', fiat)
    if (formats.length > 0) query.set('exportFormat', formats.join(','))
    if (bitwaveAccount != null) query.set('bitwaveAccountId', bitwaveAccount)
    const qs = query.toString()
    const result = await ctx.client.get<{
      ok?: boolean
      isoFiat?: string
      total?: number
      transactions?: unknown
      files?: Array<{ format: TxExportFormat; contents: string }>
    }>(
      walletPath(
        sessionId,
        args.positional!,
        `/get-transactions${qs !== '' ? `?${qs}` : ''}`
      )
    )

    if (formats.length === 0 || result.files == null) {
      printJson(result)
      return
    }

    const written = await writeExportFiles(out!, result.files)
    printJson({
      ok: true,
      isoFiat: result.isoFiat,
      total: result.total,
      files: written
    })
  }
)

function resolveUserPath(out: string): string {
  return path.isAbsolute(out) ? out : path.resolve(process.cwd(), out)
}

function exportFilePath(
  out: string,
  format: TxExportFormat,
  count: number
): string {
  const resolved = resolveUserPath(out)
  if (count <= 1) return resolved
  let stem = resolved
  if (stem.endsWith('.bitwave.csv')) {
    stem = stem.slice(0, -'.bitwave.csv'.length)
  } else if (stem.endsWith('.csv')) {
    stem = stem.slice(0, -'.csv'.length)
  } else if (stem.endsWith('.qbo')) {
    stem = stem.slice(0, -'.qbo'.length)
  }
  if (format === 'bitwave') return `${stem}.bitwave.csv`
  if (format === 'qbo') return `${stem}.qbo`
  return `${stem}.csv`
}

async function writeExportFiles(
  out: string,
  files: Array<{ format: TxExportFormat; contents: string }>
): Promise<Array<{ format: TxExportFormat; path: string }>> {
  const written: Array<{ format: TxExportFormat; path: string }> = []
  for (const file of files) {
    const filePath = exportFilePath(out, file.format, files.length)
    await fs.promises.mkdir(path.dirname(filePath), { recursive: true })
    await fs.promises.writeFile(filePath, file.contents, 'utf8')
    written.push({ format: file.format, path: filePath })
  }
  return written
}

const changeEnabledTokenIdsCmd = command(
  'change-enabled-token-ids',
  {
    usage:
      'change-enabled-token-ids <walletId> (--token-ids=<a,b,c> | --add=<id> | --remove=<id>)',
    help: 'Set the wallet\u2019s enabled token set (wallet.changeEnabledTokenIds)',
    needsSession: true
  },
  async (ctx, argv) => {
    const args = parseCommandArgs(changeEnabledTokenIdsCmd, argv, {
      positional: 'required',
      flags: { 'token-ids': 'string', add: 'repeat', remove: 'repeat' }
    })
    const sessionId = requireSession(ctx)
    const walletId = args.positional!
    const listed = args.string('token-ids')
    const added = args.strings('add')
    const removed = args.strings('remove')

    if (listed != null && (added.length > 0 || removed.length > 0)) {
      throw new UsageError(
        changeEnabledTokenIdsCmd,
        '--token-ids cannot be combined with --add or --remove'
      )
    }

    let tokenIds: string[]
    if (listed != null) {
      tokenIds = listed
        .split(',')
        .map(id => id.trim())
        .filter(id => id !== '')
    } else if (added.length > 0 || removed.length > 0) {
      // --add / --remove are client-side sugar: core only has a full setter,
      // so read the current set first and send back the whole list.
      const current = await ctx.client.get<{ enabledTokenIds: string[] }>(
        walletPath(sessionId, walletId, '/tokens')
      )
      const next = new Set(current.enabledTokenIds)
      for (const id of added) next.add(id)
      for (const id of removed) next.delete(id)
      tokenIds = [...next]
    } else {
      throw new UsageError(
        changeEnabledTokenIdsCmd,
        'Provide --token-ids, --add, or --remove'
      )
    }

    printJson(
      await ctx.client.post(
        walletPath(sessionId, walletId, '/change-enabled-token-ids'),
        { tokenIds }
      )
    )
  }
)
