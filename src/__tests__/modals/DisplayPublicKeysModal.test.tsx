import { describe, expect, it, jest } from '@jest/globals'
import Clipboard from '@react-native-clipboard/clipboard'
import { fireEvent, render } from '@testing-library/react-native'
import * as React from 'react'

import {
  DisplayPublicKeysModal,
  getDisplayPublicKeyEntries
} from '../../components/modals/DisplayPublicKeysModal'
import { fakeAirshipBridge } from '../../util/fake/fakeAirshipBridge'
import { FakeProviders } from '../../util/fake/FakeProviders'

describe('DisplayPublicKeysModal', () => {
  it('renders labeled keys in derivation order and copies them separately', () => {
    const rendered = render(
      <FakeProviders>
        <DisplayPublicKeysModal
          bridge={fakeAirshipBridge}
          displayPublicKeys={{
            bip84: 'zpub-value',
            bip44: 'xpub-value',
            bip49: 'ypub-value',
            'future/key': 'future-value',
            bip32: 'bip32-value'
          }}
          showExplorer={false}
          title="View XPub Address"
        />
      </FakeProviders>
    )

    expect(rendered.getByText('BIP32')).toBeTruthy()
    expect(rendered.getByText('Legacy (BIP44)')).toBeTruthy()
    expect(rendered.getByText('Wrapped SegWit (BIP49)')).toBeTruthy()
    expect(rendered.getByText('SegWit (BIP84)')).toBeTruthy()
    expect(rendered.getByText('future/key')).toBeTruthy()
    expect(
      getDisplayPublicKeyEntries({
        bip84: 'zpub-value',
        bip44: 'xpub-value',
        bip49: 'ypub-value',
        'future/key': 'future-value',
        bip32: 'bip32-value'
      }).map(entry => entry.id)
    ).toEqual(['bip32', 'bip44', 'bip49', 'bip84', 'future%2Fkey'])

    fireEvent.press(rendered.getByTestId('display-public-key-copy-bip49'))
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(Clipboard.setString).toHaveBeenLastCalledWith('ypub-value')

    fireEvent.press(rendered.getByLabelText('Copy SegWit (BIP84) public key'))
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(Clipboard.setString).toHaveBeenLastCalledWith('zpub-value')

    rendered.unmount()
  })

  it('renders one derivation and preserves its explorer action', () => {
    const resolve = jest.fn()
    const bridge = { ...fakeAirshipBridge, resolve }
    const rendered = render(
      <FakeProviders>
        <DisplayPublicKeysModal
          bridge={bridge}
          displayPublicKeys={{ bip44: 'single-public-key' }}
          showExplorer
          title="View XPub Address"
        />
      </FakeProviders>
    )

    expect(rendered.getByText('Legacy (BIP44)')).toBeTruthy()
    fireEvent.press(rendered.getByTestId('display-public-key-open-explorer'))
    expect(resolve).toHaveBeenCalledWith('link')

    rendered.unmount()
  })
})
