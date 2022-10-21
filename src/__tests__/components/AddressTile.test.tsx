import { describe, expect, it } from '@jest/globals'
import * as React from 'react'
import { createRenderer } from 'react-test-renderer/shallow'

import { getTheme } from '../../components/services/ThemeContext'
import { AddressTileComponent } from '../../components/tiles/AddressTile'

describe('AddressTileComponent', () => {
  it('should render with loading props', () => {
    const renderer = createRenderer()

    const fakeWallet: any = {
      addCustomToken: 'shib',
      currencyInfo: {
        currencyCode: 'SHIB'
      }
    }

    const actual = renderer.render(
      <AddressTileComponent
        coreWallet={fakeWallet}
        currencyCode="BTC"
        title="Title"
        recipientAddress="bc1"
        onChangeAddress={async (guiMakeSpendInfo, parsedUri) => undefined}
        resetSendTransaction={() => undefined}
        lockInputs
        addressTileRef={{}}
        isCameraOpen
        theme={getTheme()}
      />
    )

    expect(actual).toMatchSnapshot()
  })
})
