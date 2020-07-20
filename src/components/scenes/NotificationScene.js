// @flow

import { type EdgeCurrencyInfo } from 'edge-core-js'
import * as React from 'react'
import { ActivityIndicator, Image, ScrollView } from 'react-native'
import { Actions } from 'react-native-router-flux'
import AntDesignIcon from 'react-native-vector-icons/AntDesign'
import { connect } from 'react-redux'

import * as Constants from '../../constants/indexConstants'
import s from '../../locales/strings'
import { notif1 } from '../../modules/notifServer.js'
import { getActiveWalletCurrencyInfos } from '../../modules/UI/selectors'
import { THEME } from '../../theme/variables/airbitz'
import { type State as ReduxState } from '../../types/reduxTypes.js'
import { SceneWrapper } from '../common/SceneWrapper.js'
import { SettingsRow } from '../common/SettingsRow.js'
import { SettingsSwitchRow } from '../common/SettingsSwitchRow.js'
import { showError } from '../services/AirshipInstance.js'

type NavigationProps = {}
type StateProps = {
  currencyInfos: Array<EdgeCurrencyInfo>,
  userId: string
}
type DispatchProps = {}
type Props = NavigationProps & StateProps & DispatchProps

type State = {
  enabled: boolean,
  loading: boolean
}

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
    const rightArrow = <AntDesignIcon name="right" color={THEME.COLORS.GRAY_2} size={THEME.rem(1)} />
    const { enabled } = this.state

    return (
      <SceneWrapper background="body" hasTabs={false}>
        {this.state.loading ? (
          <ActivityIndicator style={styles.loader} size="large" />
        ) : (
          <ScrollView>
            <SettingsSwitchRow key="notifications" text={s.strings.settings_notifications_switch} value={enabled} onPress={this.toggleNotifications} />
            {this.props.currencyInfos.map((currencyInfo: EdgeCurrencyInfo) => {
              const { displayName, symbolImage, currencyCode } = currencyInfo
              const icon = symbolImage != null ? <Image style={styles.currencyLogo} source={{ uri: symbolImage }} /> : undefined
              const onPress = () => (enabled ? Actions[Constants.CURRENCY_NOTIFICATION_SETTINGS]({ currencyInfo }) : undefined)

              return <SettingsRow disabled={!enabled} key={currencyCode} icon={icon} text={displayName} right={rightArrow} onPress={onPress} />
            })}
          </ScrollView>
        )}
      </SceneWrapper>
    )
  }
}

export const NotificationScene = connect((state: ReduxState): StateProps => {
  return {
    currencyInfos: getActiveWalletCurrencyInfos(state),
    userId: state.core.account.rootLoginId
  }
})(NotificationComponent)

const iconSize = THEME.rem(1.375)
const styles = {
  currencyLogo: {
    height: iconSize,
    width: iconSize,
    resizeMode: 'contain'
  },
  loader: {
    flex: 1,
    alignSelf: 'center'
  }
}
