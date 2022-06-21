// @flow
/* globals jest describe it expect */

import * as React from 'react'
import ShallowRenderer from 'react-test-renderer/shallow'

import { TransactionDetailsComponent } from '../components/scenes/TransactionDetailsScene.js'
import { getTheme } from '../components/services/ThemeContext.js'
import { type NavigationProp, getNavigation } from '../types/routerTypes.js'
import { type GuiWallet } from '../types/types.js'

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
    const navigation: NavigationProp<'transactionDetailsComponent'> = getNavigation()
    const actual = renderer.render(<TransactionDetailsComponent navigation={navigation} {...props} />)

    expect(actual).toMatchSnapshot()
  })

  it('should render with tx date off by 1000x in future', () => {
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
    const navigation: NavigationProp<'transactionDetailsComponent'> = getNavigation()

    const actual = renderer.render(<TransactionDetailsComponent navigation={navigation} {...props} />)

    expect(actual).toMatchSnapshot()
  })

  it('should render with tx date off by 1000x in past', () => {
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
    const navigation: NavigationProp<'transactionDetailsComponent'> = getNavigation()

    const actual = renderer.render(<TransactionDetailsComponent navigation={navigation} {...props} />)

    expect(actual).toMatchSnapshot()
  })

  it('should render with negative nativeAmount and fiatAmount', () => {
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
    const navigation: NavigationProp<'transactionDetailsComponent'> = getNavigation()

    const actual = renderer.render(<TransactionDetailsComponent navigation={navigation} {...props} />)
    expect(actual).toMatchSnapshot()
  })
})
