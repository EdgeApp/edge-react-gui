import React, {Component} from 'react'
import {Actions} from 'react-native-router-flux'
import {sprintf} from 'sprintf-js'
import strings from '../../../../../locales/default'
import BackButton from './BackButton.ui'
import * as Constants from '../../../../../constants'

const BACK_TEXT = sprintf(strings.enUS['back_button_text'])
const CANCEL_TEXT = sprintf(strings.enUS['string_cancel'])

export default class Left extends Component {
  render () {
    const children = this.props.routes.scene.children
    const sceneName = children
      ? this.props.routes.scene.children[this.props.routes.scene.index].name
      : null

    switch (sceneName) {
    case Constants.CREATE_WALLET:
      return <BackButton label={CANCEL_TEXT} onPress={() => Actions[Constants.WALLET_LIST]({type: 'reset'})} />
    case Constants.TRANSACTION_DETAILS:
      return <BackButton label={CANCEL_TEXT} onPress={() => Actions[Constants.TRANSACTION_LIST]({type: 'reset'})} />
    case Constants.SEND_CONFIRMATION:
      return <BackButton label={BACK_TEXT} onPress={() => Actions[Constants.SCAN]({type: 'reset'})} />
    case Constants.BTC_SETTINGS:
      return <BackButton label={BACK_TEXT} onPress={() => Actions[Constants.SETTINGS_OVERVIEW]({type: 'reset'})} />
    case Constants.ETH_SETTINGS:
      return <BackButton label={BACK_TEXT} onPress={() => Actions[Constants.SETTINGS_OVERVIEW]({type: 'reset'})} />
    case Constants.LTC_SETTINGS:
      return <BackButton label={BACK_TEXT} onPress={() => Actions[Constants.SETTINGS_OVERVIEW]({type: 'reset'})} />
    case Constants.CHANGE_PASSWORD:
      return <BackButton label={CANCEL_TEXT} onPress={() => Actions[Constants.SETTINGS_OVERVIEW]({type: 'reset'})} />
    case Constants.CHANGE_PIN:
      return <BackButton label={CANCEL_TEXT} onPress={() => Actions[Constants.SETTINGS_OVERVIEW]({type: 'reset'})} />
    case Constants.RECOVER_PASSWORD:
      return <BackButton label={CANCEL_TEXT} onPress={() => Actions[Constants.SETTINGS_OVERVIEW]({type: 'reset'})} />

    default:
      return null
    }
  }
}
