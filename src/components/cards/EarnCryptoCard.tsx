import { EdgeCurrencyWallet } from 'edge-core-js'
import * as React from 'react'
import { TouchableOpacity } from 'react-native'
import FastImage from 'react-native-fast-image'
import { sprintf } from 'sprintf-js'

import { guiPlugins, IONIA_SUPPORTED_FIATS } from '../../constants/plugins/GuiPlugins'
import { SPECIAL_CURRENCY_INFO } from '../../constants/WalletAndCurrencyConstants'
import { useHandler } from '../../hooks/useHandler'
import s from '../../locales/strings'
import { getDefaultFiat } from '../../selectors/SettingsSelectors'
import { config } from '../../theme/appConfig'
import { useSelector } from '../../types/reactRedux'
import { NavigationProp } from '../../types/routerTypes'
import { getCurrencyIconUris } from '../../util/CdnUris'
import { getCurrencyCode } from '../../util/CurrencyInfoHelpers'
import { logEvent } from '../../util/tracking'
import { cacheStyles, Theme, useTheme } from '../services/ThemeContext'
import { EdgeText } from '../themed/EdgeText'
import { Card } from './Card'

export const ioniaPluginIds = Object.keys(SPECIAL_CURRENCY_INFO).filter(pluginId => !!SPECIAL_CURRENCY_INFO[pluginId].displayIoniaRewards)

interface Props {
  wallet: EdgeCurrencyWallet
  tokenId?: string
  navigation: NavigationProp<'transactionList'>
}

export const EarnCryptoCard = (props: Props) => {
  const { wallet, tokenId, navigation } = props
  const theme = useTheme()
  const styles = getStyles(theme)
  const { hideIoniaRewards = false } = config

  const handlePress = useHandler(() => {
    logEvent('Earn_Spend_Launch')
    navigation.navigate('pluginViewBuy', {
      plugin: guiPlugins.ionia
    })
  })

  const defaultFiat = useSelector(state => getDefaultFiat(state))
  if (!IONIA_SUPPORTED_FIATS.includes(defaultFiat) || hideIoniaRewards) {
    return null
  }

  const { pluginId } = wallet.currencyInfo
  const icon = getCurrencyIconUris(pluginId, tokenId)
  const currencyCode = getCurrencyCode(wallet, tokenId)

  return (
    <>
      {ioniaPluginIds.includes(pluginId) && tokenId == null && (
        <Card paddingRem={0} marginRem={[1, 0.5, -0.5, 0.5]}>
          <TouchableOpacity onPress={handlePress} style={styles.container}>
            <FastImage resizeMode="contain" source={{ uri: icon.symbolImage }} style={styles.icon} />
            <EdgeText numberOfLines={0} style={styles.text}>
              {sprintf(s.strings.side_menu_rewards_tx_list_button_2s, defaultFiat, currencyCode)}
            </EdgeText>
          </TouchableOpacity>
        </Card>
      )}
    </>
  )
}

const getStyles = cacheStyles((theme: Theme) => ({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.rem(0.5)
  },
  icon: {
    width: theme.rem(2),
    height: theme.rem(2),
    margin: theme.rem(0.5)
  },
  text: {
    marginLeft: theme.rem(0.5)
  }
}))
