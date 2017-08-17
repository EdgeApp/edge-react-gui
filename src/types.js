/**
 * Created by paul on 8/16/17.
 */

// @flow

export interface ABCDenomination {
  name:string,
  multiplier:string,
  symbol:string|null
}

export interface ABCMetaToken {
  currencyCode:string,
  currencyName:string,
  denominations:Array<ABCDenomination>,
  contractAddress:string|null,
  symbolImage:string|null
}

export class GUIWallet {
  id:string
  type:string
  name:string
  primaryNativeBalance:string
  nativeBalances: { [currencyCode: string]: string }
  currencyNames: { [currencyCode: string]: string }
  currencyCode:string
  isoFiatCurrencyCode:string
  fiatCurrencyCode:string
  denominations:Array<ABCDenomination>
  allDenominations: { [currencyCode: string]: { [denomination: string]: ABCDenomination } }
  symbolImage:string
  metaTokens:Array<ABCMetaToken>
  sortIndex:number
  archived:boolean
  deleted:boolean
  constructor (
    id:string,
    type:string,
    name:string,
    primaryNativeBalance:string,
    nativeBalances: { [currencyCode: string]: string },
    currencyNames: { [currencyCode: string]: string },
    currencyCode:string,
    isoFiatCurrencyCode:string,
    fiatCurrencyCode:string,
    denominations:Array<ABCDenomination>,
    allDenominations: { [currencyCode: string]: { [denomination: string]: ABCDenomination } },
    symbolImage:string,
    metaTokens:Array<ABCMetaToken>,
    sortIndex:number,
    archived:boolean,
    deleted:boolean
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
    this.metaTokens = metaTokens
    this.sortIndex = sortIndex
    this.archived = archived
    this.deleted = deleted
  }
}
