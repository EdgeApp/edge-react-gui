import * as React from 'react'
import { TouchableOpacity, View } from 'react-native'
import FastImage from 'react-native-fast-image'
import AntDesignIcon from 'react-native-vector-icons/AntDesign'

import { hideMessageTweak } from '../../actions/AccountReferralActions'
import { linkReferralWithCurrencies } from '../../actions/WalletListActions'
import { connect } from '../../types/reactRedux'
import { AccountReferral } from '../../types/ReferralTypes'
import { MessageTweak } from '../../types/TweakTypes'
import { bestOfMessages, TweakSource } from '../../util/ReferralHelpers'
import { cacheStyles, Theme, ThemeProps, withTheme } from '../services/ThemeContext'
import { EdgeText } from '../themed/EdgeText'
import { ButtonBox } from '../themed/ThemedButtons'

type StateProps = {
  accountMessages: MessageTweak[]
  accountReferral: AccountReferral
}

type DispatchProps = {
  hideMessageTweak: (messageId: string, source: TweakSource) => void
  linkReferralWithCurrencies: (uri: string) => void
}

type Props = StateProps & DispatchProps & ThemeProps

export class PromoCardComponent extends React.PureComponent<Props> {
  handlePress = () => {
    const { accountMessages, accountReferral, linkReferralWithCurrencies } = this.props
    const messageSummary = bestOfMessages(accountMessages, accountReferral)
    const uri = messageSummary ? messageSummary.message.uri : null
    if (uri != null) linkReferralWithCurrencies(uri)
  }

  handleClose = () => {
    const { accountMessages, accountReferral, hideMessageTweak } = this.props
    const messageSummary = bestOfMessages(accountMessages, accountReferral)
    if (messageSummary != null) {
      hideMessageTweak(messageSummary.messageId, messageSummary.messageSource)
    }
  }

  render() {
    const { accountMessages, accountReferral, theme } = this.props
    const styles = getStyles(theme)
    const messageSummary = bestOfMessages(accountMessages, accountReferral)
    if (messageSummary == null) return null
    const { message } = messageSummary
    return (
      <ButtonBox marginRem={1} onPress={this.handlePress}>
        <View style={styles.container}>
          {message.iconUri != null ? <FastImage resizeMode="contain" source={{ uri: message.iconUri }} style={styles.icon} /> : null}
          <EdgeText numberOfLines={0} style={styles.text}>
            {message.message}
          </EdgeText>
          <TouchableOpacity onPress={this.handleClose}>
            <AntDesignIcon name="close" color={theme.iconTappable} size={theme.rem(1)} style={styles.close} />
          </TouchableOpacity>
        </View>
      </ButtonBox>
    )
  }
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

export const PromoCard = connect<StateProps, DispatchProps, {}>(
  state => ({
    accountMessages: state.account.referralCache.accountMessages,
    accountReferral: state.account.accountReferral
  }),
  dispatch => ({
    hideMessageTweak(messageId: string, source: TweakSource) {
      dispatch(hideMessageTweak(messageId, source))
    },
    linkReferralWithCurrencies(uri) {
      dispatch(linkReferralWithCurrencies(uri))
    }
  })
)(withTheme(PromoCardComponent))
