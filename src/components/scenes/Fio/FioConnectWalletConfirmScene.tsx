import { EdgeCurrencyWallet } from 'edge-core-js'
import * as React from 'react'
import { View } from 'react-native'

import { useHandler } from '../../../hooks/useHandler'
import { lstrings } from '../../../locales/strings'
import { CcWalletMap } from '../../../reducers/FioReducer'
import { useDispatch, useSelector } from '../../../types/reactRedux'
import { EdgeAppSceneProps } from '../../../types/routerTypes'
import { getWalletName } from '../../../util/CurrencyWalletHelpers'
import {
  FIO_NO_BUNDLED_ERR_CODE,
  FioConnectAddress,
  updatePubAddressesForFioAddress
} from '../../../util/FioAddressUtils'
import { EdgeCard } from '../../cards/EdgeCard'
import { SceneWrapper } from '../../common/SceneWrapper'
import { FioConnectionWalletItem } from '../../FioAddress/ConnectWallets'
import { withWallet } from '../../hoc/withWallet'
import { ButtonsModal } from '../../modals/ButtonsModal'
import { EdgeRow } from '../../rows/EdgeRow'
import { Airship, showError, showToast } from '../../services/AirshipInstance'
import { cacheStyles, Theme, useTheme } from '../../services/ThemeContext'
import { EdgeText } from '../../themed/EdgeText'
import { SceneHeader } from '../../themed/SceneHeader'
import { Slider } from '../../themed/Slider'
import { Radio } from '../../themed/ThemedButtons'

export interface FioConnectWalletConfirmParams {
  fioAddressName: string
  walletId: string
  walletsToConnect: FioConnectionWalletItem[]
  walletsToDisconnect: FioConnectionWalletItem[]
}

interface FioConnectWalletConfirmProps
  extends EdgeAppSceneProps<'fioConnectToWalletsConfirm'> {
  wallet: EdgeCurrencyWallet
}

