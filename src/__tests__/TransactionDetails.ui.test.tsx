/* globals jest describe it expect */

import * as React from 'react'
import ShallowRenderer from 'react-test-renderer/shallow'

import { TransactionDetailsComponent } from '../components/scenes/TransactionDetailsScene'
import { getTheme } from '../components/services/ThemeContext'
import { GuiWallet } from '../types/types'

const fakeGuiWallet: GuiWallet = {
  blockHeight: 12345,
  currencyNames: { BTC: 'Bitcoin' },
  currencyCode: 'BTC',
  enabledTokens: [],
  fiatCurrencyCode: 'USD',
  id: '123',
  isoFiatCurrencyCode: 'iso:USD',
  metaTokens: [],
  name: 'wallet name',
  nativeBalances: {},
  pluginId: 'bitcoin',
  primaryNativeBalance: '0',
  type: 'wallet:bitcoin'
}
const fakeCoreWallet: any = {
  ...fakeGuiWallet,
  balances: { BTC: '123123' }
}

const settings = {
  [fakeGuiWallet.currencyCode]: {
    denomination: '100000000',
    denominations: {
      name: 'BTC',
      multiplier: '100000000',
      symbol: '₿'
    }
  }
}

describe('TransactionDetails.ui', () => {
  it('should render', () => {
    // @ts-expect-error
    const renderer = new ShallowRenderer()
    const props = {
      route: {
        name: 'transactionDetails',
        params: {
          edgeTransaction: {
            txid: 'this is the txid',
            currencyCode: 'BTC',
            date: 1535752780.947, // 2018-08-31T21:59:40.947Z
            nativeAmount: '123',
            networkFee: '1',
            ourReceiveAddresses: ['this is an address'],
            signedTx: 'this is a signed tx',
            otherParams: {},
            wallet: fakeCoreWallet,
            blockHeight: 0
          },
          thumbnailPath: 'thumb/nail/path'
        }
      },
      contacts: [],
      subcategoriesList: [],
      currencyCode: 'BTC',
      guiWallet: fakeGuiWallet,
      currentFiatAmount: '120',
      walletDefaultDenomProps: settings[fakeGuiWallet.currencyCode].denominations,
      setNewSubcategory: jest.fn(),
      setTransactionDetails: jest.fn(),
      getSubcategories: jest.fn(),
      displayDropdownAlert: jest.fn(),
      theme: getTheme()
    }
    // @ts-expect-error
    const actual = renderer.render(<TransactionDetailsComponent {...props} />)

    expect(actual).toMatchSnapshot()
  })

  it('should render with tx date off by 1000x in future', () => {
    // @ts-expect-error
    const renderer = new ShallowRenderer()
    const props = {
      route: {
        name: 'transactionDetails',
        params: {
          edgeTransaction: {
            txid: 'this is the txid',
            currencyCode: 'BTC',
            date: 1535752780.947 * 1000,
            nativeAmount: '123',
            networkFee: '1',
            ourReceiveAddresses: ['this is an address'],
            signedTx: 'this is a signed tx',
            otherParams: {},
            wallet: fakeCoreWallet,
            blockHeight: 0
          },
          thumbnailPath: 'thumb/nail/path'
        }
      },
      contacts: [],
      subcategoriesList: [],
      currencyCode: 'BTC',
      guiWallet: fakeGuiWallet,
      currentFiatAmount: '120',
      walletDefaultDenomProps: settings[fakeGuiWallet.currencyCode].denominations,
      setNewSubcategory: jest.fn(),
      setTransactionDetails: jest.fn(),
      getSubcategories: jest.fn(),
      displayDropdownAlert: jest.fn(),
      theme: getTheme()
    }
    // @ts-expect-error
    const actual = renderer.render(<TransactionDetailsComponent {...props} />)

    expect(actual).toMatchSnapshot()
  })

  it('should render with tx date off by 1000x in past', () => {
    // @ts-expect-error
    const renderer = new ShallowRenderer()

    const props = {
      route: {
        name: 'transactionDetails',
        params: {
          edgeTransaction: {
            txid: 'this is the txid',
            currencyCode: 'BTC',
            date: 1535752780.947 / 1000,
            nativeAmount: '123',
            networkFee: '1',
            ourReceiveAddresses: ['this is an address'],
            signedTx: 'this is a signed tx',
            otherParams: {},
            wallet: fakeCoreWallet,
            blockHeight: 0
          },
          thumbnailPath: 'thumb/nail/path'
        }
      },
      contacts: [],
      subcategoriesList: [],
      currencyCode: 'BTC',
      guiWallet: fakeGuiWallet,
      currentFiatAmount: '120',
      walletDefaultDenomProps: settings[fakeGuiWallet.currencyCode].denominations,
      setNewSubcategory: jest.fn(),
      setTransactionDetails: jest.fn(),
      getSubcategories: jest.fn(),
      displayDropdownAlert: jest.fn(),
      theme: getTheme()
    }
    // @ts-expect-error
    const actual = renderer.render(<TransactionDetailsComponent {...props} />)

    expect(actual).toMatchSnapshot()
  })

  it('should render with negative nativeAmount and fiatAmount', () => {
    // @ts-expect-error
    const renderer = new ShallowRenderer()
    const props = {
      route: {
        name: 'transactionDetails',
        params: {
          edgeTransaction: {
            txid: 'this is the txid',
            currencyCode: 'BTC',
            date: 1535752780.947, // 2018-08-31T21:59:40.947Z
            nativeAmount: '-123',
            networkFee: '1',
            ourReceiveAddresses: ['this is an address'],
            signedTx: 'this is a signed tx',
            otherParams: {},
            wallet: fakeCoreWallet,
            blockHeight: 0,
            metadata: {
              amountFiat: -6392.93
            }
          },
          thumbnailPath: 'thumb/nail/path'
        }
      },
      contacts: [],
      subcategoriesList: [],
      currencyCode: 'BTC',
      guiWallet: fakeGuiWallet,
      currentFiatAmount: '120',
      walletDefaultDenomProps: settings[fakeGuiWallet.currencyCode].denominations,
      setNewSubcategory: jest.fn(),
      setTransactionDetails: jest.fn(),
      getSubcategories: jest.fn(),
      displayDropdownAlert: jest.fn(),
      theme: getTheme()
    }
    // @ts-expect-error
    const actual = renderer.render(<TransactionDetailsComponent {...props} />)

    expect(actual).toMatchSnapshot()
  })
})
