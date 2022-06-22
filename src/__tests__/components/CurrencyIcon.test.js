/* globals describe beforeEach afterEach it jest expect */
/* eslint-disable flowtype/require-valid-file-annotation */

import * as React from 'react'
import * as reactRedux from 'react-redux'
import ShallowRenderer from 'react-test-renderer/shallow'

import { CryptoIconComponent } from '../../components/icons/CryptoIcon.js'

jest.mock('react-redux', () => ({
  useSelector: jest.fn(),
  useDispatch: jest.fn()
}))

describe('CryptoIcon', () => {
  beforeEach(() => {
    useDispatchMock.mockImplementation(() => () => {})
    useSelectorMock.mockImplementation(selector => selector(mockStore))
  })
  afterEach(() => {
    useDispatchMock.mockClear()
    useSelectorMock.mockClear()
  })

  const useSelectorMock = reactRedux.useSelector
  const useDispatchMock = reactRedux.useDispatch

  const mockStore = {
    core: {
      account: {
        currencyWallets: {
          '332s0ds39f': {
            pluginId: 'bitcoin',
            watch: () => {}
          }
        }
      }
    }
  }

  it('should render with loading props', () => {
    const renderer = new ShallowRenderer()

    const props = {
      pluginId: 'bitcoin',
      tokenId: 'bitcoin',
      walletId: '332s0ds39f',
      size: 5,
      dark: true,
      resizeMode: 'contain',
      marginRem: 1,
      paddingRem: [1, 2]
    }
    const actual = renderer.render(<CryptoIconComponent {...props} />)

    expect(actual).toMatchSnapshot()
  })
})
