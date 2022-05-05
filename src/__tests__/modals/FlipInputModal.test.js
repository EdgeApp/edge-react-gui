/* globals describe it expect beforeEach afterEach jest */
/* eslint-disable flowtype/require-valid-file-annotation */

import * as React from 'react'
import * as reactRedux from 'react-redux'
import ShallowRenderer from 'react-test-renderer/shallow'

import { FlipInputModalComponent } from '../../components/modals/FlipInputModal'
import { getTheme } from '../../components/services/ThemeContext.js'
import { fakeAirshipBridge } from '../../util/fake/fakeAirshipBridge.js'

// jest.mock('react-redux', () => ({
//   useSelector: jest.fn(),
//   useDispatch: jest.fn(),
//   connect: jest.fn()
// }))

describe('FlipInputModalComponent', () => {
  // const useSelectorMock = reactRedux.useSelector
  // const useDispatchMock = reactRedux.useDispatch

  // const mockStore = {
  //   core: {
  //     account: {
  //       currencyWallets: {
  //         myWallet: {
  //           pluginId: 'bitcoin',
  //           watch: () => {}
  //         }
  //       }
  //     }
  //   }
  // }

  // beforeEach(() => {
  //   useDispatchMock.mockImplementation(() => () => {})
  //   useSelectorMock.mockImplementation(selector => selector(mockStore))
  // })
  // afterEach(() => {
  //   useDispatchMock.mockClear()
  //   useSelectorMock.mockClear()
  // })

  it('should render with loading props', () => {
    const renderer = new ShallowRenderer()

    const props = {
      bridge: fakeAirshipBridge,
      walletId: 'myWallet',
      currencyCode: 'BTC',
      onFeesChange: () => undefined,
      balanceCrypto: '10000',
      flipInputHeaderText: 'Exchange Header',
      primaryInfo: {
        displayCurrencyCode: 'BTC',
        exchangeCurrencyCode: 'BTC',
        displayDenomination: { multiplier: '100000000000', name: 'BTC' },
        exchangeDenomination: { multiplier: '100000000000', name: 'BTC' }
      },
      secondaryInfo: {
        displayCurrencyCode: 'BTC',
        exchangeCurrencyCode: 'BTC',
        displayDenomination: {
          name: 'Bitcoin',
          multiplier: '1'
        },
        exchangeDenomination: {
          name: 'Bitcoin',
          multiplier: '1'
        }
      },
      fiatPerCrypto: '1000',
      overridePrimaryExchangeAmount: '0',
      forceUpdateGuiCounter: 123,
      pluginId: 'Wyre',
      feeCurrencyCode: 'BTC',
      feeDisplayDenomination: { multiplier: '100000000000', name: 'BTC' },
      feeExchangeDenomination: { multiplier: '100000000000', name: 'BTC' },
      feeNativeAmount: '1',
      feeAmount: '1',
      updateMaxSpend: (walletId, currencyCode) => undefined,
      updateTransactionAmount: (nativeAmount, exchangeAmount, walletId, currencyCode) => undefined,
      theme: getTheme()
    }
    const actual = renderer.render(<FlipInputModalComponent {...props} />)

    expect(actual).toMatchSnapshot()
  })
})
