// @flow

import { abs, div, lt, mul, sub, toFixed } from 'biggystring'
import { asNumber, asObject, asString } from 'cleaners'
import csvStringify from 'csv-stringify/lib/browser/sync'
import { type EdgeCurrencyWallet, type EdgeGetTransactionsOptions, type EdgeTransaction } from 'edge-core-js'

import { DECIMAL_PRECISION, getDenominationName, isSentTransaction, splitTransactionCategory } from '../util/utils.js'

const asExportData = asObject({
  amount: asString,
  amountFiat: asString,
  category: asString,
  currencyCode: asString,
  date: asString,
  denominationName: asString,
  edgeTransaction: asObject((raw: any) => raw),
  fiatCurrencyCode: asString,
  name: asString,
  networkFeeField: asString,
  notes: asString,
  rate: asString,
  time: asString
})

const asCsvExportData = asObject({
  CURRENCY_CODE: asString,
  DATE: asString,
  TIME: asString,
  PAYEE_PAYER_NAME: asString,
  AMT_ASSET: asString,
  DENOMINATION: asString,
  CATEGORY: asString,
  NOTES: asString,
  AMT_NETWORK_FEES_ASSET: asString,
  TXID: asString,
  OUR_RECEIVE_ADDRESSES: asString,
  VER: asNumber,
  DEVICE_DESCRIPTION: asString
})

const asQboExportData = asObject({
  TRNTYPE: asString,
  DTPOSTED: asString,
  TRNAMT: asString,
  FITID: asString,
  MEMO: asString,
  CURRENCY: asObject({
    CURRATE: asString,
    CURSYM: asString
  })
})

type ExportType = 'csv' | 'qbo'
type ExportData = $Call<typeof asExportData>
type ExportCSvData = $Call<typeof asCsvExportData>
type ExportQboData = $Call<typeof asQboExportData>

const checkIfCategoryIsTransfer = (fullCategory: string): boolean => {
  const { category } = splitTransactionCategory(fullCategory)
  return category.toLowerCase() === 'transfer'
}

