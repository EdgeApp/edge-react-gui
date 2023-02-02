import { EdgeCurrencyWallet } from 'edge-core-js'
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
import s from '../../locales/strings'
import { useDispatch, useSelector } from '../../types/reactRedux'
import { ThunkAction } from '../../types/reduxTypes'
import { getCreateWalletType } from '../../util/CurrencyInfoHelpers'
import { logEvent, TrackingEventName } from '../../util/tracking'
import { CryptoIcon } from '../icons/CryptoIcon'
import { ListModal } from '../modals/ListModal'
import { cacheStyles, Theme, useTheme } from '../services/ThemeContext'
import { EdgeText } from './EdgeText'
import { WalletListCurrencyRow } from './WalletListCurrencyRow'

export interface WalletListCreateRowProps {
  currencyCode: string
  currencyName: string
  trackingEventFailed?: TrackingEventName
  trackingEventSuccess?: TrackingEventName
  createWalletIds?: string[]
  pluginId?: string
  walletType?: string

  onPress?: (walletId: string, currencyCode: string) => void
}

export const WalletListCreateRowComponent = (props: WalletListCreateRowProps) => {
  const {
    currencyCode = '',
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

  const handlePress = useHandler(() => {
    // @ts-expect-error
    const handleRes = walletId => (onPress != null ? onPress(walletId, currencyCode) : null)
    if (walletType != null) {
      dispatch(createAndSelectWallet({ walletType })).then(handleRes)
    } else if (pluginId != null) {
      if (createWalletIds.length < 2) {
        dispatch(
          createAndSelectToken({
            tokenCode: currencyCode,
            pluginId,
            createWalletId: createWalletIds[0],
            trackingEventFailed: trackingEventFailed,
            trackingEventSuccess: trackingEventSuccess
          })
        ).then(handleRes)
      } else {
        Airship.show(bridge => {
          const renderRow = (wallet: EdgeCurrencyWallet) => (
            <WalletListCurrencyRow
              wallet={wallet}
              onPress={walletId => {
                dispatch(
                  createAndSelectToken({
                    tokenCode: currencyCode,
                    pluginId: currencyWallets[walletId].currencyInfo.pluginId,
                    createWalletId: walletId,
                    trackingEventFailed: trackingEventFailed,
                    trackingEventSuccess: trackingEventSuccess
                  })
                )
                  .then(handleRes)
                  .finally(() => bridge.resolve())
              }}
            />
          )

          return (
            <ListModal<EdgeCurrencyWallet>
              bridge={bridge}
              title={s.strings.select_wallet}
              textInput={false}
              fullScreen={false}
              rowComponent={renderRow}
              rowsData={createWalletIds.map(walletId => currencyWallets[walletId])}
            />
          )
        })
      }
    }
  })

  return (
    <TouchableOpacity style={styles.row} onPress={handlePress}>
      <CryptoIcon currencyCode={currencyCode} marginRem={1} pluginId={pluginId} sizeRem={2} />
      <View style={styles.nameColumn}>
        <EdgeText style={styles.currencyText}>{currencyCode}</EdgeText>
        <EdgeText style={styles.nameText}>{currencyName}</EdgeText>
      </View>
      <View style={styles.labelColumn}>
        <EdgeText style={styles.labelText}>{walletType != null ? s.strings.fragment_create_wallet_create_wallet : s.strings.wallet_list_add_token}</EdgeText>
      </View>
    </TouchableOpacity>
  )
}

function createAndSelectToken({
  tokenCode,
  pluginId,
  createWalletId,
  trackingEventFailed,
  trackingEventSuccess
}: {
  tokenCode: string
  pluginId: string
  trackingEventFailed?: TrackingEventName
  trackingEventSuccess?: TrackingEventName
  createWalletId?: string
}): ThunkAction<Promise<string>> {
  return async (dispatch, getState) => {
    const state = getState()
    const { account, disklet } = state.core
    const { defaultIsoFiat } = state.ui.settings
    const parentCurrencyCode = account.currencyConfig[pluginId].currencyInfo.currencyCode

    try {
      // Show the user the token terms modal only once
      await approveTokenTerms(disklet, parentCurrencyCode)

      // Try to find existing Parent Edge Wallet, if no specific wallet was given
      const { currencyWallets } = account
      const parentWalletId =
        createWalletId ?? Object.keys(currencyWallets).find(walletId => currencyWallets[walletId].currencyInfo.currencyCode === parentCurrencyCode)
      const wallet: EdgeCurrencyWallet =
        parentWalletId != null
          ? currencyWallets[parentWalletId]
          : // If no parent chain wallet exists, create it
            await showFullScreenSpinner(
              s.strings.wallet_list_modal_enabling_token,
              (async (): Promise<EdgeCurrencyWallet> => {
                const { walletType } = getCreateWalletType(account, parentCurrencyCode) ?? {}
                if (walletType == null) throw new Error(s.strings.create_wallet_failed_message)
                return await createWallet(account, {
                  walletType,
                  walletName: getUniqueWalletName(account, pluginId),
                  fiatCurrencyCode: defaultIsoFiat
                })
              })()
            )
      await wallet.enableTokens([tokenCode])
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
        s.strings.wallet_list_modal_creating_wallet,
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
