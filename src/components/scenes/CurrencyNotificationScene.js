// @flow

import * as React from 'react'
import { ScrollView } from 'react-native'
import { sprintf } from 'sprintf-js'

import { enableNotifications, fetchSettings } from '../../actions/NotificationActions.js'
import s from '../../locales/strings.js'
import { connect } from '../../types/reactRedux.js'
import { type NavigationProp, type RouteProp } from '../../types/routerTypes.js'
import { SceneWrapper } from '../common/SceneWrapper.js'
import { showError } from '../services/AirshipInstance'
import { SettingsSwitchRow } from '../themed/SettingsSwitchRow.js'

type OwnProps = {
  navigation: NavigationProp<'currencyNotificationSettings'>,
  route: RouteProp<'currencyNotificationSettings'>
}
type StateProps = {
  userId: string
}
type DispatchProps = {
  enableNotifications: (currencyCode: string, hours: string, enabled: boolean) => void
}
type Props = StateProps & DispatchProps & OwnProps

type State = {
  hours: { [hours: string]: boolean }
}

export class CurrencyNotificationComponent extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {
      hours: {}
    }
  }

  async componentDidMount() {
    const { userId, navigation, route } = this.props
    const { currencyCode } = route.params.currencyInfo
    try {
      const settings = await fetchSettings(userId, currencyCode)
      if (settings) this.setState({ hours: settings })
    } catch (err) {
      showError(err)
      navigation.goBack()
    }
  }

  render() {
    const { enableNotifications, route } = this.props
    const { currencyCode } = route.params.currencyInfo
    const rows = []
    for (const hours of Object.keys(this.state.hours)) {
      const enabled: boolean = this.state.hours[hours]
      const num = Number(hours)
      const percent = num === 1 ? 3 : 10
      const text =
        num === 1
          ? sprintf(s.strings.settings_currency_notifications_percent_change_hour, percent)
          : sprintf(s.strings.settings_currency_notifications_percent_change_hours, percent, hours)

      rows.push(
        <SettingsSwitchRow
          key={hours}
          text={text}
          value={enabled}
          onPress={() => {
            this.setState(state => ({ hours: { ...state.hours, [hours]: !enabled } }))
            enableNotifications(currencyCode, hours, !enabled)
          }}
        />
      )
    }

    return (
      <SceneWrapper background="theme" hasTabs={false}>
        <ScrollView>{rows}</ScrollView>
      </SceneWrapper>
    )
  }
}

export const CurrencyNotificationScene = connect<StateProps, DispatchProps, OwnProps>(
  state => ({
    userId: state.core.account.rootLoginId
  }),
  dispatch => ({
    enableNotifications(currencyCode, hours, enabled) {
      dispatch(enableNotifications(currencyCode, hours, enabled))
    }
  })
)(CurrencyNotificationComponent)
