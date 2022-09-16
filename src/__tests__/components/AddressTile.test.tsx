import { describe, expect, it } from '@jest/globals'
import * as React from 'react'
import { createRenderer } from 'react-test-renderer/shallow'

import { getTheme } from '../../components/services/ThemeContext'
import { AddressTileComponent } from '../../components/tiles/AddressTile'

describe('AddressTileComponent', () => {
  it('should render with loading props', () => {
    const renderer = createRenderer()

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
