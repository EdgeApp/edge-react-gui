import { describe, expect, it } from '@jest/globals'
import { EdgeAccount } from 'edge-core-js'
import * as React from 'react'
import { Provider } from 'react-redux'
import { createRenderer } from 'react-test-renderer/shallow'
import { createStore } from 'redux'

import { EdgeLoginScene } from '../../components/scenes/EdgeLoginScene'
import { rootReducer } from '../../reducers/RootReducer'
import { RouteProp } from '../../types/routerTypes'
import { fakeNavigation } from '../../util/fake/fakeNavigation'
import { fakeNonce } from '../../util/fake/fakeNonce'
import { fakeRootState } from '../../util/fake/fakeRootState'

let account: EdgeAccount | undefined

describe('EdgeLoginScene', () => {
  const nonce = fakeNonce(0)
  it('should render with loading props', () => {
    const renderer = createRenderer()
    const route: RouteProp<'edgeLogin'> = {
      key: `edgeLogin-${nonce()}`,
      name: 'edgeLogin',
      params: {
        lobbyId: 'AmNsSBDVeF2837'
      }
    }
    const rootState: any = fakeRootState
    rootState.core = {
      account
    }
    const store = createStore(rootReducer, rootState)
    const actual = renderer.render(
      <Provider store={store}>
        <EdgeLoginScene route={route} navigation={fakeNavigation} />
      </Provider>
    )

    expect(actual).toMatchSnapshot()
  })
})
