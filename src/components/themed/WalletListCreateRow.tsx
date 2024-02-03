import { EdgeCurrencyWallet, EdgeTokenId } from 'edge-core-js'
import * as React from 'react'
import { View } from 'react-native'
import { TouchableOpacity } from 'react-native-gesture-handler'

import { createWallet, CreateWalletOptions, getUniqueWalletName } from '../../actions/CreateWalletActions'
import { approveTokenTerms } from '../../actions/TokenTermsActions'
import { showFullScreenSpinner } from '../../components/modals/AirshipFullScreenSpinner'
import { Airship, showError } from '../../components/services/AirshipInstance'
import { getPluginId } from '../../constants/WalletAndCurrencyConstants'
import { useHandler } from '../../hooks/useHandler'
import { useWatch } from '../../hooks/useWatch'
import { lstrings } from '../../locales/strings'
import { useDispatch, useSelector } from '../../types/reactRedux'
import { ThunkAction } from '../../types/reduxTypes'
import { getTokenIdForced } from '../../util/CurrencyInfoHelpers'
import { logEvent, TrackingEventName } from '../../util/tracking'
import { ListModal } from '../modals/ListModal'
import { cacheStyles, Theme, useTheme } from '../services/ThemeContext'
import { CryptoIconUi4 } from '../ui4/CryptoIconUi4'
import { EdgeText } from './EdgeText'
import { WalletListCurrencyRow } from './WalletListCurrencyRow'

export interface WalletListCreateRowProps {
  currencyCode: string
  currencyName: string
  trackingEventFailed?: TrackingEventName
  trackingEventSuccess?: TrackingEventName
  createWalletIds?: string[]
  pluginId: string
  walletType?: string

  onPress?: (walletId: string, tokenId: EdgeTokenId) => void
}

export const WalletListCreateRowComponent = (props: WalletListCreateRowProps) => {
  const {
    currencyCode,
    currencyName = '',
    trackingEventFailed,
    trackingEventSuccess,

    createWalletIds = [],
    walletType,
    pluginId,

    // Callbacks:
    onPress
  } = props
  const account = useSelector(state => state.core.account)
  const currencyWallets = useWatch(account, 'currencyWallets')

  const dispatch = useDispatch()
  const theme = useTheme()
  const styles = getStyles(theme)

  const tokenId = getTokenIdForced(account, pluginId, currencyCode)

  const networkName = pluginId != null && tokenId != null ? ` (${account.currencyConfig[pluginId].currencyInfo.displayName})` : ''

  const pressMutexRef = React.useRef<boolean>(false)

  const handlePress = useHandler(async () => {
    if (pressMutexRef.current) {
      return
    }
    pressMutexRef.current = true

    const handleRes = (walletId: string) => (onPress != null ? onPress(walletId, tokenId) : null)
    if (walletType != null) {
      await dispatch(createAndSelectWallet({ walletType }))
        .then(handleRes)
        .catch(err => showError(err))
        .finally(() => (pressMutexRef.current = false))
    } else if (pluginId != null && tokenId != null) {
      if (createWalletIds.length < 2) {
        await dispatch(
          createAndSelectToken({
            tokenId,
            pluginId,
            createWalletId: createWalletIds[0],
            trackingEventFailed: trackingEventFailed,
            trackingEventSuccess: trackingEventSuccess
          })
        )
          .then(handleRes)
          .catch(err => showError(err))
          .finally(() => (pressMutexRef.current = false))
      } else {
        await Airship.show(bridge => {
          const renderRow = (wallet: EdgeCurrencyWallet) => (
            <WalletListCurrencyRow
              tokenId={null}
              wallet={wallet}
              onPress={async walletId => {
                await dispatch(
                  createAndSelectToken({
                    tokenId,
                    pluginId: currencyWallets[walletId].currencyInfo.pluginId,
                    createWalletId: walletId,
                    trackingEventFailed: trackingEventFailed,
                    trackingEventSuccess: trackingEventSuccess
                  })
                )
                  .then(handleRes)
                  .finally(() => {
                    pressMutexRef.current = false
                    bridge.resolve()
                  })
              }}
            />
          )

          return (
            <ListModal<EdgeCurrencyWallet>
              bridge={bridge}
              title={lstrings.select_wallet}
              textInput={false}
              fullScreen={false}
              rowComponent={renderRow}
              rowsData={createWalletIds.map(walletId => currencyWallets[walletId])}
            />
          )
        })
          .catch(err => showError(err))
          .finally(() => (pressMutexRef.current = false))
      }
    }

    pressMutexRef.current = false
  })

  return (
    <TouchableOpacity style={styles.row} onPress={handlePress}>
      <CryptoIconUi4 marginRem={1} pluginId={pluginId} sizeRem={2} tokenId={tokenId} />
      <View style={styles.nameColumn}>
        <EdgeText style={styles.currencyText}>{`${currencyCode}${networkName}`}</EdgeText>
        <EdgeText style={styles.nameText}>{currencyName}</EdgeText>
      </View>
      <View style={styles.labelColumn}>
        <EdgeText style={styles.labelText}>{walletType != null ? lstrings.fragment_create_wallet_create_wallet : lstrings.wallet_list_add_token}</EdgeText>
      </View>
    </TouchableOpacity>
  )
}

