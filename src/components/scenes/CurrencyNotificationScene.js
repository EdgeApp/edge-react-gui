// @flow

import { type EdgeCurrencyInfo } from 'edge-core-js'
import * as React from 'react'
import { ScrollView } from 'react-native'
import { Actions } from 'react-native-router-flux'
import { connect } from 'react-redux'
import { sprintf } from 'sprintf-js'

import s from '../../locales/strings.js'
import { enableNotifications, fetchSettings } from '../../modules/Notifications/action'
import { type Dispatch, type RootState } from '../../types/reduxTypes.js'
import { SceneWrapper } from '../common/SceneWrapper.js'
import { showError } from '../services/AirshipInstance'
import { SettingsSwitchRow } from '../themed/SettingsSwitchRow.js'

type NavigationProps = {
  currencyInfo: EdgeCurrencyInfo
}
type StateProps = {
  userId: string
}
type DispatchProps = {
  enableNotifications: (currencyCode: string, hours: string, enabled: boolean) => void
}
type Props = NavigationProps & StateProps & DispatchProps

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
    const { userId, currencyInfo } = this.props
    try {
      const settings = await fetchSettings(userId, currencyInfo.currencyCode)
      if (settings) this.setState({ hours: settings })
    } catch (err) {
      showError(err)
      Actions.pop()
    }
  }

  render() {
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
            this.props.enableNotifications(this.props.currencyInfo.currencyCode, hours, !enabled)
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

export const CurrencyNotificationScene = connect(
  (state: RootState): StateProps => ({
    userId: state.core.account.rootLoginId
  }),
  (dispatch: Dispatch): DispatchProps => ({
    enableNotifications(currencyCode, hours, enabled) {
      dispatch(enableNotifications(currencyCode, hours, enabled))
    }
  })
)(CurrencyNotificationComponent)
