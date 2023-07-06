import { describe, expect, it, jest } from '@jest/globals'
import * as React from 'react'
import TestRenderer from 'react-test-renderer'

import { CreateWalletImportScene } from '../../components/scenes/CreateWalletImportScene'
import { FakeProviders, FakeState } from '../../util/fake/FakeProviders'
import { fakeSceneProps } from '../../util/fake/fakeSceneProps'

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
        currencyConfig: {
          bitcoin: {
            importKey: () => {}
          }
        }
      }
    }
  }

  it('should render with loading props', () => {
    const renderer = TestRenderer.create(
      <FakeProviders initialState={mockState}>
        <CreateWalletImportScene
          {...fakeSceneProps('createWalletImport', {
            createWalletList: [
              {
                key: `create-wallet:bitcoin-bip49-bitcoin`,
                currencyCode: 'BTC',
                displayName: 'Bitcoin',
                pluginId: 'bitcoin',
                walletType: 'wallet:bitcoin-bip49'
              }
            ],
            walletNames: { 'create-wallet:bitcoin-bip49-bitcoin': 'My Bitcoin' },
            fiatCode: 'USD'
          })}
        />
      </FakeProviders>
    )

    expect(renderer.toJSON()).toMatchSnapshot()
    renderer.unmount()
  })
})
