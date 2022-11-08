import { EdgeCurrencyWallet } from 'edge-core-js'
import * as React from 'react'
import { View } from 'react-native'
import { sprintf } from 'sprintf-js'

import { IONIA_SUPPORTED_FIATS } from '../../constants/plugins/GuiPlugins'
import { SPECIAL_CURRENCY_INFO } from '../../constants/WalletAndCurrencyConstants'
import { useHandler } from '../../hooks/useHandler'
import s from '../../locales/strings'
import { getDefaultFiat } from '../../selectors/SettingsSelectors'
import { useSelector } from '../../types/reactRedux'
import { Actions } from '../../types/routerTypes'
import { CryptoIcon } from '../icons/CryptoIcon'
import { cacheStyles, Theme, useTheme } from '../services/ThemeContext'
import { ioniaPluginIds } from './EarnCrypto'
import { EdgeText } from './EdgeText'
import { ButtonBox } from './ThemedButtons'

const allowedPluginIds = Object.keys(SPECIAL_CURRENCY_INFO).filter(pluginId => !!SPECIAL_CURRENCY_INFO[pluginId].displayBuyCrypto)

interface OwnProps {
  wallet: EdgeCurrencyWallet
  tokenId?: string
}

type Props = OwnProps

export const BuyCrypto = (props: Props) => {
  const { wallet, tokenId } = props
  const theme = useTheme()
  const styles = getStyles(theme)

  const handlePress = useHandler(() => {
    Actions.push('pluginListBuy', { direction: 'buy' })
  })

  const defaultFiat = useSelector(state => getDefaultFiat(state))

  const { displayName, pluginId } = wallet.currencyInfo

  let message = s.strings.transaction_list_buy_crypto_message
  if (ioniaPluginIds.includes(pluginId) && IONIA_SUPPORTED_FIATS.includes(defaultFiat)) {
    message = s.strings.transaction_list_buy_and_earn_crypto_message
  }

  return (
    <>
      {allowedPluginIds.includes(pluginId) && tokenId == null && (
        <ButtonBox onPress={handlePress} paddingRem={1}>
          <View style={styles.container}>
            <View style={styles.buyCrypto}>
              <CryptoIcon walletId={wallet.id} tokenId={tokenId} marginRem={[0.25, 0]} sizeRem={2.25} />

              <EdgeText style={styles.buyCryptoText}>{sprintf(message, displayName)}</EdgeText>
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
