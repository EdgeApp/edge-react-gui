import * as React from 'react'
import { TouchableOpacity, View } from 'react-native'
import FastImage from 'react-native-fast-image'
import AntDesignIcon from 'react-native-vector-icons/AntDesign'

import { hideMessageTweak } from '../../actions/AccountReferralActions'
import { linkReferralWithCurrencies } from '../../actions/WalletListActions'
import { useHandler } from '../../hooks/useHandler'
import { lstrings } from '../../locales/strings'
import { useDispatch, useSelector } from '../../types/reactRedux'
import { NavigationBase } from '../../types/routerTypes'
import { bestOfMessages } from '../../util/ReferralHelpers'
import { showError } from '../services/AirshipInstance'
import { cacheStyles, Theme, useTheme } from '../services/ThemeContext'
import { EdgeText } from '../themed/EdgeText'
import { ButtonBox } from '../themed/ThemedButtons'

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
    <ButtonBox marginRem={1} onPress={handlePress}>
      <View style={styles.container}>
        {message.iconUri != null ? <FastImage resizeMode="contain" source={{ uri: message.iconUri }} style={styles.icon} /> : null}
        <EdgeText testID="promoCard" numberOfLines={0} style={styles.text}>
          {message.message}
        </EdgeText>
        <TouchableOpacity accessible={false} onPress={handleClose}>
          <AntDesignIcon
            testID="closePromo"
            name="close"
            color={theme.iconTappable}
            size={theme.rem(1)}
            style={styles.close}
            accessibilityHint={lstrings.close_hint}
          />
        </TouchableOpacity>
      </View>
    </ButtonBox>
  )
}

const getStyles = cacheStyles((theme: Theme) => ({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.tileBackground,
    padding: theme.rem(0.5)
  },
  icon: {
    width: theme.rem(2),
    height: theme.rem(2),
    margin: theme.rem(0.5)
  },
  text: {
    flex: 1,
    margin: theme.rem(0.5)
  },
  close: {
    padding: theme.rem(0.5)
  }
}))
