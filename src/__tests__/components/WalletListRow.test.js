/* globals describe it expect beforeEach afterEach jest */
/* eslint-disable flowtype/require-valid-file-annotation */

import * as React from 'react'
import * as reactRedux from 'react-redux'
import ShallowRenderer from 'react-test-renderer/shallow'

import { WalletListRow } from '../../components/themed/WalletListRow.js'

jest.mock('react-redux', () => ({
  useSelector: jest.fn(),
  useDispatch: jest.fn(),
  connect: jest.fn()
}))

describe('WalletListRow', () => {
  const useSelectorMock = reactRedux.useSelector
  const useDispatchMock = reactRedux.useDispatch

  const mockStore = {
    core: {
      account: {
        currencyWallets: {
          myWallet: {
            pluginId: 'bitcoin',
            watch: () => {}
          }
        }
      }
    }
  }

  beforeEach(() => {
    useDispatchMock.mockImplementation(() => () => {})
    useSelectorMock.mockImplementation(selector => selector(mockStore))
  })
  afterEach(() => {
    useDispatchMock.mockClear()
    useSelectorMock.mockClear()
  })

  it('should render with loading props', () => {
    const renderer = new ShallowRenderer()

    const props = {
      currencyCode: 'string',
      children: 'Hello',
      icon: 'btc',
      editIcon: 'btc',
      gradient: true,
      onPress: () => undefined,
      onLongPress: () => undefined,
      walletName: 'My bitcoin wallet'
    }
    const actual = renderer.render(<WalletListRow {...props} />)

    expect(actual).toMatchSnapshot()
  })
})
