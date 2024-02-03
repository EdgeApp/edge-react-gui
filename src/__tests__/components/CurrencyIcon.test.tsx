import { describe, expect, it } from '@jest/globals'
import * as React from 'react'
import TestRenderer from 'react-test-renderer'

import { CryptoIconUi4 } from '../../components/ui4/CryptoIconUi4'
import { FakeProviders, FakeState } from '../../util/fake/FakeProviders'

describe('CryptoIcon', () => {
  const mockState: FakeState = {
    core: {
      account: {
        currencyWallets: {
          '332s0ds39f': {
            watch: () => {}
          }
        },
        watch: () => () => {}
      }
    }
  }

  it('should render with loading props', () => {
    const renderer = TestRenderer.create(
      <FakeProviders initialState={mockState}>
        <CryptoIconUi4 pluginId="bitcoin" tokenId="bitcoin" walletId="332s0ds39f" marginRem={1} />
      </FakeProviders>
    )

    expect(renderer.toJSON()).toMatchSnapshot()
    renderer.unmount()
  })
})
