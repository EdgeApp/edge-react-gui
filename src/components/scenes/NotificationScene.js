// @flow

import { type EdgeCurrencyInfo } from 'edge-core-js'
import * as React from 'react'
import { ActivityIndicator, Image, ScrollView } from 'react-native'
import { Actions } from 'react-native-router-flux'
import AntDesignIcon from 'react-native-vector-icons/AntDesign'
import { connect } from 'react-redux'

import { CURRENCY_NOTIFICATION_SETTINGS } from '../../constants/SceneKeys.js'
import s from '../../locales/strings'
import { notif1 } from '../../modules/notifServer.js'
import { getActiveWalletCurrencyInfos } from '../../selectors/WalletSelectors.js'
import { type RootState } from '../../types/reduxTypes.js'
import { getCurrencyIcon } from '../../util/CurrencyInfoHelpers.js'
import { SceneWrapper } from '../common/SceneWrapper.js'
import { showError } from '../services/AirshipInstance.js'
import { type Theme, type ThemeProps, cacheStyles, withTheme } from '../services/ThemeContext.js'
import { SettingsRow } from '../themed/SettingsRow.js'
import { SettingsSwitchRow } from '../themed/SettingsSwitchRow.js'

type StateProps = {
  currencyInfos: EdgeCurrencyInfo[],
  userId: string
}

type State = {
  enabled: boolean,
  loading: boolean
}

type Props = StateProps & ThemeProps

export class NotificationComponent extends React.Component<Props, State> {
  mounted: boolean

  constructor(props: Props) {
    super(props)
    this.state = {
      enabled: true,
      loading: false
    }
  }

  componentDidMount() {
    this.mounted = true
    this.getNotificationState()
  }

  componentWillUnmount() {
    this.mounted = false
  }

  async getNotificationState() {
    const encodedUserId = encodeURIComponent(this.props.userId)
    this.setState({ loading: true })
    try {
      const result = await notif1.get(`/user?userId=${encodedUserId}`)
      this.setState({
        enabled: result.notifications.enabled
      })
      this.setState({ loading: false })
    } catch (error) {
      if (this.mounted) {
        showError(error)
        console.log(error)
        this.setState({ loading: false })
      }
    }
  }

  setNotificationState() {
    const encodedUserId = encodeURIComponent(this.props.userId)
    try {
      notif1.post(`user/notifications/toggle?userId=${encodedUserId}`, { enabled: this.state.enabled })
    } catch (error) {
      showError(error)
      console.log(error)
    }
  }

  toggleNotifications = () => {
    this.setState({ enabled: !this.state.enabled }, this.setNotificationState)
  }

  render() {
    const { theme } = this.props
    const { enabled } = this.state
    const styles = getStyles(theme)
    const rightArrow = <AntDesignIcon name="right" color={theme.icon} size={theme.rem(1)} />

    return (
      <SceneWrapper background="theme" hasTabs={false}>
        {this.state.loading ? (
          <ActivityIndicator color={theme.primaryText} style={styles.loader} size="large" />
        ) : (
          <ScrollView>
            <SettingsSwitchRow key="notifications" text={s.strings.settings_notifications_switch} value={enabled} onPress={this.toggleNotifications} />
            {this.props.currencyInfos.map((currencyInfo: EdgeCurrencyInfo) => {
              const { displayName, currencyCode } = currencyInfo
              const { symbolImage } = getCurrencyIcon(currencyCode)
              const icon = <Image style={styles.currencyLogo} source={{ uri: symbolImage }} />
              const onPress = () =>
                enabled
                  ? Actions[CURRENCY_NOTIFICATION_SETTINGS]({
                      currencyInfo
                    })
                  : undefined

              return <SettingsRow disabled={!enabled} key={currencyCode} icon={icon} text={displayName} right={rightArrow} onPress={onPress} />
            })}
          </ScrollView>
        )}
      </SceneWrapper>
    )
  }
}

const getStyles = cacheStyles((theme: Theme) => ({
  currencyLogo: {
    height: theme.rem(1.25),
    width: theme.rem(1.25),
    resizeMode: 'contain'
  },
  loader: {
    flex: 1,
    alignSelf: 'center'
  }
}))

export const NotificationScene = connect((state: RootState): StateProps => {
  return {
    currencyInfos: getActiveWalletCurrencyInfos(state),
    userId: state.core.account.rootLoginId
  }
})(withTheme(NotificationComponent))
