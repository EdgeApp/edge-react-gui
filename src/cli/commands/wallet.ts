import fs from 'fs'
import path from 'path'

import {
  parseExportFormats,
  TX_EXPORT_FORMAT_INFO,
  TX_EXPORT_SUFFIXES,
  type TxExportFormat
} from '../../util/txExport'
import { ApiClientError } from '../client/apiClient'
import { printJson } from '../client/output'
import {
  nextEnabledTokenIds,
  readBalances,
  readEnabledTokens,
  readExportedFiles
} from '../clientResponses'
import { command, requireSession, UsageError } from '../command'
import { parseCommandArgs, parseJsonFlag } from '../commandArgs'
import { errorMessage } from '../engine/errors'
import { accountPath, walletPath } from './paths'

const walletStateCmd = command(
  'change-wallet-states',
  {
    usage:
      "change-wallet-states --wallet-id=<id> [--archived=true|false] [--deleted=true|false] [--hidden=true|false] [--sort-index=N] | change-wallet-states --wallet-states='<json>'",
    needsSession: true
  },
  async (ctx, argv) => {
    const args = parseCommandArgs(walletStateCmd, argv, {
      flags: {
        'wallet-id': 'string',
        archived: 'boolstr',
        deleted: 'boolstr',
        hidden: 'boolstr',
        'sort-index': 'string',
        // The route's own body field, published in the usage line and
        // refused by this parser until now. Every other route whose body is
        // a structured value offers the same escape hatch —
        // `--spend-info`, `--lobby-request`, `--transaction` — and it is
        // the only way to change several wallets in one call, which is what
        // `EdgeWalletStates` is for.
        'wallet-states': 'string'
      }
    })
    const rawStates = args.string('wallet-states')
    if (rawStates != null) {
      const whole = parseJsonFlag(rawStates, 'wallet-states', walletStateCmd)
      // Every flag of the other form, not only `--wallet-id`. Refusing that
      // one and returning meant `--archived`, `--deleted`, `--hidden` and
      // `--sort-index` given beside the map were silently dropped — the map
      // applied and the flags ignored with no diagnostic, which is the
      // contradictory pair the engine side refuses rather than ranks.
      const alongside = [
        'wallet-id',
        'archived',
        'deleted',
        'hidden',
        'sort-index'
      ].filter(flag => args.string(flag) != null)
      if (alongside.length > 0) {
        throw new UsageError(
          walletStateCmd,
          `--wallet-states is the whole map; drop ${alongside
            .map(flag => `--${flag}`)
            .join(', ')}`
        )
      }
      const sessionId = requireSession(ctx)
      await ctx.client.post(accountPath(sessionId, '/change-wallet-states'), {
        walletStates: whole
      })
      printJson({ ok: true })
      return
    }
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
    await ctx.client.post(accountPath(sessionId, '/change-wallet-states'), {
      walletStates: { [args.requireString('wallet-id')]: state }
    })
    printJson({ ok: true })
  }
)

const balanceCmd = command(
  'balance-map',
  {
    usage: 'balance-map --wallet-id=<id> [--token-id=<tokenId>]',
    needsSession: true
  },
  async (ctx, argv) => {
    const args = parseCommandArgs(balanceCmd, argv, {
      flags: { 'wallet-id': 'string', 'token-id': 'string' }
    })
    const sessionId = requireSession(ctx)
    const tokenId = args.string('token-id')
    const raw = await ctx.client.get(
      walletPath(sessionId, '/balance-map') +
        `?walletId=${encodeURIComponent(args.requireString('wallet-id'))}`
    )
    if (tokenId == null) {
      printJson(raw)
      return
    }
    // Cleaned, because this arm acts on the answer: a cast made a missing
    // `balances` an `undefined.filter` deep in the client rather than a
    // named version-skew failure.
    const result = readBalances(raw, 'balance-map')
    const balances = result.balances.filter(entry => entry.tokenId === tokenId)
    if (balances.length === 0) {
      // A filter that matches nothing answered `{"balances": []}` and exit
      // 0, so a script could not tell "no such token on this wallet" from
      // "zero balance" — the same silent-wrong-answer shape
      // `change-enabled-token-ids` had, where a mistyped contract address
      // was a no-op. `wallet.balanceMap` carries every asset the wallet
      // tracks, including an enabled token sitting at zero and one whose
      // config the plugin no longer has, so an empty result means the
      // wallet does not track this asset at all.
      throw new ApiClientError({
        code: 'TOKEN_NOT_FOUND',
        message:
          `This wallet has no asset with tokenId "${tokenId}". ` +
          '`wallet-tokens` lists the ones it tracks; omit --token-id for ' +
          'every balance, including the chain’s own coin.',
        status: 404,
        details: { tokenId }
      })
    }
    printJson({ balances })
  }
)

