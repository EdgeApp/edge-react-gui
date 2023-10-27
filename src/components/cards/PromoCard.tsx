import * as React from 'react'
import FastImage from 'react-native-fast-image'

import { hideMessageTweak } from '../../actions/AccountReferralActions'
import { linkReferralWithCurrencies } from '../../actions/WalletListActions'
import { useHandler } from '../../hooks/useHandler'
import { useDispatch, useSelector } from '../../types/reactRedux'
import { NavigationBase } from '../../types/routerTypes'
import { bestOfMessages } from '../../util/ReferralHelpers'
import { showError } from '../services/AirshipInstance'
import { cacheStyles, Theme, useTheme } from '../services/ThemeContext'
import { IconMessageCard } from './IconMessageCard'

interface Props {
  navigation: NavigationBase
}

export function PromoCard(props: Props) {
  const { navigation } = props
  const theme = useTheme()
  const styles = getStyles(theme)
  const dispatch = useDispatch()

  const accountMessages = useSelector(state => state.account.referralCache.accountMessages)
  const accountReferral = useSelector(state => state.account.accountReferral)
  const messageSummary = bestOfMessages(accountMessages, accountReferral)

  const handlePress = useHandler(() => {
    const uri = messageSummary?.message.uri
    if (uri != null) dispatch(linkReferralWithCurrencies(navigation, uri)).catch(err => showError(err))
  })

  const handleClose = useHandler(() => {
    if (messageSummary != null) {
      dispatch(hideMessageTweak(messageSummary.messageId, messageSummary.messageSource)).catch(err => showError(err))
    }
  })

  if (messageSummary == null) return null
  const { message } = messageSummary
  return (
    <IconMessageCard
      message={message.message}
      testIds={{ message: 'promoCard', close: 'closePromo' }}
      iconOrUri={message.iconUri != null ? <FastImage resizeMode="contain" source={{ uri: message.iconUri }} style={styles.icon} /> : null}
      onPress={handlePress}
      onClose={handleClose}
    />
  )
}

const getStyles = cacheStyles((theme: Theme) => ({
  icon: {
    width: theme.rem(2),
    height: theme.rem(2),
    marginHorizontal: theme.rem(0.5)
  }
}))
