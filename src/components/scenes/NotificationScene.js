// @flow

import { type EdgeCurrencyInfo } from 'edge-core-js'
import * as React from 'react'
import { ActivityIndicator, ScrollView } from 'react-native'
import FastImage from 'react-native-fast-image'

import s from '../../locales/strings'
import { notif1 } from '../../modules/notifServer.js'
import { getActiveWalletCurrencyInfos } from '../../selectors/WalletSelectors.js'
import { connect } from '../../types/reactRedux.js'
import { type NavigationProp } from '../../types/routerTypes.js'
import { getCurrencyIcon } from '../../util/CurrencyInfoHelpers.js'
import { SceneWrapper } from '../common/SceneWrapper.js'
import { showError } from '../services/AirshipInstance.js'
import { type Theme, type ThemeProps, cacheStyles, withTheme } from '../services/ThemeContext.js'
import { SettingsSwitchRow } from '../themed/SettingsSwitchRow.js'
import { SettingsTappableRow } from '../themed/SettingsTappableRow.js'

type OwnProps = {
  navigation: NavigationProp<'notificationSettings'>
}
type StateProps = {
  currencyInfos: EdgeCurrencyInfo[],
  userId: string
}

type State = {
  enabled: boolean,
  loading: boolean
}

type Props = StateProps & OwnProps & ThemeProps

class NotificationComponent extends React.Component<Props, State> {
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
    const { navigation, theme } = this.props
    const { enabled } = this.state
    const styles = getStyles(theme)

    return (
      <SceneWrapper background="theme" hasTabs={false}>
        {this.state.loading ? (
          <ActivityIndicator color={theme.primaryText} style={styles.loader} size="large" />
        ) : (
          <ScrollView>
            <SettingsSwitchRow label={s.strings.settings_notifications_switch} value={enabled} onPress={this.toggleNotifications} />
            {this.props.currencyInfos.map((currencyInfo: EdgeCurrencyInfo) => {
              const { displayName, pluginId } = currencyInfo
              const { symbolImage } = getCurrencyIcon(pluginId)
              const onPress = () =>
                enabled
                  ? navigation.navigate('currencyNotificationSettings', {
                      currencyInfo
                    })
                  : undefined

              return (
                <SettingsTappableRow disabled={!enabled} key={pluginId} label={displayName} onPress={onPress}>
                  <FastImage style={styles.currencyLogo} source={{ uri: symbolImage }} />
                </SettingsTappableRow>
              )
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
    marginHorizontal: theme.rem(0.5),
    resizeMode: 'contain'
  },
  loader: {
    flex: 1,
    alignSelf: 'center'
  }
}))

export const NotificationScene = connect<StateProps, {}, OwnProps>(
  state => ({
    currencyInfos: getActiveWalletCurrencyInfos(state),
    userId: state.core.account.rootLoginId
  }),
  dispatch => ({})
)(withTheme(NotificationComponent))