/** `get-transactions` flags that pass straight through as query fields. */
const PASS_THROUGH_QUERY: Array<[flag: string, field: string]> = [
  ['token-id', 'tokenId'],
  ['limit', 'limit'],
  ['offset', 'offset'],
  ['start-date', 'startDate'],
  ['end-date', 'endDate'],
  ['search-string', 'searchString'],
  ['spam-threshold', 'spamThreshold'],
  ['fiat', 'fiat']
]

const txListCmd = command(
  'get-transactions',
  {
    usage:
      'get-transactions --wallet-id=<id> [--token-id=<id>] [--limit=<n>] [--offset=<n>] [--start-date=<ISO-8601>] [--end-date=<ISO-8601>] [--search-string=<text>] [--spam-threshold=<n>] [--fiat=USD] [--export-format=csv,qbo,bitwave] [--out=<path>] [--bitwave-account=<id>] [--save-export-prefs]',
    needsSession: true
  },
  async (ctx, argv) => {
    const args = parseCommandArgs(txListCmd, argv, {
      flags: {
        'wallet-id': 'string',
        'token-id': 'string',
        limit: 'string',
        offset: 'string',
        'start-date': 'string',
        'end-date': 'string',
        'search-string': 'string',
        'spam-threshold': 'string',
        fiat: 'string',
        'export-format': 'string',
        out: 'string',
        'bitwave-account': 'string',
        // Both were advertised by `edge-cli help get-transactions`, which is
        // generated from the route declaration, and refused here, which is
        // hand-written — so the one branch that writes the wallet's synced
        // `exportTxInfo.json` had no reachable caller at all.
        'save-export-prefs': 'boolean'
      }
    })
    let formats: TxExportFormat[]
    try {
      formats = parseExportFormats(args.string('export-format'))
    } catch (error: unknown) {
      const message = errorMessage(error)
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
    query.set('walletId', args.requireString('wallet-id'))
    // One list, so a flag and the query field it fills are declared
    // together. They were nine `const` declarations and, eleven lines later,
    // nine `if (x != null) query.set(…)` statements — a flag→field mapping
    // that existed only as the pairing of two blocks, where a renamed flag
    // with its second edit missed drops the value in silence.
    for (const [flag, field] of PASS_THROUGH_QUERY) {
      const value = args.string(flag)
      if (value != null) query.set(field, value)
    }
    // The three that are not a pass-through: a parsed list, a flag with a
    // cross-check above, and a boolean the route reads as text.
    if (formats.length > 0) query.set('exportFormat', formats.join(','))
    if (bitwaveAccount != null) query.set('bitwaveAccountId', bitwaveAccount)
    if (args.boolean('save-export-prefs')) {
      query.set('saveExportPrefs', 'true')
    }
    const qs = query.toString()
    const result = await ctx.client.get<{
      ok?: boolean
      isoFiat?: string
      total?: number
      transactions?: unknown
      files?: unknown
    }>(walletPath(sessionId, '/get-transactions') + `?${qs}`)

    if (formats.length === 0 || result.files == null) {
      printJson(result)
      return
    }

    // Cleaned before anything is written: each `contents` goes to a path
    // built from its `format`, on the user's disk.
    const { files } = readExportedFiles(result, 'get-transactions')
    const written = await writeExportFiles(out!, files)
    printJson({
      ok: true,
      isoFiat: result.isoFiat,
      total: result.total,
      files: written
    })
  }
)

function exportFilePath(
  out: string,
  format: TxExportFormat,
  count: number
): string {
  // `path.resolve` already ignores the cwd for an absolute input, so the
  // `isAbsolute` branch the helper here used to take only skipped
  // normalising a path that was already absolute.
  const resolved = path.resolve(out)
  if (count <= 1) return resolved
  // The suffixes come from `TX_EXPORT_FORMAT_INFO`, which is keyed by
  // `TxExportFormat`: this used to strip three of them in an `else if` chain
  // and re-add them from two `if`s and a trailing `return`, so a fourth
  // format — accepted by `asTxExportFormat` everywhere — was written with a
  // `.csv` name. Longest first, so `.bitwave.csv` is matched before `.csv`.
  let stem = resolved
  for (const suffix of TX_EXPORT_SUFFIXES) {
    if (stem.endsWith(suffix)) {
      stem = stem.slice(0, -suffix.length)
      break
    }
  }
  return `${stem}${TX_EXPORT_FORMAT_INFO[format].suffix}`
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
      'change-enabled-token-ids --wallet-id=<id> (--token-ids=<a,b,c> | --add=<id> … | --remove=<id> … | --disable-all)',
    needsSession: true
  },
  async (ctx, argv) => {
    const args = parseCommandArgs(changeEnabledTokenIdsCmd, argv, {
      flags: {
        'wallet-id': 'string',
        'token-ids': 'string',
        add: 'repeat',
        remove: 'repeat',
        'disable-all': 'boolean'
      }
    })
    const sessionId = requireSession(ctx)
    const walletId = args.requireString('wallet-id')
    const listed = args.string('token-ids')
    const added = args.strings('add')
    const removed = args.strings('remove')
    const disableAll = args.boolean('disable-all')

    const chosen = [
      listed != null ? '--token-ids' : null,
      added.length > 0 ? '--add' : null,
      removed.length > 0 ? '--remove' : null,
      disableAll ? '--disable-all' : null
    ].filter((name): name is string => name != null)
    // `--add` and `--remove` combine with each other and with nothing else;
    // the other two each name the whole set.
    const exclusive = chosen.filter(
      name => name !== '--add' && name !== '--remove'
    )
    if (exclusive.length > 1 || (exclusive.length === 1 && chosen.length > 1)) {
      throw new UsageError(
        changeEnabledTokenIdsCmd,
        `${chosen.join(' and ')} cannot be combined: each names the ` +
          'complete desired set, or changes it.'
      )
    }

    let tokenIds: string[]
    if (disableAll) {
      // The empty set, which is what "disable every token on this wallet"
      // means for an absolute setter — and which had no spelling at all:
      // `--token-ids=` is refused, because an empty flag value is a
      // forgotten value everywhere else in this CLI, and `--token-ids=,`
      // works but reads as a typo.
      tokenIds = []
    } else if (listed != null) {
      tokenIds = listed
        .split(',')
        .map(id => id.trim())
        .filter(id => id !== '')
    } else if (added.length > 0 || removed.length > 0) {
      // --add / --remove are client-side sugar: core only has a full setter,
      // so read the current set first and send back the whole list.
      // Cleaned, not cast. The body below is the *complete desired set*, so
      // an `enabledTokenIds` that did not arrive used to make
      // `new Set(undefined)` — an empty set, not a throw — and `--add X`
      // replaced every enabled asset on the wallet with `X` in the
      // account's synced wallet file, on every device.
      const current = readEnabledTokens(
        await ctx.client.get(
          walletPath(sessionId, '/tokens') +
            `?walletId=${encodeURIComponent(walletId)}`
        ),
        'tokens'
      )
      tokenIds = nextEnabledTokenIds(current.enabledTokenIds, added, removed)
    } else {
      throw new UsageError(
        changeEnabledTokenIdsCmd,
        'Provide --token-ids, --add, --remove, or --disable-all'
      )
    }

    printJson(
      await ctx.client.post(
        walletPath(sessionId, '/change-enabled-token-ids'),
        { walletId, tokenIds }
      )
    )
  }
)
