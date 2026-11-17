import { mul } from 'biggystring'
import type {
  EdgeAccount,
  EdgeCurrencyWallet,
  EdgeMemo,
  EdgeSpendInfo,
  EdgeTransaction,
  EdgeTxActionFiat
} from 'edge-core-js'
import { base16, base64 } from 'rfc4648'
import { sprintf } from 'sprintf-js'

import { showButtonsModal } from '../../../components/modals/ButtonsModal'
import {
  showError,
  showToast
} from '../../../components/services/AirshipInstance'
import { lstrings } from '../../../locales/strings'
import { getExchangeDenom } from '../../../selectors/DenominationSelectors'
import { CryptoAmount } from '../../../util/CryptoAmount'
import { snooze } from '../../../util/utils'
import { waitForWalletOtherMethods } from '../../../util/waitForWalletOtherMethods'
import {
  SendErrorBackPressed,
  SendErrorNoTransaction
} from '../../gui/fiatPlugin'
import { isWalletTestnet } from '../../gui/pluginUtils'
import type { RampPluginConfig } from '../rampPluginTypes'
import { updateTransfer } from './moneygramStore'
import type { MoneygramTransfer, Sep24Transaction } from './moneygramTypes'
import { getStellarAccount } from './sep10'
import { anchorPageUrl, isTerminalStatus, makeSep24Api } from './sep24Api'

export const MONEYGRAM_PLUGIN_ID = 'moneygram'
export const MONEYGRAM_DISPLAY_NAME = 'MoneyGram'

const POLL_MS = 5000
const WATCH_LIMIT_MS = 2 * 60 * 60 * 1000
const TAG_ATTEMPTS = 12

export type TransferContext = Pick<
  RampPluginConfig,
  'account' | 'navigation' | 'onLogEvent' | 'store'
>

export interface WatchOptions {
  /**
   * True when the send scene should wait for the user to agree, such as for
   * a transfer resumed at login or one whose anchor page the user closed.
   */
  askBeforeSend: () => boolean
  /** Closes the anchor's interactive page, if it is still showing. */
  closeWebView?: () => void
}

// One poller per anchor transaction, shared by the quote flow and resume.
// Each entry keeps the account that started it, so a poller left over from
// a logged-out account never blocks the next login's:
const activeWatches = new Map<string, EdgeAccount>()

// Withdraws take turns at the send prompt and scene, so transfers resumed
// together never stack modals or replace each other's send scene. Keyed by
// account, so a send left hanging at logout never blocks the next login:
const sendQueues = new WeakMap<EdgeAccount, Promise<unknown>>()

async function withSendTurn<T>(
  account: EdgeAccount,
  task: () => Promise<T>
): Promise<T> {
  const previous = sendQueues.get(account) ?? Promise.resolve()
  const turn = previous.then(task, task)
  sendQueues.set(
    account,
    turn.catch(() => {})
  )
  return await turn
}

/**
 * Follows one anchor transaction until it finishes, saving each new status.
 * A withdraw that is waiting for funds opens the send scene, and a finished
 * deposit tags the incoming transaction as a buy.
 */
export async function watchTransfer(
  context: TransferContext,
  initial: MoneygramTransfer,
  options: WatchOptions
): Promise<void> {
  const { account } = context
  const owner = activeWatches.get(initial.id)
  if (owner?.loggedIn === true) return
  activeWatches.set(initial.id, account)
  try {
    await runWatch(context, initial, options)
  } finally {
    if (activeWatches.get(initial.id) === account) {
      activeWatches.delete(initial.id)
    }
  }
}

