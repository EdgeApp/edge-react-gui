/**
 * Created by paul on 8/16/17.
 */
// @flow
// trying to trigger a build. .. will remove this line
import type {AbcDenomination, AbcMetaToken} from 'airbitz-core-types'

export class GuiWallet {
  id: string
  type: string
  name: string
  primaryNativeBalance: string
  nativeBalances: { [currencyCode: string]: string }
  currencyNames: { [currencyCode: string]: string }
  currencyCode: string
  isoFiatCurrencyCode: string
  fiatCurrencyCode: string
  denominations: Array<AbcDenomination>
  allDenominations: { [currencyCode: string]: { [denomination: string]: AbcDenomination } }
  symbolImage: string
  symbolImageDarkMono: string
  metaTokens: Array<AbcMetaToken>
  enabledTokens: Array<string>
  constructor (
    id: string,
    type: string,
    name: string,
    primaryNativeBalance: string,
    nativeBalances: { [currencyCode: string]: string },
    currencyNames: { [currencyCode: string]: string },
    currencyCode: string,
    isoFiatCurrencyCode: string,
    fiatCurrencyCode: string,
    denominations: Array<AbcDenomination>,
    allDenominations: { [currencyCode: string]: { [denomination: string]: AbcDenomination } },
    symbolImage: string,
    symbolImageDarkMono: string,
    metaTokens: Array<AbcMetaToken>,
    enabledTokens: Array<string>,
  ) {
    this.id = id
    this.type = type
    this.name = name
    this.primaryNativeBalance = primaryNativeBalance
    this.nativeBalances = nativeBalances
    this.currencyNames = currencyNames
    this.currencyCode = currencyCode
    this.isoFiatCurrencyCode = isoFiatCurrencyCode
    this.fiatCurrencyCode = fiatCurrencyCode
    this.denominations = denominations
    this.allDenominations = allDenominations
    this.symbolImage = symbolImage
    this.symbolImageDarkMono = symbolImageDarkMono
    this.metaTokens = metaTokens
    this.enabledTokens = enabledTokens
  }
}

export type GuiDenomination = {
  name: string,
  currencyCode?: string,
  symbol: string,
  multiplier: string,
  precision: number
}

export type GuiCurrencyInfo = {
  displayCurrencyCode: string,
  exchangeCurrencyCode: string,
  displayDenomination: GuiDenomination,
  exchangeDenomination: GuiDenomination
}

export type GuiContact = {
  hasThumbnail: boolean,
  emailAddresses: Array<string>,
  postalAddresses: Array<string>,
  middleName: string,
  company: string,
  jobTitle: string,
  familyName: string,
  thumbnailPath: string,
  recordID: string,
  givenName: string,
}

export type ExchangeData = {
  primaryDisplayAmount: string,
  primaryDisplayName: string,
  secondaryDisplayAmount: string,
  secondaryDisplaySymbol: string,
  secondaryCurrencyCode: string
}

export type CurrencyConverter = {
  convertCurrency: (currencyCode: string, isoFiatCurrencyCode: string, balanceInCryptoDisplay: string) => number
}