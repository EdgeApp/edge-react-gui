// @flow
/* globals jest describe it expect */

import React from 'react'
import ShallowRenderer from 'react-test-renderer/shallow'

import { TransactionDetails } from '../components/scenes/TransactionDetailsScene.js'

describe('TransactionDetails.ui', () => {
  it('should render', () => {
    const renderer = new ShallowRenderer()
    const fakeWallet: any = {
      allDenominations: {},
      balances: { BTC: '123123' },
      blockHeight: 12345,
      currencyCode: 'BTC',
      currencyInfo: {},
      displayPrivateSeed: 'private seed',
      displayPublicSeed: 'public seed',
      fiatCurrencyCode: 'iso:USD',
      id: '123',
      name: 'wallet name'
    }
    const props = {
      edgeTransaction: {
        txid: 'this is the txid',
        currencyCode: 'BTC',
        date: 1535752780.947, // 2018-08-31T21:59:40.947Z
        nativeAmount: '123',
        networkFee: '1',
        ourReceiveAddresses: ['this is an address'],
        signedTx: 'this is a signed tx',
        otherParams: {},
        wallet: fakeWallet,
        blockHeight: 0
      },
      contacts: [],
      subcategoriesList: [],
      settings: {
        [fakeWallet.currencyCode]: {
          denominations: {}
        }
      },
      thumbnailPath: 'thumb/nail/path',
      currencyInfo: null,
      currencyCode: 'BTC',
      wallets: { [fakeWallet.id]: fakeWallet },
      setNewSubcategory: jest.fn(),
      openHelpModal: jest.fn(),
      setTransactionDetails: jest.fn(),
      getSubcategories: jest.fn(),
      displayDropdownAlert: jest.fn()
    }
    const actual = renderer.render(<TransactionDetails {...props} />)

    expect(actual).toMatchSnapshot()
  })

  it('should render with tx date off by 1000x in future', () => {
    const renderer = new ShallowRenderer()
    const fakeWallet: any = {
      allDenominations: {},
      balances: { BTC: '123123' },
      blockHeight: 12345,
      currencyCode: 'BTC',
      currencyInfo: {},
      displayPrivateSeed: 'private seed',
      displayPublicSeed: 'public seed',
      fiatCurrencyCode: 'iso:USD',
      id: '123',
      name: 'wallet name'
    }
    const props = {
      edgeTransaction: {
        txid: 'this is the txid',
        currencyCode: 'BTC',
        date: 1535752780.947 * 1000,
        nativeAmount: '123',
        networkFee: '1',
        ourReceiveAddresses: ['this is an address'],
        signedTx: 'this is a signed tx',
        otherParams: {},
        wallet: fakeWallet,
        blockHeight: 0
      },
      contacts: [],
      subcategoriesList: [],
      settings: {
        [fakeWallet.currencyCode]: {
          denominations: {}
        }
      },
      thumbnailPath: 'thumb/nail/path',
      currencyInfo: null,
      currencyCode: 'BTC',
      wallets: { [fakeWallet.id]: fakeWallet },
      setNewSubcategory: jest.fn(),
      openHelpModal: jest.fn(),
      setTransactionDetails: jest.fn(),
      getSubcategories: jest.fn(),
      displayDropdownAlert: jest.fn()
    }
    const actual = renderer.render(<TransactionDetails {...props} />)

    expect(actual).toMatchSnapshot()
  })

  it('should render with tx date off by 1000x in past', () => {
    const renderer = new ShallowRenderer()
    const fakeWallet: any = {
      allDenominations: {},
      balances: { BTC: '123123' },
      blockHeight: 12345,
      currencyCode: 'BTC',
      currencyInfo: {},
      displayPrivateSeed: 'private seed',
      displayPublicSeed: 'public seed',
      fiatCurrencyCode: 'iso:USD',
      id: '123',
      name: 'wallet name'
    }
    const props = {
      edgeTransaction: {
        txid: 'this is the txid',
        currencyCode: 'BTC',
        date: 1535752780.947 / 1000,
        nativeAmount: '123',
        networkFee: '1',
        ourReceiveAddresses: ['this is an address'],
        signedTx: 'this is a signed tx',
        otherParams: {},
        wallet: fakeWallet,
        blockHeight: 0
      },
      contacts: [],
      subcategoriesList: [],
      settings: {
        [fakeWallet.currencyCode]: {
          denominations: {}
        }
      },
      thumbnailPath: 'thumb/nail/path',
      currencyInfo: null,
      currencyCode: 'BTC',
      wallets: { [fakeWallet.id]: fakeWallet },
      setNewSubcategory: jest.fn(),
      openHelpModal: jest.fn(),
      setTransactionDetails: jest.fn(),
      getSubcategories: jest.fn(),
      displayDropdownAlert: jest.fn()
    }
    const actual = renderer.render(<TransactionDetails {...props} />)

    expect(actual).toMatchSnapshot()
  })

  it('should render with negative nativeAmount and fiatAmount', () => {
    const renderer = new ShallowRenderer()
    const fakeWallet: any = {
      allDenominations: {},
      balances: { BTC: '123123' },
      blockHeight: 12345,
      currencyCode: 'BTC',
      currencyInfo: {},
      displayPrivateSeed: 'private seed',
      displayPublicSeed: 'public seed',
      fiatCurrencyCode: 'iso:USD',
      id: '123',
      name: 'wallet name'
    }
    const props = {
      edgeTransaction: {
        txid: 'this is the txid',
        currencyCode: 'BTC',
        date: 1535752780.947, // 2018-08-31T21:59:40.947Z
        nativeAmount: '-123',
        networkFee: '1',
        ourReceiveAddresses: ['this is an address'],
        signedTx: 'this is a signed tx',
        otherParams: {},
        wallet: fakeWallet,
        blockHeight: 0,
        metadata: {
          amountFiat: -6392.93
        }
      },
      contacts: [],
      subcategoriesList: [],
      settings: {
        [fakeWallet.currencyCode]: {
          denominations: {}
        }
      },
      thumbnailPath: 'thumb/nail/path',
      currencyInfo: null,
      currencyCode: 'BTC',
      wallets: { [fakeWallet.id]: fakeWallet },
      setNewSubcategory: jest.fn(),
      openHelpModal: jest.fn(),
      setTransactionDetails: jest.fn(),
      getSubcategories: jest.fn(),
      displayDropdownAlert: jest.fn()
    }
    const actual = renderer.render(<TransactionDetails {...props} />)

    expect(actual).toMatchSnapshot()
  })
})
