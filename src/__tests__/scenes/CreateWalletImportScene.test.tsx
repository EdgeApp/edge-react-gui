import { describe, expect, it, jest } from '@jest/globals'
import { render } from '@testing-library/react-native'
import * as React from 'react'

import { CreateWalletImportScene } from '../../components/scenes/CreateWalletImportScene'
import { defaultAccount } from '../../reducers/CoreReducer'
import { FakeProviders, FakeState } from '../../util/fake/FakeProviders'
import { fakeEdgeAppSceneProps } from '../../util/fake/fakeSceneProps'

jest.mock('react-native-keyboard-aware-scroll-view', () => {
  const KeyboardAwareScrollView = (blob: { children: React.ReactNode }) => blob.children
  return { KeyboardAwareScrollView }
})

// Jest doesn't like direct SVG imports
jest.mock('../../assets/images/import-key-icon.svg', () => 'ImportKeySvg')

describe('CreateWalletImportScene', () => {
  const mockState: FakeState = {
    core: {
      account: {
        ...defaultAccount,
        currencyConfig: {
          bitcoin: {
            importKey: () => {}
          }
        }
      }
    }
  }

  it('should render with loading props', () => {
    const rendered = render(
      <FakeProviders initialState={mockState}>
        <CreateWalletImportScene
          {...fakeEdgeAppSceneProps('createWalletImport', {
            createWalletList: [
              {
                type: 'create',
                key: `create-wallet:bitcoin-bip49-bitcoin`,
                currencyCode: 'BTC',
                displayName: 'Bitcoin',
                pluginId: 'bitcoin',
                tokenId: null,
                walletType: 'wallet:bitcoin-bip49'
              }
            ],
            walletNames: { 'create-wallet:bitcoin-bip49-bitcoin': 'My Bitcoin' }
          })}
        />
      </FakeProviders>
    )

    expect(rendered.toJSON()).toMatchSnapshot()
    rendered.unmount()
  })
})