function createAndSelectToken({
  tokenId,
  pluginId,
  createWalletId,
  trackingEventFailed,
  trackingEventSuccess
}: {
  tokenId: string
  pluginId: string
  trackingEventFailed?: TrackingEventName
  trackingEventSuccess?: TrackingEventName
  createWalletId?: string
}): ThunkAction<Promise<string>> {
  return async (dispatch, getState) => {
    const state = getState()
    const { account } = state.core
    const { defaultIsoFiat } = state.ui.settings
    const { walletType } = account.currencyConfig[pluginId].currencyInfo

    try {
      // Try to find existing Parent Edge Wallet, if no specific wallet was given
      const { currencyWallets } = account
      const parentWalletId = createWalletId ?? Object.keys(currencyWallets).find(walletId => currencyWallets[walletId].currencyInfo.pluginId === pluginId)
      const wallet: EdgeCurrencyWallet =
        parentWalletId != null
          ? currencyWallets[parentWalletId]
          : // If no parent chain wallet exists, create it
            await showFullScreenSpinner(
              lstrings.wallet_list_modal_enabling_token,
              (async (): Promise<EdgeCurrencyWallet> => {
                return await createWallet(account, {
                  walletType,
                  walletName: getUniqueWalletName(account, pluginId),
                  fiatCurrencyCode: defaultIsoFiat
                })
              })()
            )

      // Show the user the token terms modal only once
      await approveTokenTerms(wallet)

      await wallet.changeEnabledTokenIds([...wallet.enabledTokenIds, tokenId])
      if (trackingEventSuccess != null) logEvent(trackingEventSuccess)
      return wallet.id
    } catch (error: any) {
      showError(error)
      if (trackingEventFailed != null) logEvent(trackingEventFailed, { error: String(error) })
    }
    return ''
  }
}

function createAndSelectWallet({ walletType, fiatCurrencyCode }: CreateWalletOptions): ThunkAction<Promise<string>> {
  return async (dispatch, getState) => {
    const state = getState()
    const { account } = state.core
    const walletName = getUniqueWalletName(account, getPluginId(walletType))
    try {
      const wallet = await showFullScreenSpinner(
        lstrings.wallet_list_modal_creating_wallet,
        createWallet(account, { walletName, walletType, fiatCurrencyCode })
      )
      return wallet.id
    } catch (error: any) {
      showError(error)
    }
    return ''
  }
}

/**
 * Renders a WalletListRow with "Create Wallet" children
 * */
const getStyles = cacheStyles((theme: Theme) => ({
  // Layout:
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    marginLeft: theme.rem(0.5),
    minHeight: theme.rem(4.25)
  },
  labelColumn: {
    justifyContent: 'center',
    paddingRight: theme.rem(1)
  },
  nameColumn: {
    flexDirection: 'column',
    flexGrow: 1,
    flexShrink: 1,
    marginRight: theme.rem(0.5)
  },

  // Text:
  currencyText: {
    flexBasis: 'auto',
    flexShrink: 1,
    fontFamily: theme.fontFaceMedium
  },
  labelText: {
    fontFamily: theme.fontFaceMedium
  },
  nameText: {
    fontSize: theme.rem(0.75),
    color: theme.secondaryText
  }
}))

export const WalletListCreateRow = React.memo(WalletListCreateRowComponent)