export const FioConnectWalletConfirmComponent = (
  props: FioConnectWalletConfirmProps
) => {
  const { wallet: fioWallet, navigation, route } = props
  const theme = useTheme()
  const styles = getStyles(theme)
  const dispatch = useDispatch()

  const { fioAddressName, walletsToConnect, walletsToDisconnect } = route.params

  const account = useSelector(state => state.core.account)
  const ccWalletMap = useSelector(
    state => state.ui.fio.connectedWalletsByFioAddress[fioAddressName] ?? {}
  )
  const isConnected = useSelector(state => state.network.isConnected)

  const [acknowledge, setAcknowledge] = React.useState(false)
  const [connectWalletsLoading, setConnectWalletsLoading] =
    React.useState(false)
  const [showSlider, setShowSlider] = React.useState(true)

  const updateConnectedWallets = (
    currentFioAddress: string,
    currentCcWalletMap: CcWalletMap
  ) => {
    dispatch({
      type: 'FIO/UPDATE_CONNECTED_WALLETS_FOR_FIO_ADDRESS',
      data: { fioAddress: currentFioAddress, ccWalletMap: currentCcWalletMap }
    })
  }

  const resetSlider = () => {
    setShowSlider(false)
    requestAnimationFrame(() => {
      setShowSlider(true)
    })
  }

  const handleCheckPress = useHandler(() => {
    setAcknowledge(!acknowledge)
  })

  const renderWalletLine = (item: FioConnectionWalletItem) => {
    const label = `${getWalletName(item.wallet)} (${item.fioTokenCode})`
    return (
      <EdgeText key={item.key} style={styles.content}>
        {label}
      </EdgeText>
    )
  }

  const handleSlideComplete = useHandler(async () => {
    if (!isConnected) {
      showError(lstrings.fio_network_alert_text)
      return
    }

    setConnectWalletsLoading(true)
    const newCcWalletMap = { ...ccWalletMap }

    try {
      // Get a compatible address (less than 128 characters)
      const getCompatibleAddress = async (
        wallet: EdgeCurrencyWallet
      ): Promise<string> => {
        const edgeAddresses = await wallet.getAddresses({ tokenId: null })
        const edgeAddress = edgeAddresses.find(
          edgeAddress => edgeAddress.publicAddress.length <= 128
        )
        if (edgeAddress == null) {
          throw new Error('Address exceeds 128 characters')
        }
        return edgeAddress.publicAddress
      }

      // Connect wallets
      let promiseArray = walletsToConnect.map(
        async (item: FioConnectionWalletItem) => ({
          walletId: item.wallet.id,
          fioChainCode: item.fioChainCode,
          fioTokenCode: item.fioTokenCode,
          publicAddress: await getCompatibleAddress(item.wallet)
        })
      )

      let publicAddresses: FioConnectAddress[] = await Promise.all(promiseArray)

      const { updatedCcWallets, error } = await updatePubAddressesForFioAddress(
        account,
        fioWallet,
        fioAddressName,
        publicAddresses
      )

      if (updatedCcWallets.length) {
        for (const { fullCurrencyCode, walletId } of updatedCcWallets) {
          newCcWalletMap[fullCurrencyCode] = walletId
        }
        updateConnectedWallets(fioAddressName, newCcWalletMap)
      }

      // Disconnect wallets
      promiseArray = walletsToDisconnect.map(
        async (item: FioConnectionWalletItem) => ({
          walletId: item.wallet.id,
          fioChainCode: item.fioChainCode,
          fioTokenCode: item.fioTokenCode,
          publicAddress: await getCompatibleAddress(item.wallet)
        })
      )

      publicAddresses = await Promise.all(promiseArray)

      const { updatedCcWallets: removedCcWallets, error: removedError } =
        await updatePubAddressesForFioAddress(
          account,
          fioWallet,
          fioAddressName,
          publicAddresses,
          false
        )

      if (removedCcWallets.length) {
        for (const { fullCurrencyCode } of removedCcWallets) {
          newCcWalletMap[fullCurrencyCode] = ''
        }
        updateConnectedWallets(fioAddressName, newCcWalletMap)
      }

      const eitherError = error ?? removedError
      if (eitherError != null) {
        const walletsToConnectLeft: FioConnectionWalletItem[] = []
        const walletsToDisconnectLeft: FioConnectionWalletItem[] = []

        // Find wallets that haven't been connected yet
        if (updatedCcWallets.length) {
          for (const walletToConnect of walletsToConnect) {
            if (
              updatedCcWallets.findIndex(
                ({ walletId, fullCurrencyCode }) =>
                  walletId === walletToConnect.wallet.id &&
                  fullCurrencyCode === walletToConnect.fullFioCode
              ) < 0
            ) {
              walletsToConnectLeft.push(walletToConnect)
            }
          }
        }

        // Find wallets that haven't been disconnected yet
        if (removedCcWallets.length) {
          for (const walletToDisconnect of walletsToDisconnect) {
            if (
              removedCcWallets.findIndex(
                ({ walletId, fullCurrencyCode }) =>
                  walletId === walletToDisconnect.wallet.id &&
                  fullCurrencyCode === walletToDisconnect.fullFioCode
              ) < 0
            ) {
              walletsToDisconnectLeft.push(walletToDisconnect)
            }
          }
        }

        if (walletsToConnectLeft.length || walletsToDisconnectLeft.length) {
          navigation.setParams({
            walletId: fioWallet.id,
            fioAddressName,
            walletsToConnect: walletsToConnectLeft,
            walletsToDisconnect: walletsToDisconnectLeft
          })
          resetSlider()
        }
        throw eitherError
      }

      // Show appropriate success message
      if (walletsToConnect.length > 0) {
        showToast(lstrings.fio_connect_wallets_success)
      } else {
        showToast(lstrings.fio_disconnect_wallets_success)
      }

      navigation.goBack()
    } catch (e: any) {
      if (e.code === FIO_NO_BUNDLED_ERR_CODE) {
        const answer = await Airship.show<'ok' | undefined>(bridge => (
          <ButtonsModal
            bridge={bridge}
            title={lstrings.fio_no_bundled_err_msg}
            message={lstrings.fio_no_bundled_add_err_msg}
            buttons={{
              ok: { label: lstrings.title_fio_add_bundled_txs }
            }}
          />
        ))
        if (answer === 'ok') {
          navigation.navigate('fioAddressSettings', {
            showAddBundledTxs: true,
            walletId: fioWallet.id,
            fioAddressName
          })
        }
      } else {
        resetSlider()
        showError(e)
      }
    } finally {
      setConnectWalletsLoading(false)
    }
  })

  return (
    <SceneWrapper scroll>
      <SceneHeader
        title={lstrings.title_fio_connect_to_wallet}
        underline
        withTopMargin
      />
      <View style={styles.container}>
        <EdgeCard sections>
          <EdgeRow
            title={lstrings.fio_address_register_form_field_label}
            body={fioAddressName}
          />
          {walletsToConnect.length > 0 ? (
            <EdgeRow title={lstrings.title_fio_connect_to_wallet}>
              {walletsToConnect.map(renderWalletLine)}
            </EdgeRow>
          ) : null}
          {walletsToDisconnect.length > 0 ? (
            <EdgeRow title={lstrings.title_fio_disconnect_wallets}>
              {walletsToDisconnect.map(renderWalletLine)}
            </EdgeRow>
          ) : null}
        </EdgeCard>

        <Radio
          value={acknowledge}
          onPress={handleCheckPress}
          marginRem={[2, 2, 0]}
        >
          <EdgeText style={styles.checkTitle} numberOfLines={4}>
            {lstrings.fio_connect_checkbox_text}
          </EdgeText>
        </Radio>

        {showSlider && (
          <Slider
            parentStyle={styles.slider}
            onSlidingComplete={handleSlideComplete}
            disabled={!acknowledge || connectWalletsLoading}
            disabledText={lstrings.send_confirmation_slide_to_confirm}
            showSpinner={connectWalletsLoading}
          />
        )}
      </View>
    </SceneWrapper>
  )
}

const getStyles = cacheStyles((theme: Theme) => ({
  container: {
    padding: theme.rem(0.5)
  },
  content: {
    color: theme.primaryText,
    fontSize: theme.rem(1),
    marginHorizontal: theme.rem(0.25),
    textAlign: 'left'
  },
  checkTitle: {
    fontSize: theme.rem(0.75),
    color: theme.primaryText,
    marginLeft: theme.rem(1)
  },
  slider: {
    paddingVertical: theme.rem(2)
  }
}))

export const FioConnectWalletConfirmScene = withWallet(
  FioConnectWalletConfirmComponent
)
