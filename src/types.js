/**
 * Created by paul on 8/16/17.
 */
// @flow
// trying to trigger a build. .. will remove this line
import type {AbcDenomination, AbcMetaToken} from 'edge-login'

export type GuiWallet = {
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
  enabledTokens: Array<string>
}

export type GuiDenomination = {
  name: string,
  currencyCode?: string,
  symbol: string,
  multiplier: string,
  precision?: number
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

export type CustomTokenInfo = {
  currencyName: string,
  currencyCode: string,
  contractAddress: string,
  multiplier: string,
  denomination: string, // eventually change to mandatory
  isVisible?: boolean, // eventually change to mandatory,
  denominations: Array<AbcDenomination>
}

export type GuiWalletType = {
  label: string,
  value: string,
  symbolImage?: string,
  symbolImageDarkMono?: string,
  currencyCode: string
}

export type GuiFiatType = {
  label: string,
  value: string
}

export type FlatListItem = {
  key: number,
  item: any
}

export type DeviceDimensions = {
  keyboardHeight?: number
}

export type CurrencyConverter = {
  convertCurrency: (currencyCode: string, isoFiatCurrencyCode: string, balanceInCryptoDisplay: string) => number
}

export const emptyGuiWallet: GuiWallet = {
  id: '',
  type: '',
  name: '',
  primaryNativeBalance: '',
  nativeBalances: {},
  currencyNames: {},
  currencyCode: '',
  isoFiatCurrencyCode: '',
  fiatCurrencyCode: '',
  denominations: [],
  allDenominations: {},
  symbolImage: '',
  symbolImageDarkMono: '',
  metaTokens: [],
  enabledTokens: []
}

export const emptyGuiDenomination: GuiDenomination = {
  name: '',
  symbol: '',
  multiplier: '',
  precision: 0,
  currencyCode: ''
}
export const emptyCurrencyInfo: GuiCurrencyInfo = {
  displayCurrencyCode: '',
  exchangeCurrencyCode: '',
  displayDenomination: emptyGuiDenomination,
  exchangeDenomination: emptyGuiDenomination
}
