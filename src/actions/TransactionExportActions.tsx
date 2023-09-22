import { abs, add, div, gt, lt, mul } from 'biggystring'
import csvStringify from 'csv-stringify/lib/browser/sync'
import { EdgeCurrencyWallet, EdgeTransaction } from 'edge-core-js'
import shajs from 'sha.js'

import { getExchangeDenomination } from '../selectors/DenominationSelectors'
import { ThunkAction } from '../types/reduxTypes'
import { getHistoricalRate } from '../util/exchangeRates'
import { DECIMAL_PRECISION } from '../util/utils'

const UPDATE_TXS_MAX_PROMISES = 10

export async function exportTransactionsToQBO(
  wallet: EdgeCurrencyWallet,
  txs: EdgeTransaction[],
  currencyCode: string,
  denomination?: string
): Promise<string> {
  return exportTransactionsToQBOInner(txs, currencyCode, wallet.fiatCurrencyCode, denomination, Date.now())
}

export async function exportTransactionsToCSV(
  wallet: EdgeCurrencyWallet,
  txs: EdgeTransaction[],
  currencyCode: string,
  denomination?: string
): Promise<string> {
  let denomName = ''
  if (denomination != null) {
    const denomObj = wallet.currencyInfo.denominations.find(edgeDenom => edgeDenom.multiplier === denomination)
    if (denomObj != null) denomName = denomObj.name
  }
  return exportTransactionsToCSVInner(txs, currencyCode, wallet.fiatCurrencyCode, denomination, denomName)
}

export function updateTxsFiat(wallet: EdgeCurrencyWallet, currencyCode: string, txs: EdgeTransaction[]): ThunkAction<Promise<void>> {
  return async (dispatch, getState) => {
    const state = getState()
    const exchangeDenom = getExchangeDenomination(state, wallet.currencyInfo.pluginId, currencyCode)
    const { fiatCurrencyCode } = wallet

    let promises: Array<Promise<void>> = []
    for (const tx of txs) {
      if ((tx.metadata?.amountFiat ?? 0) === 0) {
        const date = new Date(tx.date * 1000).toISOString()
        promises.push(
          getHistoricalRate(`${currencyCode}_${fiatCurrencyCode}`, date)
            .then(rate => {
              if (tx.metadata == null) {
                tx.metadata = {}
              }
              tx.metadata.amountFiat = rate * Number(div(tx.nativeAmount, exchangeDenom.multiplier, DECIMAL_PRECISION))
            })
            .catch(e => console.warn(e.message))
        )
        if (promises.length >= UPDATE_TXS_MAX_PROMISES) {
          await Promise.all(promises)
          promises = []
        }
      }
    }
    if (promises.length > 0) {
      await Promise.all(promises)
    }
  }
}

function padZero(val: string): string {
  if (val.length === 1) {
    return '0' + val
  }
  return val
}

function escapeOFXString(str: string): string {
  str = str.replace(/&/g, '&amp;')
  str = str.replace(/>/g, '&gt;')
  return str.replace(/</g, '&lt;')
}

function exportOfxHeader(inputObj: any): string {
  let out = ''
  for (const key of Object.keys(inputObj)) {
    let element = inputObj[key]
    if (typeof element === 'string') {
      element = escapeOFXString(element)
      out += `${key}:${element}\n`
    } else {
      throw new Error('Invalid OFX header')
    }
  }
  return out
}

function exportOfxBody(inputObj: any): string {
  let out = ''
  for (const key of Object.keys(inputObj)) {
    let element = inputObj[key]
    if (typeof element === 'string') {
      element = escapeOFXString(element)
      out += `<${key}>${element}\n`
    } else if (element instanceof Array) {
      for (const a of element) {
        out += `<${key}>\n`
        out += exportOfxBody(a)
        out += `</${key}>\n`
      }
    } else if (typeof element === 'object') {
      out += `<${key}>\n`
      out += exportOfxBody(element)
      out += `</${key}>\n`
    } else {
      throw new Error('Invalid OFX body')
    }
  }
  return out
}

function exportOfx(header: any, body: any): string {
  let out = exportOfxHeader(header) + '\n'
  out += '<OFX>\n'
  out += exportOfxBody(body)
  out += '</OFX>\n'
  return out
}

