import * as React from 'react'
import type { AirshipBridge } from 'react-native-airship'
import { sprintf } from 'sprintf-js'

import { useHandler } from '../../hooks/useHandler'
import { lstrings } from '../../locales/strings'
import { ModalButtons } from '../buttons/ModalButtons'
import { EdgeCard } from '../cards/EdgeCard'
import { EdgeRow } from '../rows/EdgeRow'
import { EdgeModal } from './EdgeModal'

const DISPLAY_KEY_ORDER = ['bip32', 'bip44', 'bip49', 'bip84']

export type DisplayPublicKeys = Record<string, string>

interface Props {
  bridge: AirshipBridge<'link' | undefined>
  displayPublicKeys: DisplayPublicKeys
  showExplorer: boolean
  title: string
}

interface DisplayPublicKeyEntry {
  id: string
  key: string
  label: string
  value: string
}

function getDisplayKeyLabel(key: string): string {
  switch (key) {
    case 'bip32':
      return lstrings.fragment_wallets_public_key_bip32
    case 'bip44':
      return lstrings.fragment_wallets_public_key_bip44
    case 'bip49':
      return lstrings.fragment_wallets_public_key_bip49
    case 'bip84':
      return lstrings.fragment_wallets_public_key_bip84
    case 'publicKey':
      return lstrings.fragment_wallets_public_key
    default:
      return key
  }
}

export function getDisplayPublicKeyEntries(
  displayPublicKeys: DisplayPublicKeys
): DisplayPublicKeyEntry[] {
  const keys = Object.keys(displayPublicKeys)
  const orderedKeys = [
    ...DISPLAY_KEY_ORDER.filter(key => keys.includes(key)),
    ...keys.filter(key => !DISPLAY_KEY_ORDER.includes(key))
  ]

  return orderedKeys.map(key => ({
    id: encodeURIComponent(key),
    key,
    label: getDisplayKeyLabel(key),
    value: displayPublicKeys[key]
  }))
}

export const DisplayPublicKeysModal: React.FC<Props> = props => {
  const { bridge, displayPublicKeys, showExplorer, title } = props
  const entries = getDisplayPublicKeyEntries(displayPublicKeys)

  const handleCancel = useHandler(() => {
    bridge.resolve(undefined)
  })
  const handleOpenExplorer = useHandler(() => {
    bridge.resolve('link')
  })

  return (
    <EdgeModal bridge={bridge} title={title} onCancel={handleCancel} scroll>
      <EdgeCard sections>
        {entries.map(entry => (
          <EdgeRow
            key={entry.key}
            body={entry.value}
            maximumHeight="large"
            rightButtonAccessibilityLabel={sprintf(
              lstrings.fragment_wallets_copy_public_key_s,
              entry.label
            )}
            rightButtonType="copy"
            testID={`display-public-key-copy-${entry.id}`}
            title={entry.label}
          />
        ))}
      </EdgeCard>
      {showExplorer ? (
        <ModalButtons
          secondary={{
            label: lstrings.transaction_details_show_advanced_block_explorer,
            onPress: handleOpenExplorer,
            testID: 'display-public-key-open-explorer'
          }}
        />
      ) : null}
    </EdgeModal>
  )
}
