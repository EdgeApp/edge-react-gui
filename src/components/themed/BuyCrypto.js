// @flow

import { type EdgeCurrencyWallet } from 'edge-core-js'
import * as React from 'react'
import { View } from 'react-native'
import { sprintf } from 'sprintf-js'

import { SPECIAL_CURRENCY_INFO } from '../../constants/WalletAndCurrencyConstants.js'
import { useHandler } from '../../hooks/useHandler.js'
import s from '../../locales/strings.js'
import { type NavigationProp, useNavigation } from '../../types/routerTypes.js'
import { type Theme, cacheStyles, useTheme } from '../services/ThemeContext.js'
import { CurrencyIcon } from '../themed/CurrencyIcon.js'
import { EdgeText } from './EdgeText.js'
import { ButtonBox } from './ThemedButtons.js'

const allowedPluginIds = Object.keys(SPECIAL_CURRENCY_INFO).filter(pluginId => !!SPECIAL_CURRENCY_INFO[pluginId].displayBuyCrypto)

type OwnProps = {
  wallet: EdgeCurrencyWallet,
  tokenId?: string
}

type Props = OwnProps

export const BuyCrypto = (props: Props) => {
  const { wallet, tokenId } = props
  const theme = useTheme()
  const styles = getStyles(theme)
  const navigation: NavigationProp<'edge'> = useNavigation()
  const handlePress = useHandler(() => {
    navigation.push('pluginListBuy', { direction: 'buy' })
  })

  const { displayName, pluginId } = wallet.currencyInfo

  return (
    <>
      {allowedPluginIds.includes(pluginId) && tokenId == null && (
        <ButtonBox onPress={handlePress} paddingRem={1}>
          <View style={styles.container}>
            <View style={styles.buyCrypto}>
              <CurrencyIcon walletId={wallet.id} tokenId={tokenId} marginRem={[0.25, 0]} sizeRem={2.25} />

              <EdgeText style={styles.buyCryptoText}>{sprintf(s.strings.transaction_list_buy_crypto_message, displayName)}</EdgeText>
            </View>
          </View>
        </ButtonBox>
      )}
      <View style={styles.noTransactionContainer}>
        <EdgeText style={styles.noTransactionText}>{s.strings.transaction_list_no_tx_yet}</EdgeText>
      </View>
    </>
  )
}

const getStyles = cacheStyles((theme: Theme) => ({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.rem(1),
    backgroundColor: theme.tileBackground
  },
  buyCrypto: {
    alignItems: 'center',
    justifyContent: 'center'
  },

  buyCryptoText: {
    fontFamily: theme.fontFaceMedium,
    marginVertical: theme.rem(0.25)
  },
  noTransactionContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: theme.rem(0.5)
  },
  noTransactionText: {
    fontSize: theme.rem(1.25)
  }
}))