const getExportData = (edgeTransaction: EdgeTransaction, opts: EdgeGetTransactionsOptions, denominationName: string, fiatCurrencyCode: string): ExportData => {
  const { currencyCode = '', denomination } = opts
  const amount: string = denomination ? div(edgeTransaction.nativeAmount, denomination, DECIMAL_PRECISION) : edgeTransaction.nativeAmount
  const networkFeeField: string = denomination ? div(edgeTransaction.networkFee, denomination, DECIMAL_PRECISION) : edgeTransaction.networkFee
  const { date, time } = makeCsvDateTime(edgeTransaction.date)
  const { metadata = {} } = edgeTransaction
  const { name = '', category = '', notes = '' } = metadata
  const amountFiat = metadata ? String(metadata.amountFiat) : '0'
  const rate = abs(amount) !== '0' ? div(abs(amountFiat.toString()), abs(amount), 8) : '0'

  return asExportData({
    amount,
    amountFiat,
    category,
    currencyCode,
    date,
    denominationName,
    edgeTransaction,
    fiatCurrencyCode,
    name,
    networkFeeField,
    notes,
    rate,
    time
  })
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

export function makeOfxDate(date: number): string {
  const d = new Date(date * 1000)
  const yyyy = d.getUTCFullYear().toString()
  const mm = padZero((d.getUTCMonth() + 1).toString())
  const dd = padZero(d.getUTCDate().toString())
  const hh = padZero(d.getUTCHours().toString())
  const min = padZero(d.getUTCMinutes().toString())
  const ss = padZero(d.getUTCSeconds().toString())
  return `${yyyy}${mm}${dd}${hh}${min}${ss}.000`
}

function makeCsvDateTime(date: number): { date: string, time: string } {
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

const exportTransactionToQBO = (exportData: ExportData): ExportQboData => {
  const { amount, amountFiat, category, edgeTransaction, fiatCurrencyCode, name, notes, rate } = exportData
  const TRNTYPE = lt(edgeTransaction.nativeAmount, '0') ? 'DEBIT' : 'CREDIT'
  const DTPOSTED = makeOfxDate(edgeTransaction.date)

  let memo = `// Rate=${rate} ${fiatCurrencyCode}=${amountFiat} category="${category}" memo="${notes}"`
  if (memo.length > 250) {
    memo = memo.substring(0, 250) + '...'
  }

  if (name === '') {
    return asQboExportData({
      TRNTYPE,
      DTPOSTED,
      TRNAMT: amount,
      FITID: edgeTransaction.txid,
      MEMO: memo,
      CURRENCY: {
        CURRATE: rate,
        CURSYM: fiatCurrencyCode
      }
    })
  }
  return asQboExportData.withRest({
    TRNTYPE,
    DTPOSTED,
    TRNAMT: amount,
    FITID: edgeTransaction.txid,
    NAME: name,
    MEMO: memo,
    CURRENCY: {
      CURRATE: rate,
      CURSYM: fiatCurrencyCode
    }
  })
}

const exportTransactionToCSV = (exportData: ExportData): ExportCSvData => {
  const { amount, amountFiat, category, currencyCode, date, denominationName, edgeTransaction, fiatCurrencyCode, name, networkFeeField, notes, time } =
    exportData
  return asCsvExportData.withRest({
    CURRENCY_CODE: currencyCode,
    DATE: date,
    TIME: time,
    PAYEE_PAYER_NAME: name,
    AMT_ASSET: amount,
    DENOMINATION: denominationName,
    [fiatCurrencyCode]: String(amountFiat),
    CATEGORY: category,
    NOTES: notes,
    AMT_NETWORK_FEES_ASSET: networkFeeField,
    TXID: edgeTransaction.txid,
    OUR_RECEIVE_ADDRESSES: edgeTransaction.ourReceiveAddresses.join(','),
    VER: 1,
    DEVICE_DESCRIPTION: edgeTransaction.deviceDescription ?? ''
  })
}

const finalizeExportToQBO = (STMTTRN: ExportQboData[]): string => {
  const now = makeOfxDate(Date.now() / 1000)

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

const finalizeExportToCSV = (items: any): string => {
  return csvStringify(items, {
    header: true,
    quoted_string: true,
    record_delimiter: 'windows'
  })
}

const exportTypeFunction = {
  csv: exportTransactionToCSV,
  qbo: exportTransactionToQBO,
  csvFinalize: finalizeExportToCSV,
  qboFinalize: finalizeExportToQBO
}

const sendTransactionAmountExportData = (exportData: ExportData): ExportData => {
  const { networkFeeField, rate } = exportData
  const amount = '-' + sub(abs(exportData.amount), abs(networkFeeField))
  return {
    ...exportData,
    amount,
    amountFiat: toFixed(mul(amount, rate), 2, 2),
    networkFeeField: '0'
  }
}

const sendTransactionFeeExportData = (exportData: ExportData): ExportData => {
  const { networkFeeField, rate } = exportData
  return {
    ...exportData,
    amount: `-${networkFeeField}`,
    amountFiat: '-' + toFixed(mul(networkFeeField, rate), 2, 2),
    edgeTransaction: {
      ...exportData.edgeTransaction,
      txid: `${exportData.edgeTransaction.txid}-fee`
    }
  }
}

const processExportData = (exportData: ExportData, exportType: ExportType): Array<ExportCSvData | ExportQboData> => {
  // $FlowFixMe - This is the result of the cleaners asObject. How to EdgeTransaction on cleaners?
  if (isSentTransaction(exportData.edgeTransaction) && checkIfCategoryIsTransfer(exportData.category)) {
    return [
      exportTypeFunction[exportType](sendTransactionAmountExportData(exportData)),
      exportTypeFunction[exportType](sendTransactionFeeExportData(exportData))
    ]
  }

  return [exportTypeFunction[exportType](exportData)]
}

export const exportTransactions = (
  exportType: ExportType,
  wallet: EdgeCurrencyWallet,
  edgeTransactions: EdgeTransaction[],
  opts: EdgeGetTransactionsOptions = {}
): string => {
  const newOpts = { ...opts, currencyCode: opts.currencyCode ?? wallet.currencyInfo.currencyCode }
  const denominationName = getDenominationName(wallet, opts.denomination)
  const items: any[] = []

  for (const edgeTransaction of edgeTransactions) {
    items.push(...processExportData(getExportData(edgeTransaction, newOpts, denominationName, wallet.fiatCurrencyCode), exportType))
  }

  return exportTypeFunction[`${exportType}Finalize`](items)
}