async function runWatch(
  context: TransferContext,
  initial: MoneygramTransfer,
  options: WatchOptions
): Promise<void> {
  const { account, store } = context
  if (!account.activeWalletIds.includes(initial.walletId)) return
  const wallet = await account.waitForCurrencyWallet(initial.walletId)
  // SEP-10 signs with an engine method, which a cached wallet lacks at first:
  await waitForWalletOtherMethods(wallet)
  const api = makeSep24Api(wallet, initial.anchor)

  // A deposit resumed only for its buy tag already logged and showed its end:
  const alreadyFinished = isTerminalStatus(initial.status)
  let transfer = initial
  let payoutWaits = 0
  // A send that failed to broadcast asks before it opens the send scene again:
  let sendFailed = false
  const deadline = Date.now() + WATCH_LIMIT_MS
  // A logout stops the poller, and the next login resumes the transfer:
  while (account.loggedIn && Date.now() < deadline) {
    let anchorTx: Sep24Transaction
    try {
      anchorTx = await api.getTransaction(transfer.id)
    } catch (error: unknown) {
      console.warn(`MoneyGram: polling ${transfer.id} failed`, error)
      await snooze(POLL_MS)
      continue
    }
    if (!account.loggedIn) return

    if (anchorTx.status !== transfer.status) {
      transfer = await updateTransfer(store, transfer, {
        status: anchorTx.status
      })
    }

    // The anchor can report the status a moment before it fills in where
    // to pay, so a withdraw keeps polling until both are there:
    if (
      transfer.direction === 'sell' &&
      anchorTx.status === 'pending_user_transfer_start' &&
      transfer.sendTxid == null &&
      hasPaymentInstructions(anchorTx)
    ) {
      // A payment that went out before its txid was saved is already in
      // the wallet, and paying again would send the money twice:
      const sentTxid = await findSentPayment(wallet, transfer)
      if (!account.loggedIn) return
      const sent =
        sentTxid != null
          ? { txid: sentTxid }
          : await withSendTurn<SendResult>(account, async () =>
              // A logout while this waited its turn puts the send off:
              account.loggedIn
                ? await sendToAnchor(context, wallet, transfer, anchorTx, {
                    ...options,
                    askBeforeSend: () => sendFailed || options.askBeforeSend()
                  })
                : 'later'
            )
      if (!account.loggedIn) return
      // Put off by the user, so the next login asks again:
      if (sent === 'later') return
      if (sent === 'failed') {
        sendFailed = true
        await snooze(POLL_MS)
        continue
      }
      transfer = await updateTransfer(store, transfer, { sendTxid: sent.txid })
    }

    if (
      transfer.direction === 'buy' &&
      anchorTx.status === 'completed' &&
      transfer.taggedTxid == null
    ) {
      // The anchor can mark a deposit complete a moment before it reports
      // the payout transaction, so give it a few polls to fill that in:
      if (
        anchorTx.stellar_transaction_id == null &&
        payoutWaits < TAG_ATTEMPTS
      ) {
        ++payoutWaits
        await snooze(POLL_MS)
        continue
      }
      const txid = await tagDeposit(account, wallet, transfer, anchorTx)
      if (!account.loggedIn) return
      if (txid != null) {
        transfer = await updateTransfer(store, transfer, { taggedTxid: txid })
      }
      if (!alreadyFinished) logBuy(context, wallet, transfer, anchorTx)
    }

    if (isTerminalStatus(anchorTx.status)) {
      if (!alreadyFinished) showOutcome(transfer, anchorTx)
      return
    }
    await snooze(POLL_MS)
  }
}

type Sep24PaymentInstructions = Sep24Transaction & {
  amount_in: string
  withdraw_anchor_account: string
  withdraw_memo: string
}

/**
 * True once the anchor says where and how much to pay. The memo is required
 * too: anchors match payments to a shared account by memo, so a payment
 * sent before the memo shows up could never be credited.
 */
export function hasPaymentInstructions(
  anchorTx: Sep24Transaction
): anchorTx is Sep24PaymentInstructions {
  return (
    anchorTx.amount_in != null &&
    anchorTx.withdraw_anchor_account != null &&
    anchorTx.withdraw_memo != null
  )
}

/**
 * The txid of a withdraw payment the wallet already broadcast, found by the
 * order id the send saved on the transaction.
 */
export async function findSentPayment(
  wallet: EdgeCurrencyWallet,
  transfer: MoneygramTransfer
): Promise<string | undefined> {
  const txs = await wallet.getTransactions({ tokenId: transfer.tokenId })
  const sent = txs.find(
    tx =>
      tx.savedAction?.actionType === 'fiat' &&
      tx.savedAction.fiatPlugin.providerId === MONEYGRAM_PLUGIN_ID &&
      tx.savedAction.orderId === transfer.id
  )
  return sent?.txid
}

