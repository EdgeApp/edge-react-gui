import type { EdgeCurrencyWallet, EdgeWalletShareSpec } from 'edge-core-js'
import * as React from 'react'
import { type ListRenderItem, Switch, View } from 'react-native'
import type { AirshipBridge } from 'react-native-airship'
import { FlatList } from 'react-native-gesture-handler'
import { sprintf } from 'sprintf-js'

import { useHandler } from '../../hooks/useHandler'
import { useWalletName } from '../../hooks/useWalletName'
import { lstrings } from '../../locales/strings'
import { ModalButtons } from '../buttons/ModalButtons'
import { EdgeCard } from '../cards/EdgeCard'
import { CryptoIcon } from '../icons/CryptoIcon'
import { cacheStyles, type Theme, useTheme } from '../services/ThemeContext'
import { EdgeText } from '../themed/EdgeText'
import { EdgeModal } from './EdgeModal'

interface Props {
  /** Resolves to one spec per wallet, in the given order, or undefined. */
  bridge: AirshipBridge<EdgeWalletShareSpec[] | undefined>
  wallets: EdgeCurrencyWallet[]
}

/**
 * Why a wallet's spend toggle is pinned, if it is.
 *
 * - `spendOnly`: the currency needs a private key just to sync (Monero and
 *   friends), so view-only sharing is impossible.
 * - `viewOnlySource`: this account holds the wallet view-only itself, so it
 *   has no spend keys to hand out.
 */
type Pin = 'spendOnly' | 'viewOnlySource' | undefined

function pinFor(wallet: EdgeCurrencyWallet): Pin {
  if (wallet.currencyInfo.unsafeSyncNetwork === true) return 'spendOnly'
  if (!wallet.canSign) return 'viewOnlySource'
  return undefined
}

/**
 * Per-wallet spend toggle. Everything starts off (view-only), because spend
 * access is the irreversible grant and should be a deliberate flip.
 */
export const WalletShareModeModal: React.FC<Props> = props => {
  const { bridge, wallets } = props

  const [spendIds, setSpendIds] = React.useState<Set<string>>(() => {
    const ids = new Set<string>()
    for (const wallet of wallets) {
      if (pinFor(wallet) === 'spendOnly') ids.add(wallet.id)
    }
    return ids
  })

  const handleCancel = useHandler(() => {
    bridge.resolve(undefined)
  })
  const handleToggle = useHandler((walletId: string, value: boolean) => {
    setSpendIds(prev => {
      const next = new Set(prev)
      if (value) next.add(walletId)
      else next.delete(walletId)
      return next
    })
  })
  const handleNext = useHandler(() => {
    bridge.resolve(
      wallets.map(wallet => ({
        walletId: wallet.id,
        mode: spendIds.has(wallet.id) ? 'spend' : 'viewOnly'
      }))
    )
  })

  const renderRow: ListRenderItem<EdgeCurrencyWallet> = useHandler(
    ({ item }) => (
      <ModeRow
        wallet={item}
        spend={spendIds.has(item.id)}
        onToggle={handleToggle}
      />
    )
  )

  return (
    <EdgeModal
      bridge={bridge}
      title={lstrings.wallet_share_mode_title}
      onCancel={handleCancel}
    >
      <FlatList
        data={wallets}
        extraData={spendIds}
        keyExtractor={keyExtractor}
        renderItem={renderRow}
      />
      <ModalButtons
        primary={{
          label: lstrings.string_next_capitalized,
          onPress: handleNext
        }}
      />
    </EdgeModal>
  )
}

const keyExtractor = (wallet: EdgeCurrencyWallet): string => wallet.id

interface ModeRowProps {
  wallet: EdgeCurrencyWallet
  spend: boolean
  onToggle: (walletId: string, value: boolean) => void
}

const ModeRowComponent: React.FC<ModeRowProps> = props => {
  const { wallet, spend, onToggle } = props
  const theme = useTheme()
  const styles = getStyles(theme)
  const walletName = useWalletName(wallet)
  const { currencyCode, displayName, pluginId } = wallet.currencyInfo
  const pin = pinFor(wallet)

  const handleValueChange = useHandler((value: boolean) => {
    onToggle(wallet.id, value)
  })

  const footnote =
    pin === 'spendOnly'
      ? sprintf(lstrings.wallet_share_mode_spend_only_1s, displayName)
      : pin === 'viewOnlySource'
      ? sprintf(lstrings.wallet_share_mode_view_only_source_1s, walletName)
      : null

  return (
    <EdgeCard>
      <View style={styles.row}>
        <CryptoIcon pluginId={pluginId} tokenId={null} sizeRem={2} />
        <View style={styles.textColumn}>
          <EdgeText style={styles.currencyCode}>{currencyCode}</EdgeText>
          <EdgeText style={styles.walletName}>{walletName}</EdgeText>
        </View>
        <Switch
          disabled={pin != null}
          ios_backgroundColor={theme.toggleButtonOff}
          trackColor={{
            false: theme.toggleButtonOff,
            true: theme.toggleButton
          }}
          value={spend}
          onValueChange={handleValueChange}
        />
      </View>
      {footnote == null ? null : (
        <EdgeText style={styles.footnote} numberOfLines={2}>
          {footnote}
        </EdgeText>
      )}
    </EdgeCard>
  )
}
const ModeRow = React.memo(ModeRowComponent)

const getStyles = cacheStyles((theme: Theme) => ({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: theme.rem(0.25)
  },
  textColumn: {
    flexGrow: 1,
    flexShrink: 1,
    marginHorizontal: theme.rem(0.5)
  },
  currencyCode: {
    fontFamily: theme.fontFaceMedium
  },
  walletName: {
    fontSize: theme.rem(0.75),
    color: theme.secondaryText
  },
  footnote: {
    fontSize: theme.rem(0.75),
    color: theme.warningText,
    marginHorizontal: theme.rem(0.25),
    marginBottom: theme.rem(0.25)
  }
}))
