import { describe, expect, it } from '@jest/globals'
import * as React from 'react'
import { Provider } from 'react-redux'
import renderer from 'react-test-renderer'
import { createStore } from 'redux'

import { PromoCard } from '../../components/cards/PromoCard'
import { rootReducer } from '../../reducers/RootReducer'
import { MessageTweak } from '../../types/TweakTypes'

describe('PromoCard', () => {
  const fakeMessage: MessageTweak = {
    message: 'Show me',
    iconUri: 'https://edge.app/favicon.ico',
    durationDays: 1
  }

  const mockState: any = {
    account: {
      accountReferral: {
        installerId: 'string',
        currencyCodes: ['BTC'],
        promotions: [],
        ignoreAccountSwap: true,
        hiddenAccountMessages: ['messageId']
      },
      referralCache: {
        accountMessages: [fakeMessage]
      }
    }
  }
  const store = createStore(rootReducer, mockState)

  it('should render', () => {
    const actual = renderer.create(
      <Provider store={store}>
        <PromoCard />
      </Provider>
    )

    expect(actual).toMatchSnapshot()
  })
})
