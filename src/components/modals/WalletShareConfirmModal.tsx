import type { EdgeCurrencyWallet, EdgeWalletShareSpec } from 'edge-core-js'
import * as React from 'react'
import { View } from 'react-native'
import type { AirshipBridge } from 'react-native-airship'
import { ScrollView } from 'react-native-gesture-handler'

import { SCROLL_INDICATOR_INSET_FIX } from '../../constants/constantSettings'
import { useHandler } from '../../hooks/useHandler'
import { lstrings } from '../../locales/strings'
import { ModalButtons } from '../buttons/ModalButtons'
import { AlertCardUi4 } from '../cards/AlertCard'
import { WalletShareSummaryRow } from '../rows/WalletShareSummaryRow'
import { showError } from '../services/AirshipInstance'
import { cacheStyles, type Theme, useTheme } from '../services/ThemeContext'
import { SafeSlider } from '../themed/SafeSlider'
import { EdgeModal } from './EdgeModal'

interface Props {
  /** Resolves true once `onConfirm` succeeds, or undefined on cancel. */
  bridge: AirshipBridge<true | undefined>
  wallets: EdgeCurrencyWallet[]
  specs: EdgeWalletShareSpec[]
  /**
   * Performs the share. The slider spins until this settles; a rejection is
   * shown and the slider resets so the user can retry or cancel.
   */
  onConfirm: () => Promise<void>
}

/**
 * The last look before keys leave the device. Rows are flat and inert so
 * nothing here can be mistaken for a control other than the slider.
 */
export const WalletShareConfirmModal: React.FC<Props> = props => {
  const { bridge, wallets, specs, onConfirm } = props
  const theme = useTheme()
  const styles = getStyles(theme)

  const modeById = React.useMemo(() => {
    const map = new Map<string, EdgeWalletShareSpec['mode']>()
    for (const spec of specs) map.set(spec.walletId, spec.mode)
    return map
  }, [specs])
  const grantsSpend = specs.some(spec => spec.mode === 'spend')

  const handleCancel = useHandler(() => {
    bridge.resolve(undefined)
  })
  const handleSlidingComplete = useHandler(async (reset: () => void) => {
    try {
      await onConfirm()
      bridge.resolve(true)
    } catch (error: unknown) {
      showError(error)
      reset()
    }
  })

  return (
    <EdgeModal
      bridge={bridge}
      title={lstrings.wallet_share_confirm_title}
      onCancel={handleCancel}
    >
      <ScrollView
        style={styles.list}
        scrollIndicatorInsets={SCROLL_INDICATOR_INSET_FIX}
      >
        {wallets.map((wallet, index) => (
          <WalletShareSummaryRow
            key={wallet.id}
            wallet={wallet}
            mode={modeById.get(wallet.id) ?? 'viewOnly'}
            isLast={index === wallets.length - 1}
          />
        ))}
      </ScrollView>
      <View style={styles.footer}>
        <AlertCardUi4
          type="warning"
          title={lstrings.wallet_share_confirm_warning_title}
          body={
            grantsSpend
              ? lstrings.wallet_share_confirm_warning_body
              : lstrings.wallet_share_confirm_warning_body_view_only
          }
        />
        <SafeSlider
          disabled={false}
          confirmText={lstrings.wallet_share_confirm_slide}
          parentStyle={styles.slider}
          onSlidingComplete={handleSlidingComplete}
        />
        <ModalButtons
          tertiary={{
            label: lstrings.string_cancel_cap,
            onPress: handleCancel
          }}
        />
      </View>
    </EdgeModal>
  )
}

const getStyles = cacheStyles((theme: Theme) => ({
  list: {
    flexGrow: 0,
    flexShrink: 1
  },
  footer: {
    flexShrink: 0
  },
  slider: {
    alignSelf: 'center',
    marginTop: theme.rem(0.5)
  }
}))
