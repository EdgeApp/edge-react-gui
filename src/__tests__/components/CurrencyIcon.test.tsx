import { describe, expect, it } from '@jest/globals'
import { render } from '@testing-library/react-native'
import * as React from 'react'

import { CryptoIcon } from '../../components/icons/CryptoIcon'
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
    const rendered = render(
      <FakeProviders initialState={mockState}>
        <CryptoIcon pluginId="bitcoin" tokenId="bitcoin" marginRem={1} />
      </FakeProviders>
    )

    expect(rendered.toJSON()).toMatchSnapshot()
    rendered.unmount()
  })
})
