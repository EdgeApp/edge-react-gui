// @flow

import * as React from 'react'
import { TouchableOpacity, View } from 'react-native'
import Ionicon from 'react-native-vector-icons/Ionicons'

import { SPECIAL_CURRENCY_INFO } from '../../constants/WalletAndCurrencyConstants.js'
import s from '../../locales/strings.js'
import { useCallback } from '../../types/reactHooks.js'
import { useSelector } from '../../types/reactRedux.js'
import { type NavigationProp } from '../../types/routerTypes.js'
import { type EdgeTokenId } from '../../types/types.js'
import { WalletListModal } from '../modals/WalletListModal.js'
import { Airship, showError } from '../services/AirshipInstance.js'
import { type Theme, cacheStyles, useTheme } from '../services/ThemeContext.js'
import { EdgeText } from './EdgeText.js'

type Props = {
  navigation: NavigationProp<'walletList'>
}

export const WalletListFooter = (props: Props) => {
  const { navigation } = props
  const theme = useTheme()
  const styles = getStyles(theme)
  const account = useSelector(state => state.core.account)

  const handleAddWallet = useCallback(() => {
    navigation.navigate('createWalletSelectCrypto')
  }, [navigation])

  const handleAddToken = useCallback(() => {
    const allowedAssets: EdgeTokenId[] = Object.keys(account.currencyConfig)
      .filter(pluginId => SPECIAL_CURRENCY_INFO[pluginId]?.isCustomTokensSupported)
      .map(pluginId => ({ pluginId }))

    Airship.show(bridge => <WalletListModal allowedAssets={allowedAssets} bridge={bridge} headerTitle={s.strings.select_wallet} />)
      .then(({ walletId, currencyCode }) => {
        if (walletId != null && currencyCode != null) {
          navigation.navigate('manageTokens', { walletId })
        }
      })
      .catch(showError)
  }, [navigation, account])

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={handleAddWallet} style={styles.addButtonsContainer}>
        <Ionicon name="md-add" style={styles.addItem} size={theme.rem(1.5)} color={theme.iconTappable} />
        <EdgeText style={[styles.addItem, styles.addItemText]}>{s.strings.wallet_list_add_wallet}</EdgeText>
      </TouchableOpacity>
      <TouchableOpacity onPress={handleAddToken} style={styles.addButtonsContainer}>
        <Ionicon name="md-add" style={styles.addItem} size={theme.rem(1.5)} color={theme.iconTappable} />
        <EdgeText style={[styles.addItem, styles.addItemText]}>{s.strings.wallet_list_add_token}</EdgeText>
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
