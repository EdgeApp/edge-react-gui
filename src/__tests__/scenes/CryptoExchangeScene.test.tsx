import { describe, expect, it } from '@jest/globals'
import * as React from 'react'
import TestRenderer from 'react-test-renderer'

import { CryptoExchangeComponent } from '../../components/scenes/CryptoExchangeScene'
import { initialState } from '../../reducers/ExchangeInfoReducer'
import { FakeProviders, FakeState } from '../../util/fake/FakeProviders'
import { fakeRootState } from '../../util/fake/fakeRootState'
import { fakeSceneProps } from '../../util/fake/fakeSceneProps'

describe('CryptoExchangeComponent', () => {
  it('should render with loading props', () => {
    const rootState: FakeState = { ...fakeRootState }

    const renderer = TestRenderer.create(
      <FakeProviders initialState={rootState}>
        <CryptoExchangeComponent
          {...fakeSceneProps('exchange', {})}
          exchangeInfo={initialState}
          onSelectWallet={async () => undefined}
          getQuoteForTransaction={() => undefined}
        />
      </FakeProviders>
    )

    expect(renderer.toJSON()).toMatchSnapshot()
    renderer.unmount()
  })
})
