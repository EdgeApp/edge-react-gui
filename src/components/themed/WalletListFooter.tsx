import * as React from 'react'
import { TouchableOpacity, View } from 'react-native'
import Ionicon from 'react-native-vector-icons/Ionicons'

import { SPECIAL_CURRENCY_INFO } from '../../constants/WalletAndCurrencyConstants'
import { useHandler } from '../../hooks/useHandler'
import { lstrings } from '../../locales/strings'
import { useSelector } from '../../types/reactRedux'
import { NavigationProp } from '../../types/routerTypes'
import { EdgeTokenId } from '../../types/types'
import { WalletListModal, WalletListResult } from '../modals/WalletListModal'
import { Airship, showError } from '../services/AirshipInstance'
import { cacheStyles, Theme, useTheme } from '../services/ThemeContext'
import { EdgeText } from './EdgeText'

interface Props {
  navigation: NavigationProp<'walletList'>
}

export const WalletListFooter = (props: Props) => {
  const { navigation } = props
  const theme = useTheme()
  const styles = getStyles(theme)
  const account = useSelector(state => state.core.account)

  const handleAddWallet = useHandler(() => {
    navigation.navigate('createWalletSelectCrypto', {})
  })

  const handleAddToken = useHandler(() => {
    const allowedAssets: EdgeTokenId[] = Object.keys(account.currencyConfig)
      .filter(pluginId => SPECIAL_CURRENCY_INFO[pluginId]?.isCustomTokensSupported)
      .map(pluginId => ({ pluginId }))

    Airship.show<WalletListResult>(bridge => (
      <WalletListModal allowedAssets={allowedAssets} bridge={bridge} navigation={navigation} headerTitle={lstrings.select_wallet} showCreateWallet />
    ))
      .then(({ walletId, currencyCode }) => {
        if (walletId != null && currencyCode != null) {
          navigation.navigate('manageTokens', { walletId })
        }
      })
      .catch(showError)
  })

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={handleAddWallet} style={styles.addButtonsContainer}>
        <Ionicon name="md-add" style={styles.addItem} size={theme.rem(1.5)} color={theme.iconTappable} />
        <EdgeText style={[styles.addItem, styles.addItemText]}>{lstrings.wallet_list_add_wallet}</EdgeText>
      </TouchableOpacity>
      <TouchableOpacity onPress={handleAddToken} style={styles.addButtonsContainer}>
        <Ionicon name="md-add" style={styles.addItem} size={theme.rem(1.5)} color={theme.iconTappable} />
        <EdgeText style={[styles.addItem, styles.addItemText]}>{lstrings.wallet_list_add_token}</EdgeText>
      </TouchableOpacity>
    </View>
  )
}

const getStyles = cacheStyles((theme: Theme) => ({
  container: {
    alignItems: 'stretch',
    borderTopColor: theme.lineDivider,
    borderTopWidth: theme.thinLineWidth,
    flex: 1,
    flexDirection: 'row',
    marginLeft: theme.rem(1),
    marginVertical: theme.rem(1),
    paddingRight: theme.rem(1),
    paddingTop: theme.rem(0.75)
  },
  addButtonsContainer: {
    alignItems: 'center',
    backgroundColor: theme.tileBackground,
    flex: 1,
    flexDirection: 'row',
    height: theme.rem(3.25),
    justifyContent: 'center'
  },
  addItem: {
    color: theme.textLink,
    fontFamily: theme.addButtonFont,
    margin: theme.rem(0.25)
  },
  addItemText: {
    flexShrink: 1
  }
}))
