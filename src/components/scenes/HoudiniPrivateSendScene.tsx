import { div, gt, mul, round } from 'biggystring'
import type { EdgeTokenId } from 'edge-core-js'
import * as React from 'react'
import { sprintf } from 'sprintf-js'

import { useHandler } from '../../hooks/useHandler'
import { lstrings } from '../../locales/strings'
import { getExchangeDenom } from '../../selectors/DenominationSelectors'
import { useState } from '../../types/reactHooks'
import { useSelector } from '../../types/reactRedux'
import type { EdgeAppSceneProps, NavigationBase } from '../../types/routerTypes'
import { getCurrencyCode } from '../../util/CurrencyInfoHelpers'
import { getWalletName } from '../../util/CurrencyWalletHelpers'
import {
  fetchHoudiniPrivateQuote,
  HOUDINI_DESTINATION_ASSETS,
  HOUDINI_DESTINATION_EDGE_ASSETS,
  type HoudiniDestinationAsset,
  isAssetDisabled,
  isValidHoudiniDestination
} from '../../util/houdiniPrivateSend'
import { zeroString } from '../../util/utils'
import { ButtonsView } from '../buttons/ButtonsView'
import { EdgeCard } from '../cards/EdgeCard'
import { SceneWrapper } from '../common/SceneWrapper'
import { SectionHeader } from '../common/SectionHeader'
import { ConfirmContinueModal } from '../modals/ConfirmContinueModal'
import { TextInputModal } from '../modals/TextInputModal'
import {
  WalletListModal,
  type WalletListResult
} from '../modals/WalletListModal'
import { Airship, showError } from '../services/AirshipInstance'
import { cacheStyles, type Theme, useTheme } from '../services/ThemeContext'
import { EdgeText } from '../themed/EdgeText'

interface Props extends EdgeAppSceneProps<'houdiniPrivateSend'> {}

/**
 * A Houdini private send: pick a funded source wallet, pick a destination asset
 * (both via the shared `WalletListModal`), paste a destination address, get a
 * live private quote, then create the exchange order and broadcast the on-chain
 * deposit through core's swap-to-address path.
 */