/**
 * How a withdraw payment ended: broadcast, put off by the user, or failed
 * to go out.
 */
type SendResult = { txid: string } | 'later' | 'failed'

/**
 * Pays the anchor for a withdraw through the send scene, with the anchor's
 * address, amount and memo locked in.
 */
async function sendToAnchor(
  context: TransferContext,
  wallet: EdgeCurrencyWallet,
  transfer: MoneygramTransfer,
  anchorTx: Sep24PaymentInstructions,
  options: WatchOptions
): Promise<SendResult> {
  const { navigation, onLogEvent } = context
  const { tokenId } = transfer
  const {
    amount_in: amountIn,
    withdraw_anchor_account: anchorAccount,
    withdraw_memo: memo,
    withdraw_memo_type: memoType
  } = anchorTx

  const currencyCode =
    tokenId == null
      ? wallet.currencyInfo.currencyCode
      : wallet.currencyConfig.allTokens[tokenId]?.currencyCode ?? ''
  if (options.askBeforeSend()) {
    const answer = await showButtonsModal({
      title: lstrings.moneygram_send_title,
      message: sprintf(
        lstrings.moneygram_send_message_2s,
        `${amountIn} ${currencyCode}`,
        anchorAccount
      ),
      buttons: {
        send: { label: lstrings.fragment_send_subtitle },
        later: { label: lstrings.not_now_button }
      }
    })
    if (answer !== 'send') return 'later'
  }
  options.closeWebView?.()

  const { multiplier } = getExchangeDenom(wallet.currencyConfig, tokenId)
  const nativeAmount = mul(amountIn, multiplier)
  const savedAction: EdgeTxActionFiat = {
    actionType: 'fiat',
    orderId: transfer.id,
    orderUri: anchorPageUrl(anchorTx.more_info_url, transfer.anchor),
    isEstimate: true,
    fiatPlugin: {
      providerId: MONEYGRAM_PLUGIN_ID,
      providerDisplayName: MONEYGRAM_DISPLAY_NAME
    },
    payinAddress: anchorAccount,
    cryptoAsset: {
      pluginId: wallet.currencyInfo.pluginId,
      tokenId,
      nativeAmount
    },
    fiatAsset: {
      fiatCurrencyCode: transfer.fiatCurrencyCode,
      fiatAmount: anchorTx.amount_out ?? '0'
    }
  }
  const spendInfo: EdgeSpendInfo = {
    tokenId,
    assetAction: { assetActionType: 'sell' },
    savedAction,
    spendTargets: [{ nativeAmount, publicAddress: anchorAccount }],
    memos: [toEdgeMemo(memo, memoType)]
  }

  try {
    // The send scene closes itself before it reports the broadcast:
    const tx = await new Promise<EdgeTransaction>((resolve, reject) => {
      navigation.navigate('send2', {
        walletId: wallet.id,
        tokenId,
        spendInfo,
        lockTilesMap: { address: true, amount: true, memo: true, wallet: true },
        onDone: (error: Error | null, edgeTransaction?: EdgeTransaction) => {
          if (error != null) reject(error)
          else if (edgeTransaction != null) resolve(edgeTransaction)
          else reject(new Error(SendErrorNoTransaction))
        },
        onBack: () => {
          reject(new Error(SendErrorBackPressed))
        }
      })
    })

    if (!isWalletTestnet(wallet)) {
      onLogEvent('Sell_Success', {
        conversionValues: {
          conversionType: 'sell',
          destFiatAmount: anchorTx.amount_out ?? '0',
          destFiatCurrencyCode: transfer.fiatCurrencyCode,
          sourceAmount: new CryptoAmount({
            currencyConfig: wallet.currencyConfig,
            tokenId,
            exchangeAmount: amountIn
          }),
          fiatProviderId: MONEYGRAM_PLUGIN_ID,
          orderId: transfer.id
        }
      })
    }
    return { txid: tx.txid }
  } catch (error: unknown) {
    if (error instanceof Error && error.message === SendErrorBackPressed) {
      showToast(lstrings.moneygram_send_later)
      return 'later'
    }
    if (error instanceof Error && error.message === SendErrorNoTransaction) {
      showToast(lstrings.fiat_plugin_sell_failed_to_send_try_again)
    } else {
      showError(error)
    }
    return 'failed'
  }
}

