/**
 * Created by paul on 8/16/17.
 */
// @flow

import { EsDenomination, EsMetaToken } from 'airbitz-core-js'

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
  denominations:Array<EsDenomination>
  allDenominations: { [currencyCode: string]: { [denomination: string]: EsDenomination } }
  symbolImage:string
  metaTokens:Array<EsMetaToken>
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
    denominations:Array<EsDenomination>,
    allDenominations: { [currencyCode: string]: { [denomination: string]: EsDenomination } },
    symbolImage:string,
    metaTokens:Array<EsMetaToken>,
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
