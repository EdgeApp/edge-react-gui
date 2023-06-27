import { EdgeCurrencyWallet } from 'edge-core-js'
import * as React from 'react'
import { TouchableOpacity } from 'react-native'
import FastImage from 'react-native-fast-image'

import { executePluginAction } from '../../actions/PluginActions'
import { SPECIAL_CURRENCY_INFO } from '../../constants/WalletAndCurrencyConstants'
import { ENV } from '../../env'
import { useHandler } from '../../hooks/useHandler'
import { lstrings } from '../../locales/strings'
import { getDefaultFiat } from '../../selectors/SettingsSelectors'
import { useDispatch, useSelector } from '../../types/reactRedux'
import { NavigationProp } from '../../types/routerTypes'
import { getCurrencyIconUris } from '../../util/CdnUris'
import { logEvent } from '../../util/tracking'
import { showError } from '../services/AirshipInstance'
import { cacheStyles, Theme, useTheme } from '../services/ThemeContext'
import { EdgeText } from '../themed/EdgeText'
import { Card } from './Card'

export const IONIA_SUPPORTED_FIATS = ['USD']

export const ioniaPluginIds = Object.keys(SPECIAL_CURRENCY_INFO).filter(pluginId => !!SPECIAL_CURRENCY_INFO[pluginId].displayIoniaRewards)

interface Props {
  wallet: EdgeCurrencyWallet
  tokenId?: string
  navigation: NavigationProp<'transactionList'>
}

export const VisaCardCard = (props: Props) => {
  const { wallet, tokenId, navigation } = props
  const theme = useTheme()
  const styles = getStyles(theme)
  const dispatch = useDispatch()

  const handlePress = useHandler(() => {
    logEvent('Visa_Card_Launch')
    dispatch(executePluginAction(navigation, 'rewardscard', 'sell')).catch(err => showError(err))
  })

  const defaultFiat = useSelector(state => getDefaultFiat(state))
  if (!IONIA_SUPPORTED_FIATS.includes(defaultFiat)) {
    return null
  }

  if (!ENV.ENABLE_VISA_PROGRAM) return null

  const { pluginId } = wallet.currencyInfo
  const icon = getCurrencyIconUris(pluginId, tokenId)

  return (
    <>
      {ioniaPluginIds.includes(pluginId) && tokenId == null && (
        <Card paddingRem={0} marginRem={[1, 0.5, -0.5, 0.5]}>
          <TouchableOpacity onPress={handlePress} style={styles.container}>
            <FastImage resizeMode="contain" source={{ uri: icon.symbolImage }} style={styles.icon} />
            <EdgeText numberOfLines={0} style={styles.text}>
              {lstrings.rewards_card_call_to_action}
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