function makeOfxDate(date: number): string {
  const d = new Date(date * 1000)
  const yyyy = d.getUTCFullYear().toString()
  const mm = padZero((d.getUTCMonth() + 1).toString())
  const dd = padZero(d.getUTCDate().toString())
  const hh = padZero(d.getUTCHours().toString())
  const min = padZero(d.getUTCMinutes().toString())
  const ss = padZero(d.getUTCSeconds().toString())
  return `${yyyy}${mm}${dd}${hh}${min}${ss}.000`
}

function makeCsvDateTime(date: number): { date: string; time: string } {
  const d = new Date(date * 1000)
  const yyyy = d.getUTCFullYear().toString()
  const mm = padZero((d.getUTCMonth() + 1).toString())
  const dd = padZero(d.getUTCDate().toString())
  const hh = padZero(d.getUTCHours().toString())
  const min = padZero(d.getUTCMinutes().toString())

  return {
    date: `${yyyy}-${mm}-${dd}`,
    time: `${hh}:${min}`
  }
}

function makeBitwaveDateTime(date: number): string {
  const d = new Date(date * 1000)
  const yy = d.getUTCFullYear().toString().slice(-2)
  const mm = padZero((d.getUTCMonth() + 1).toString())
  const dd = padZero(d.getUTCDate().toString())
  const hh = padZero(d.getUTCHours().toString())
  const min = padZero(d.getUTCMinutes().toString())

  return `${mm}/${dd}/${yy} ${hh}:${min}`
}

//
// Check if tx is
// 1. A transfer
// 2. Outgoing spend
// 3. Has a network fee
// If so:
//  1. Modify transaction to reduce the nativeAmount by the networkFee
//  2. Set networkFee to 0
//  3. Return a new transaction that has:
//      1. nativeAmount and networkFee set to original tx fee
//      2. category set to 'Expense:Network Fee'
//      3. txid set to old txid + '-TRANSFER_TX'

export function getTransferTx(oldEdgeTransaction: EdgeTransaction): EdgeTransaction[] | null {
  const edgeTransaction = { ...oldEdgeTransaction }
  edgeTransaction.metadata = { ...oldEdgeTransaction.metadata }

  const category = edgeTransaction.metadata?.category ?? ''
  if (!category.toLowerCase().startsWith('transfer:')) return null
  if (!lt(edgeTransaction.nativeAmount, '0')) return null
  if (!gt(edgeTransaction.networkFee, '0')) return null

  const nativeAmountNoFee = add(edgeTransaction.nativeAmount, edgeTransaction.networkFee)
  let newTxFiatFee = 0
  let amountFiat = edgeTransaction.metadata?.amountFiat ?? 0

  if (amountFiat > 0) {
    const exchangeRate: string = div(amountFiat.toString(), edgeTransaction.nativeAmount, 16)
    const newTxFiatFeeString: string = mul(exchangeRate, edgeTransaction.networkFee)
    newTxFiatFee = Math.abs(Number(newTxFiatFeeString))
    amountFiat = Number(mul(exchangeRate, nativeAmountNoFee))
  }

  const newEdgeTransaction: EdgeTransaction = { ...edgeTransaction }
  newEdgeTransaction.nativeAmount = `-${edgeTransaction.networkFee}`
  newEdgeTransaction.metadata = { ...edgeTransaction.metadata }
  newEdgeTransaction.metadata.category = `Expense:Network Fee`
  newEdgeTransaction.metadata.amountFiat = newTxFiatFee
  newEdgeTransaction.txid += '-TRANSFER_TX'
  edgeTransaction.nativeAmount = nativeAmountNoFee
  edgeTransaction.networkFee = '0'
  edgeTransaction.metadata.amountFiat = amountFiat
  return [edgeTransaction, newEdgeTransaction]
}

