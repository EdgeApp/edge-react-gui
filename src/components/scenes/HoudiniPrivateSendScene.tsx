import { div, mul, round } from 'biggystring'
import type {
  EdgeCurrencyConfig,
  EdgeSwapQuote,
  EdgeSwapRequest,
  EdgeSwapToAddressInfo,
  EdgeTokenId
} from 'edge-core-js'
import * as React from 'react'

import { useHandler } from '../../hooks/useHandler'
import { lstrings } from '../../locales/strings'
import { useState } from '../../types/reactHooks'
import { useSelector } from '../../types/reactRedux'
import type { EdgeAppSceneProps, NavigationBase } from '../../types/routerTypes'
import { getWalletName } from '../../util/CurrencyWalletHelpers'
import {
  HOUDINI_DESTINATION_ASSETS,
  type HoudiniDestinationAsset,
  isValidHoudiniDestination
} from '../../util/houdiniPrivateSend'
import { ButtonsView } from '../buttons/ButtonsView'
import { EdgeCard } from '../cards/EdgeCard'
import { SceneWrapper } from '../common/SceneWrapper'
import { SectionHeader } from '../common/SectionHeader'
import { ConfirmContinueModal } from '../modals/ConfirmContinueModal'
import { RadioListModal } from '../modals/RadioListModal'
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
 * The primary-unit multiplier for an asset, used to convert a user-entered
 * display amount to and from a native (atomic) amount.
 */
function getPrimaryMultiplier(
  currencyConfig: EdgeCurrencyConfig,
  tokenId: EdgeTokenId
): string {
  const { allTokens, currencyInfo } = currencyConfig
  const denominations =
    tokenId == null
      ? currencyInfo.denominations
      : allTokens[tokenId]?.denominations ?? currencyInfo.denominations
  return denominations[0].multiplier
}

/**
 * A minimal prototype flow for a Houdini private send: pick a funded source
 * wallet, pick a destination asset from the supported set, paste a destination
 * address, get a live private quote, then create the exchange order and
 * broadcast the on-chain deposit through core's swap-to-address path.
 */
export const HoudiniPrivateSendScene: React.FC<Props> = props => {
  const { navigation } = props
  const theme = useTheme()
  const styles = getStyles(theme)

  const account = useSelector(state => state.core.account)
  const currencyWallets = useSelector(
    state => state.core.account.currencyWallets
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
    const selected = await Airship.show<string | undefined>(bridge => (
      <RadioListModal
        bridge={bridge}
        title={lstrings.houdini_ps_select_dest_asset}
        items={HOUDINI_DESTINATION_ASSETS.map(asset => ({
          icon: '',
          name: `${asset.displayName} (${asset.currencyCode})`
        }))}
        selected={
          destAsset == null
            ? undefined
            : `${destAsset.displayName} (${destAsset.currencyCode})`
        }
      />
    ))
    if (selected == null) return
    const asset = HOUDINI_DESTINATION_ASSETS.find(
      candidate =>
        `${candidate.displayName} (${candidate.currencyCode})` === selected
    )
    if (asset != null) {
      setDestAsset(asset)
      // A new destination chain invalidates a previously entered address:
      setToAddress(undefined)
    }
  })

  const handleEnterAddress = useHandler(async () => {
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
    if (
      fromWallet == null ||
      destAsset == null ||
      toAddress == null ||
      displayAmount == null
    ) {
      showError(lstrings.houdini_ps_missing_fields)
      return
    }
    setPending(true)
    try {
      const fromMultiplier = getPrimaryMultiplier(
        fromWallet.currencyConfig,
        fromTokenId
      )
      const nativeAmount = round(mul(displayAmount, fromMultiplier), 0)

      const toAddressInfo: EdgeSwapToAddressInfo = {
        toPluginId: destAsset.pluginId,
        toTokenId: destAsset.tokenId,
        toAddress
      }
      const request: EdgeSwapRequest = {
        fromWallet,
        fromTokenId,
        toTokenId: destAsset.tokenId,
        toAddressInfo,
        nativeAmount,
        quoteFor: 'from'
      }

      // Restrict the prototype to Houdini: a swap-to-address request would
      // otherwise fan out to every central provider, creating junk orders and
      // burning their quotas.
      const disabled: Record<string, true> = {}
      for (const pluginId of Object.keys(account.swapConfig)) {
        if (pluginId !== 'houdini') disabled[pluginId] = true
      }

      const quotes = await account.fetchSwapQuotes(request, {
        preferPluginId: 'houdini',
        disabled
      })
      const quote: EdgeSwapQuote | undefined =
        quotes.find(candidate => candidate.pluginId === 'houdini') ?? quotes[0]
      if (quote == null) {
        showError(lstrings.houdini_ps_no_quote)
        return
      }

      const toConfig = account.currencyConfig[destAsset.pluginId]
      const toMultiplier = getPrimaryMultiplier(toConfig, destAsset.tokenId)
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