export const HoudiniPrivateSendScene: React.FC<Props> = props => {
  const { navigation } = props
  const theme = useTheme()
  const styles = getStyles(theme)

  const account = useSelector(state => state.core.account)
  const currencyWallets = useSelector(
    state => state.core.account.currencyWallets
  )
  const disablePlugins = useSelector(
    state => state.ui.exchangeInfo.swap.disablePlugins
  )
  const disableAssets = useSelector(
    state => state.ui.exchangeInfo.swap.disableAssets
  )

  const [fromWalletId, setFromWalletId] = useState<string | undefined>(
    undefined
  )
  const [fromTokenId, setFromTokenId] = useState<EdgeTokenId>(null)
  const [destAsset, setDestAsset] = useState<
    HoudiniDestinationAsset | undefined
  >(undefined)
  const [toAddress, setToAddress] = useState<string | undefined>(undefined)
  const [displayAmount, setDisplayAmount] = useState<string | undefined>(
    undefined
  )
  const [pending, setPending] = useState(false)

  const fromWallet =
    fromWalletId != null ? currencyWallets[fromWalletId] : undefined

  const handlePickSource = useHandler(async () => {
    if (pending) return
    const result = await Airship.show<WalletListResult>(bridge => (
      <WalletListModal
        bridge={bridge}
        // WalletListModal still types `navigation` as the deprecated
        // NavigationBase; mirror the established call sites until it migrates.
        // eslint-disable-next-line @typescript-eslint/no-deprecated
        navigation={navigation as NavigationBase}
        headerTitle={lstrings.select_src_wallet}
        allowKeysOnlyMode
      />
    ))
    if (result?.type === 'wallet') {
      setFromWalletId(result.walletId)
      setFromTokenId(result.tokenId)
    }
  })

  const handlePickDestAsset = useHandler(async () => {
    if (pending) return
    // Reuse the shared wallet picker, filtered to the chains Houdini can
    // privately route to, so the destination chain is chosen with the same
    // control as the source rather than a bespoke picker.
    const result = await Airship.show<WalletListResult>(bridge => (
      <WalletListModal
        bridge={bridge}
        // eslint-disable-next-line @typescript-eslint/no-deprecated
        navigation={navigation as NavigationBase}
        headerTitle={lstrings.houdini_ps_select_dest_asset}
        allowedAssets={HOUDINI_DESTINATION_EDGE_ASSETS}
        showCreateWallet
      />
    ))
    if (result?.type !== 'wallet') return
    const selectedWallet = currencyWallets[result.walletId]
    if (selectedWallet == null) return
    const asset = HOUDINI_DESTINATION_ASSETS.find(
      candidate => candidate.pluginId === selectedWallet.currencyInfo.pluginId
    )
    if (asset != null) {
      setDestAsset(asset)
      // A new destination chain invalidates a previously entered address:
      setToAddress(undefined)
    }
  })

  const handleEnterAddress = useHandler(async () => {
    if (pending) return
    if (destAsset == null) {
      showError(lstrings.houdini_ps_pick_dest_asset_first)
      return
    }
    const asset = destAsset
    const address = await Airship.show<string | undefined>(bridge => (
      <TextInputModal
        bridge={bridge}
        title={lstrings.houdini_ps_dest_address}
        message={lstrings.houdini_ps_paste_address_hint}
        initialValue={toAddress}
        autoCorrect={false}
        submitLabel={lstrings.submit}
        onSubmit={async text => {
          if (!isValidHoudiniDestination(asset, text)) {
            return lstrings.houdini_ps_invalid_address
          }
          return true
        }}
      />
    ))
    if (address != null && address.trim() !== '') {
      setToAddress(address.trim())
    }
  })

  const handleEnterAmount = useHandler(async () => {
    if (pending) return
    if (fromWallet == null) {
      showError(lstrings.houdini_ps_pick_source_first)
      return
    }
    const amount = await Airship.show<string | undefined>(bridge => (
      <TextInputModal
        bridge={bridge}
        title={lstrings.houdini_ps_amount}
        message={lstrings.houdini_ps_enter_amount}
        initialValue={displayAmount}
        keyboardType="decimal-pad"
        submitLabel={lstrings.submit}
      />
    ))
    if (amount != null && amount.trim() !== '') {
      setDisplayAmount(amount.trim())
    }
  })

  const handleGetQuote = useHandler(async () => {
    if (pending) return
    if (
      fromWallet == null ||
      destAsset == null ||
      toAddress == null ||
      displayAmount == null ||
      zeroString(displayAmount)
    ) {
      showError(lstrings.houdini_ps_missing_fields)
      return
    }

    // Honor the exchange-info asset disables, matching the swap flow.
    if (
      isAssetDisabled(
        disableAssets.source,
        fromWallet.currencyInfo.pluginId,
        fromTokenId
      )
    ) {
      showError(
        sprintf(
          lstrings.swap_token_no_enabled_exchanges_2s,
          getCurrencyCode(fromWallet, fromTokenId),
          fromWallet.currencyInfo.displayName
        )
      )
      return
    }
    if (
      isAssetDisabled(
        disableAssets.destination,
        destAsset.pluginId,
        destAsset.tokenId
      )
    ) {
      showError(
        sprintf(
          lstrings.swap_token_no_enabled_exchanges_2s,
          destAsset.currencyCode,
          destAsset.displayName
        )
      )
      return
    }

    setPending(true)
    try {
      const fromMultiplier = getExchangeDenom(
        fromWallet.currencyConfig,
        fromTokenId
      ).multiplier
      const nativeAmount = round(mul(displayAmount, fromMultiplier), 0)

      // Don't let the user reach confirm/approve with more than they hold.
      const balance = fromWallet.balanceMap.get(fromTokenId) ?? '0'
      if (gt(nativeAmount, balance)) {
        showError(lstrings.exchange_insufficient_funds_below_balance)
        return
      }

      const quote = await fetchHoudiniPrivateQuote(account, {
        fromWallet,
        fromTokenId,
        toPluginId: destAsset.pluginId,
        toTokenId: destAsset.tokenId,
        toAddress,
        nativeAmount,
        disablePlugins
      })

      const toConfig = account.currencyConfig[destAsset.pluginId]
      const toMultiplier = getExchangeDenom(
        toConfig,
        destAsset.tokenId
      ).multiplier
      const fromDisplay = div(quote.fromNativeAmount, fromMultiplier, 8)
      const toDisplay = div(quote.toNativeAmount, toMultiplier, 8)

      const fromCurrencyCode =
        fromTokenId == null
          ? fromWallet.currencyInfo.currencyCode
          : fromWallet.currencyConfig.allTokens[fromTokenId]?.currencyCode ??
            fromWallet.currencyInfo.currencyCode

      const confirmed = await Airship.show<boolean>(bridge => (
        <ConfirmContinueModal
          bridge={bridge}
          title={lstrings.houdini_ps_confirm_send}
          body={`${fromDisplay} ${fromCurrencyCode} → ~${toDisplay} ${destAsset.currencyCode}\n\n${lstrings.houdini_ps_confirm_body}`}
          warning
        />
      ))
      if (!confirmed) return

      const result = await quote.approve()
      navigation.navigate('swapSuccess', {
        edgeTransaction: result.transaction,
        walletId: fromWallet.id
      })
    } catch (error: unknown) {
      showError(error)
    } finally {
      setPending(false)
    }
  })

  const sourceLabel =
    fromWallet == null
      ? lstrings.houdini_ps_select_source
      : getWalletName(fromWallet)
  const destLabel =
    destAsset == null
      ? lstrings.houdini_ps_select_dest_asset
      : `${destAsset.displayName} (${destAsset.currencyCode})`
  const addressLabel = toAddress ?? lstrings.houdini_ps_enter_dest_address
  const amountLabel = displayAmount ?? lstrings.houdini_ps_enter_amount

  return (
    <SceneWrapper scroll hasHeader>
      <SectionHeader leftTitle={lstrings.houdini_private_send_title} />

      <EdgeCard onPress={handlePickSource}>
        <EdgeText style={styles.rowLabel}>
          {lstrings.houdini_ps_source_wallet}
        </EdgeText>
        <EdgeText style={styles.rowValue} numberOfLines={1}>
          {sourceLabel}
        </EdgeText>
      </EdgeCard>

      <EdgeCard onPress={handlePickDestAsset}>
        <EdgeText style={styles.rowLabel}>
          {lstrings.houdini_ps_dest_asset}
        </EdgeText>
        <EdgeText style={styles.rowValue} numberOfLines={1}>
          {destLabel}
        </EdgeText>
      </EdgeCard>

      <EdgeCard onPress={handleEnterAddress}>
        <EdgeText style={styles.rowLabel}>
          {lstrings.houdini_ps_dest_address}
        </EdgeText>
        <EdgeText style={styles.rowValue} numberOfLines={2}>
          {addressLabel}
        </EdgeText>
      </EdgeCard>

      <EdgeCard onPress={handleEnterAmount}>
        <EdgeText style={styles.rowLabel}>
          {lstrings.houdini_ps_amount}
        </EdgeText>
        <EdgeText style={styles.rowValue} numberOfLines={1}>
          {amountLabel}
        </EdgeText>
      </EdgeCard>

      <ButtonsView
        primary={{
          label: lstrings.houdini_ps_get_quote,
          onPress: handleGetQuote,
          disabled: pending,
          spinner: pending
        }}
      />
    </SceneWrapper>
  )
}

const getStyles = cacheStyles((theme: Theme) => ({
  rowLabel: {
    color: theme.secondaryText,
    fontSize: theme.rem(0.75)
  },
  rowValue: {
    marginTop: theme.rem(0.25)
  }
}))