export function exportTransactionsToQBOInner(
  edgeTransactions: EdgeTransaction[],
  currencyCode: string,
  fiatCurrencyCode: string,
  denom: string | undefined,
  dateNow: number
): string {
  const STMTTRN: any[] = []
  const now = makeOfxDate(dateNow / 1000)

  for (const tx of edgeTransactions) {
    const newTxs = getTransferTx(tx)
    if (newTxs != null) {
      edgeTxToQbo(newTxs[0])
      edgeTxToQbo(newTxs[1])
    } else {
      edgeTxToQbo(tx)
    }
  }

  function edgeTxToQbo(edgeTx: EdgeTransaction) {
    const TRNAMT: string = denom ? div(edgeTx.nativeAmount, denom, DECIMAL_PRECISION) : edgeTx.nativeAmount
    const TRNTYPE = lt(edgeTx.nativeAmount, '0') ? 'DEBIT' : 'CREDIT'
    const DTPOSTED = makeOfxDate(edgeTx.date)
    let NAME: string = ''
    let amountFiat: number = 0
    let category: string = ''
    let notes: string = ''
    if (edgeTx.metadata) {
      NAME = edgeTx.metadata.name ? edgeTx.metadata.name : ''
      amountFiat = edgeTx.metadata.amountFiat ? edgeTx.metadata.amountFiat : 0
      category = edgeTx.metadata.category ? edgeTx.metadata.category : ''
      notes = edgeTx.metadata.notes ? edgeTx.metadata.notes : ''
    }
    const absFiat = abs(amountFiat.toString())
    const absAmount = abs(TRNAMT)
    const CURRATE = absAmount !== '0' ? div(absFiat, absAmount, 8) : '0'
    let memo = `// Rate=${CURRATE} ${fiatCurrencyCode}=${amountFiat} category="${category}" memo="${notes}"`
    if (memo.length > 250) {
      memo = memo.substring(0, 250) + '...'
    }
    const qboTxNamed = {
      TRNTYPE,
      DTPOSTED,
      TRNAMT,
      FITID: edgeTx.txid,
      NAME,
      MEMO: memo,
      CURRENCY: {
        CURRATE: CURRATE,
        CURSYM: fiatCurrencyCode
      }
    }
    const qboTx = {
      TRNTYPE,
      DTPOSTED,
      TRNAMT,
      FITID: edgeTx.txid,
      MEMO: memo,
      CURRENCY: {
        CURRATE: CURRATE,
        CURSYM: fiatCurrencyCode
      }
    }
    const use = NAME === '' ? qboTx : qboTxNamed
    STMTTRN.push(use)
  }

  const header = {
    OFXHEADER: '100',
    DATA: 'OFXSGML',
    VERSION: '102',
    SECURITY: 'NONE',
    ENCODING: 'USASCII',
    CHARSET: '1252',
    COMPRESSION: 'NONE',
    OLDFILEUID: 'NONE',
    NEWFILEUID: 'NONE'
  }

  const body = {
    SIGNONMSGSRSV1: {
      SONRS: {
        STATUS: {
          CODE: '0',
          SEVERITY: 'INFO'
        },
        DTSERVER: now,
        LANGUAGE: 'ENG',
        'INTU.BID': '3000'
      }
    },
    BANKMSGSRSV1: {
      STMTTRNRS: {
        TRNUID: now,
        STATUS: {
          CODE: '0',
          SEVERITY: 'INFO',
          MESSAGE: 'OK'
        },
        STMTRS: {
          CURDEF: 'USD',
          BANKACCTFROM: {
            BANKID: '999999999',
            ACCTID: '999999999999',
            ACCTTYPE: 'CHECKING'
          },
          BANKTRANLIST: {
            DTSTART: now,
            DTEND: now,
            STMTTRN
          },
          LEDGERBAL: {
            BALAMT: '0.00',
            DTASOF: now
          },
          AVAILBAL: {
            BALAMT: '0.00',
            DTASOF: now
          }
        }
      }
    }
  }

  return exportOfx(header, body)
}

