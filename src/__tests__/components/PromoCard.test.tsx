import { describe, expect, it } from '@jest/globals'
import * as React from 'react'
import renderer from 'react-test-renderer'

import { PromoCard } from '../../components/cards/PromoCard'
import { MessageTweak } from '../../types/TweakTypes'
import { FakeProviders, FakeState } from '../../util/fake/FakeProviders'
import { fakeNavigation } from '../../util/fake/fakeSceneProps'

describe('PromoCard', () => {
  const fakeMessage: MessageTweak = {
    message: 'Show me',
    iconUri: 'https://edge.app/favicon.ico',
    durationDays: 1
  }

  const mockState: FakeState = {
    account: {
      accountReferral: {
        installerId: 'string',
        currencyCodes: ['BTC'],
        promotions: [],
        ignoreAccountSwap: true,
        hiddenAccountMessages: { messageId: true }
      },
      referralCache: {
        accountMessages: [fakeMessage]
      }
    }
  }

  it('should render', () => {
    const actual = renderer.create(
      <FakeProviders initialState={mockState}>
        <PromoCard navigation={fakeNavigation} />
      </FakeProviders>
    )

    expect(actual).toMatchSnapshot()
  })
})
