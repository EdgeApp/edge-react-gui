/* globals describe it expect */

import * as React from 'react'
import ShallowRenderer from 'react-test-renderer/shallow'

import { getTheme } from '../../components/services/ThemeContext'
import { AddressTileComponent } from '../../components/tiles/AddressTile'

describe('AddressTileComponent', () => {
  it('should render with loading props', () => {
    // @ts-expect-error
    const renderer = new ShallowRenderer()

    const props = {
      coreWallet: {
        addCustomToken: 'shib',
        currencyInfo: {
          currencyCode: 'SHIB'
        },

        // @ts-expect-error
        parseUri: (address, currencyCode) => 'wallet'
      },
      currencyCode: 'BTC',
      title: 'Title',
      recipientAddress: 'bc1',

      // @ts-expect-error
      onChangeAddress: async (guiMakeSpendInfo, parsedUri) => undefined,
      resetSendTransaction: () => undefined,
      lockInputs: true,
      addressTileRef: {},
      isCameraOpen: true,
      theme: getTheme()
    }
    // @ts-expect-error
    const actual = renderer.render(<AddressTileComponent {...props} />)

    expect(actual).toMatchSnapshot()
  })
})
