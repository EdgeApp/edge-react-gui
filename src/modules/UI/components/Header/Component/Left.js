import React, {Component} from 'react'
import {Actions} from 'react-native-router-flux'
import strings from '../../../../../locales/default'
import BackButton from './BackButton.ui'
import * as Constants from '../../../../../constants'

const BACK_TEXT = strings.enUS['back_button_text']
const CANCEL_TEXT = strings.enUS['string_cancel_cap']

export default class Left extends Component {
  render () {
    const children = this.props.routes.scene.children
    const sceneName = children
      ? this.props.routes.scene.children[this.props.routes.scene.index].name
      : null

    const makeBackButton = (labelText, consts) =>
      <BackButton label={labelText} onPress={() => Actions[consts]({type: 'reset'})} />

    switch (sceneName) {
    case Constants.CREATE_WALLET:
      return makeBackButton(CANCEL_TEXT, Constants.WALLET_LIST)
    case Constants.TRANSACTION_DETAILS:
      return makeBackButton(CANCEL_TEXT, Constants.TRANSACTION_LIST)
    case Constants.SEND_CONFIRMATION:
      return makeBackButton(BACK_TEXT, Constants.SCAN)
    case Constants.BTC_SETTINGS:
      return makeBackButton(BACK_TEXT, Constants.SETTINGS_OVERVIEW)
    case Constants.ETH_SETTINGS:
      return makeBackButton(BACK_TEXT, Constants.SETTINGS_OVERVIEW)
    case Constants.LTC_SETTINGS:
      return makeBackButton(BACK_TEXT, Constants.SETTINGS_OVERVIEW)
    case Constants.BCH_SETTINGS:
      return makeBackButton(BACK_TEXT, Constants.SETTINGS_OVERVIEW)
    case Constants.CHANGE_PASSWORD:
      return makeBackButton(CANCEL_TEXT, Constants.SETTINGS_OVERVIEW)
    case Constants.CHANGE_PIN:
      return makeBackButton(CANCEL_TEXT, Constants.SETTINGS_OVERVIEW)
    case Constants.RECOVER_PASSWORD:
      return makeBackButton(CANCEL_TEXT, Constants.SETTINGS_OVERVIEW)
    default:
      return null
    }
  }
}
