/* eslint-disable react-native/no-raw-text */
// @flow

import * as React from 'react'
import { Image, ScrollView, View } from 'react-native'
import AntDesignIcon from 'react-native-vector-icons/AntDesign'
import { sprintf } from 'sprintf-js'

import { selectWalletFromModal } from '../../actions/WalletActions.js'
import { MAX_ADDRESS_CHARACTERS } from '../../constants/WalletAndCurrencyConstants.js'
import s from '../../locales/strings.js'
import { getSelectedWallet } from '../../selectors/WalletSelectors.js'
import { THEME } from '../../theme/variables/airbitz.js'
import { useEffect, useState } from '../../types/reactHooks.js'
import { useDispatch, useSelector } from '../../types/reactRedux.js'
import { type NavigationProp, type RouteProp } from '../../types/routerTypes.js'
import { getCurrencyIcon } from '../../util/CurrencyInfoHelpers.js'
import { truncateString } from '../../util/utils.js'
import { SceneWrapper } from '../common/SceneWrapper.js'
import { type WalletListResult, WalletListModal } from '../modals/WalletListModal.js'
import { IconDropdown } from '../navigation/IconDropdown.js'
import { Airship } from '../services/AirshipInstance'
import { type Theme, cacheStyles, useTheme } from '../services/ThemeContext.js'
import { Card } from '../themed/Card'
import { EdgeText } from '../themed/EdgeText.js'
import { MainButton } from '../themed/MainButton.js'
import { SceneHeader } from '../themed/SceneHeader'
import { SelectableRow } from '../themed/SelectableRow'

type Props = {
  navigation: NavigationProp<'wcConfirmation'>,
  route: RouteProp<'wcConfirmation'>
}

export const WcConfirmationScene = (props: Props) => {
  const { navigation } = props
  const [selectedWallet, setSelectedWallet] = useState({ walletId: '', currencyCode: '' })
  const theme = useTheme()
  const styles = getStyles(theme)
  const { dAppName, wcQRUri } = props.route.params
  const subTitleText = sprintf(s.strings.wc_confirm_subtitle, dAppName)
  const bodyTitleText = sprintf(s.strings.wc_confirm_body_title, dAppName)
  const dAppImage = <Image style={styles.currencyLogo} source={{ uri: getCurrencyIcon('ETH', 'AAVE').symbolImage }} />

  const { walletAddress, walletImageUri, walletName, wallet, currencyWallets } = useSelector(state => {
    const { currencyWallets } = state.core.account
    const guiWallet = getSelectedWallet(state)
    const walletCurrencyCode = state.ui.wallets.selectedCurrencyCode
    const walletImageUri = getCurrencyIcon(guiWallet.currencyCode, walletCurrencyCode).symbolImage
    const walletName = guiWallet.name
    const walletAddress = guiWallet.receiveAddress.publicAddress
    const wallet = currencyWallets[guiWallet.id]
    return {
      walletAddress,
      walletImageUri,
      walletName,
      wallet,
      currencyWallets
    }
  })
  const dispatch = useDispatch()

  const handleConnect = async () => {
    try {
      await wallet.otherMethods.wcConnect({ uri: wcQRUri })
      Airship.show(bridge => (
        <IconDropdown
          bridge={bridge}
          backgroundColor={THEME.COLORS.PRIMARY}
          imageNode={<AntDesignIcon name="checkcircle" size={THEME.rem(2)} style={styles.icon} />}
          message={s.strings.wc_confirm_return_to_browser}
          onPress={() => {}}
        />
      ))
      navigation.navigate('wcWalletConnect')
    } catch (error) {
      console.error(`WalletConnect connection error: ${error.message}`)
    }
  }

  const showWalletListModal = () => {
    const allowedCurrencyWallets = Object.keys(currencyWallets).filter(walletId => currencyWallets[walletId]?.otherMethods?.wcConnect != null)

    const allowedCurrencyCodes = allowedCurrencyWallets.map(walletID => currencyWallets[walletID].currencyInfo.currencyCode)
    Airship.show(bridge => <WalletListModal bridge={bridge} headerTitle={s.strings.select_wallet} allowedCurrencyCodes={allowedCurrencyCodes} />).then(
      ({ walletId, currencyCode }: WalletListResult) => {
        if (walletId && currencyCode) {
          dispatch(selectWalletFromModal(walletId, currencyCode))
          setSelectedWallet({ walletId, currencyCode })
        }
      }
    )
  }

  useEffect(() => {
    if (selectedWallet.walletId === '' && selectedWallet.currencyCode === '') {
      showWalletListModal()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedWallet.walletId, selectedWallet.currencyCode])

  const renderWalletSelect = () => {
    if (selectedWallet.walletId === '' && selectedWallet.currencyCode === '') {
      return <SelectableRow onPress={showWalletListModal} title={s.strings.wc_confirm_select_wallet} arrowTappable />
    } else {
      const walletNameStr = walletName || ''
      const walletImage = <Image style={styles.currencyLogo} source={{ uri: walletImageUri }} />
      const walletAddressStr = truncateString(JSON.stringify(walletAddress), MAX_ADDRESS_CHARACTERS, true)
      return <SelectableRow onPress={showWalletListModal} icon={walletImage} title={walletNameStr} subTitle={walletAddressStr} arrowTappable />
    }
  }

  return (
    <SceneWrapper background="theme" hasTabs={false}>
      <SceneHeader withTopMargin underline title={s.strings.wc_confirm_title} />
      <ScrollView style={styles.container}>
        <View style={styles.listRow}>
          {dAppImage}
          <EdgeText style={styles.subTitle}>{subTitleText}</EdgeText>
        </View>

        <EdgeText style={styles.bodyTitle}>{bodyTitleText}</EdgeText>
        <EdgeText style={styles.body}>{s.strings.wc_confirm_body}</EdgeText>
        <Card paddingRem={0} marginRem={[2.5, 0.5, 2]}>
          {renderWalletSelect()}
        </Card>
        <MainButton
          label={s.strings.wc_confirm_connect_button}
          type="secondary"
          marginRem={[3.5, 0.5]}
          onPress={handleConnect}
          alignSelf="center"
          disabled={selectedWallet.walletId === '' && selectedWallet.currencyCode === ''}
        />
      </ScrollView>
    </SceneWrapper>
  )
}

const getStyles = cacheStyles((theme: Theme) => ({
  currencyLogo: {
    height: theme.rem(2),
    width: theme.rem(2),
    resizeMode: 'contain'
  },
  container: {
    padding: theme.rem(0.5)
  },
  listRow: {
    marginTop: theme.rem(1),
    marginBottom: theme.rem(1.5),
    marginHorizontal: theme.rem(0.5),
    flexDirection: 'row',
    alignItems: 'flex-start'
  },
  subTitle: {
    fontFamily: theme.fontFaceMedium,
    marginTop: theme.rem(0.25),
    marginLeft: theme.rem(1)
  },
  bodyTitle: {
    fontFamily: theme.fontFaceMedium,
    marginLeft: theme.rem(0.5)
  },
  body: {
    color: theme.secondaryText,
    marginLeft: theme.rem(0.5)
  },
  icon: {
    alignSelf: 'center',
    color: THEME.COLORS.ACCENT_MINT,
    paddingTop: theme.rem(0.25)
  }
}))