export function exportTransactionsToCSVInner(
  edgeTransactions: EdgeTransaction[],
  currencyCode: string,
  fiatCurrencyCode: string,
  denom?: string,
  denomName: string = ''
): string {
  const items: any[] = []

  for (const tx of edgeTransactions) {
    const newTxs = getTransferTx(tx)
    if (newTxs != null) {
      edgeTxToCsv(newTxs[0])
      edgeTxToCsv(newTxs[1])
    } else {
      edgeTxToCsv(tx)
    }
  }

  function edgeTxToCsv(edgeTx: EdgeTransaction) {
    const amount: string = denom ? div(edgeTx.nativeAmount, denom, DECIMAL_PRECISION) : edgeTx.nativeAmount
    const networkFeeField: string = denom ? div(edgeTx.networkFee, denom, DECIMAL_PRECISION) : edgeTx.networkFee
    const { date, time } = makeCsvDateTime(edgeTx.date)
    let name: string = ''
    let amountFiat: number = 0
    let category: string = ''
    let notes: string = ''
    if (edgeTx.metadata) {
      name = edgeTx.metadata.name ? edgeTx.metadata.name : ''
      amountFiat = edgeTx.metadata.amountFiat ? edgeTx.metadata.amountFiat : 0
      category = edgeTx.metadata.category ? edgeTx.metadata.category : ''
      notes = edgeTx.metadata.notes ? edgeTx.metadata.notes : ''
    }

    items.push({
      CURRENCY_CODE: currencyCode,
      DATE: date,
      TIME: time,
      PAYEE_PAYER_NAME: name,
      AMT_ASSET: amount,
      DENOMINATION: denomName,
      [fiatCurrencyCode]: String(amountFiat),
      CATEGORY: category,
      NOTES: notes,
      AMT_NETWORK_FEES_ASSET: networkFeeField,
      TXID: edgeTx.txid,
      OUR_RECEIVE_ADDRESSES: edgeTx.ourReceiveAddresses.join(','),
      VER: 1,
      DEVICE_DESCRIPTION: edgeTx.deviceDescription ?? ''
    })
  }

  return csvStringify(items, {
    header: true,
    quoted_string: true,
    record_delimiter: '\n'
  })
}

export async function exportTransactionsToBitwave(
  wallet: EdgeCurrencyWallet,
  accountId: string,
  edgeTransactions: EdgeTransaction[],
  currencyCode: string,
  multiplier: string,
  parentMultiplier: string
): Promise<string> {
  const items: any[] = []
  const parentCode = wallet.currencyInfo.currencyCode

  for (const tx of edgeTransactions) {
    edgeTxToCsv(tx)
  }

  function edgeTxToCsv(edgeTx: EdgeTransaction) {
    const { date, isSend, metadata, nativeAmount, networkFee, ourReceiveAddresses, parentNetworkFee, spendTargets, txid } = edgeTx
    const amount: string = abs(div(nativeAmount, multiplier, DECIMAL_PRECISION))
    const time = makeBitwaveDateTime(date)
    let fee: string = ''
    let feeTicker: string = ''
    const { name = '', category = '', notes = '' } = metadata ?? {}

    let toAddress = ''
    if (isSend) {
      if (parentNetworkFee != null) {
        feeTicker = parentCode
        fee = div(parentNetworkFee, parentMultiplier, DECIMAL_PRECISION)
      } else {
        feeTicker = currencyCode
        fee = div(networkFee, multiplier, DECIMAL_PRECISION)
      }
      if (spendTargets && spendTargets.length > 0) {
        // We can only choose 1 `toAddress` so pick the first spendTarget
        toAddress = spendTargets[0].publicAddress
      }
    } else {
      // We can only choose 1 `toAddress` so pick the first receive address
      toAddress = ourReceiveAddresses != null ? ourReceiveAddresses[0] : ''
    }

    const id = shajs('sha256').update(`${txid}_${nativeAmount}_${networkFee}_${toAddress}`).digest('hex').slice(0, 16)

    items.push({
      id,
      remoteContactId: '',
      amount,
      amountTicker: currencyCode,
      cost: '',
      costTicker: '',
      fee,
      feeTicker,
      time,
      blockchainId: txid,
      memo: notes,
      transactionType: isSend ? 'withdrawal' : 'deposit',
      accountId,
      contactId: '',
      categoryId: '',
      taxExempt: 'FALSE',
      tradeId: '',
      description: name,
      fromAddress: '',
      toAddress,
      groupId: '',
      'metadata:myCustomMetadata1': category,
      'metadata:myCustomMetadata2': notes
    })
  }

  return csvStringify(items, {
    header: true,
    quoted_string: true,
    record_delimiter: '\n'
  })
}