/** Converts a SEP-24 withdraw memo into the memo the Stellar engine sends. */
export function toEdgeMemo(
  memo: string,
  memoType: Sep24Transaction['withdraw_memo_type']
): EdgeMemo {
  switch (memoType) {
    case 'id':
      return { type: 'number', memoName: 'memo_id', value: memo }
    case 'hash':
      // SEP-24 sends hash memos as base64; the engine takes hex:
      return {
        type: 'hex',
        memoName: 'memo_hash',
        value: base16.stringify(base64.parse(memo)).toLowerCase()
      }
    default:
      return { type: 'text', memoName: 'memo_text', value: memo }
  }
}

/**
 * Marks the anchor's payment to this wallet as a MoneyGram buy. The wallet
 * may not have seen the payment yet, so this retries for a minute.
 */
async function tagDeposit(
  account: EdgeAccount,
  wallet: EdgeCurrencyWallet,
  transfer: MoneygramTransfer,
  anchorTx: Sep24Transaction
): Promise<string | undefined> {
  const txid = anchorTx.stellar_transaction_id
  if (txid == null) return
  const { tokenId } = transfer

  // A logout ends the retries, so no tag lands on the old account's wallet:
  for (let attempt = 0; attempt < TAG_ATTEMPTS && account.loggedIn; ++attempt) {
    const txs = await wallet.getTransactions({ tokenId })
    if (!account.loggedIn) return
    const tx = txs.find(tx => tx.txid.toLowerCase() === txid.toLowerCase())
    if (tx != null) {
      await wallet.saveTxAction({
        txid: tx.txid,
        tokenId,
        assetAction: { assetActionType: 'buy' },
        savedAction: {
          actionType: 'fiat',
          orderId: transfer.id,
          orderUri: anchorPageUrl(anchorTx.more_info_url, transfer.anchor),
          isEstimate: false,
          fiatPlugin: {
            providerId: MONEYGRAM_PLUGIN_ID,
            providerDisplayName: MONEYGRAM_DISPLAY_NAME
          },
          // An engine may leave the receive addresses empty, and a Stellar
          // wallet only has the one account:
          payoutAddress:
            tx.ourReceiveAddresses[0] ?? (await getStellarAccount(wallet)),
          cryptoAsset: {
            pluginId: wallet.currencyInfo.pluginId,
            tokenId,
            nativeAmount: tx.nativeAmount
          },
          fiatAsset: {
            fiatCurrencyCode: transfer.fiatCurrencyCode,
            fiatAmount: anchorTx.amount_in ?? '0'
          }
        }
      })
      return tx.txid
    }
    await snooze(POLL_MS)
  }
}

function logBuy(
  context: TransferContext,
  wallet: EdgeCurrencyWallet,
  transfer: MoneygramTransfer,
  anchorTx: Sep24Transaction
): void {
  if (isWalletTestnet(wallet) || anchorTx.amount_out == null) return
  context.onLogEvent('Buy_Success', {
    conversionValues: {
      conversionType: 'buy',
      sourceFiatAmount: anchorTx.amount_in ?? '0',
      sourceFiatCurrencyCode: transfer.fiatCurrencyCode,
      destAmount: new CryptoAmount({
        currencyConfig: wallet.currencyConfig,
        tokenId: transfer.tokenId,
        exchangeAmount: anchorTx.amount_out
      }),
      fiatProviderId: MONEYGRAM_PLUGIN_ID,
      orderId: transfer.id
    }
  })
}

function showOutcome(
  transfer: MoneygramTransfer,
  anchorTx: Sep24Transaction
): void {
  if (anchorTx.status === 'completed') {
    showToast(
      transfer.direction === 'buy'
        ? lstrings.moneygram_deposit_complete
        : lstrings.moneygram_withdraw_complete
    )
    return
  }
  showError(
    new Error(
      sprintf(
        lstrings.moneygram_transfer_failed_2s,
        anchorTx.status,
        anchorTx.message ?? ''
      )
    )
  )
}
