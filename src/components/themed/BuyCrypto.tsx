import { EdgeCurrencyWallet, EdgeTokenId } from 'edge-core-js'
import * as React from 'react'
import { View } from 'react-native'
import { sprintf } from 'sprintf-js'

import {
  DONE_THRESHOLD,
  SPECIAL_CURRENCY_INFO
} from '../../constants/WalletAndCurrencyConstants'
import { useHandler } from '../../hooks/useHandler'
import { useWatch } from '../../hooks/useWatch'
import { toPercentString } from '../../locales/intl'
import { lstrings } from '../../locales/strings'
import { useSelector } from '../../types/reactRedux'
import { NavigationBase } from '../../types/routerTypes'
import { CryptoIcon } from '../icons/CryptoIcon'
import { cacheStyles, Theme, useTheme } from '../services/ThemeContext'
import { EdgeText } from './EdgeText'
import { ButtonBox } from './ThemedButtons'

const allowedPluginIds = Object.keys(SPECIAL_CURRENCY_INFO).filter(
  pluginId => !!SPECIAL_CURRENCY_INFO[pluginId].displayBuyCrypto
)

interface OwnProps {
  wallet: EdgeCurrencyWallet
  tokenId: EdgeTokenId
  navigation: NavigationBase
}

type Props = OwnProps

export const BuyCrypto = (props: Props) => {
  const { wallet, tokenId, navigation } = props
  const theme = useTheme()
  const styles = getStyles(theme)

  const syncRatio = useWatch(wallet, 'syncRatio')

  const countryCode = useSelector(state => state.ui.countryCode)
  const hideNonUkCompliantFeat = countryCode === 'GB'

  const handlePress = useHandler(() => {
    navigation.navigate('buyTab', { screen: 'pluginListBuy' })
  })

  const { displayName, pluginId } = wallet.currencyInfo

  return (
    <>
      {!allowedPluginIds.includes(pluginId) ||
      tokenId != null ||
      hideNonUkCompliantFeat ? null : (
        <ButtonBox onPress={handlePress} paddingRem={1}>
          <View style={styles.container}>
            <View style={styles.buyCrypto}>
              <CryptoIcon
                pluginId={pluginId}
                tokenId={tokenId}
                marginRem={[0.25, 0]}
                sizeRem={2.25}
              />

              <EdgeText style={styles.buyCryptoText}>
                {sprintf(lstrings.buy_1s, displayName)}
              </EdgeText>
            </View>
          </View>
        </ButtonBox>
      )}
      <View style={styles.noTransactionContainer}>
        {syncRatio < DONE_THRESHOLD ? (
          <>
            <EdgeText style={styles.noTransactionText}>
              {lstrings.transaction_list_loading_txs}
            </EdgeText>
            <EdgeText style={styles.transactionsLoadingText}>
              {sprintf(
                lstrings.percent_complete_1s,
                toPercentString(syncRatio)
              )}
            </EdgeText>
          </>
        ) : (
          <EdgeText style={styles.noTransactionText}>
            {lstrings.transaction_list_no_tx_yet}
          </EdgeText>
        )}
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
    fontSize: theme.rem(1.25),
    textAlign: 'center'
  },
  transactionsLoadingText: {
    color: theme.secondaryText,
    textAlign: 'center'
  }
}))
