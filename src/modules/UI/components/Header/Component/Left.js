import React, {Component} from 'react'
import {Actions} from 'react-native-router-flux'
import {sprintf} from 'sprintf-js'
import strings from '../../../../../locales/default'
import BackButton from './BackButton.ui'

const BACK_TEXT = sprintf(strings.enUS['back_button_text'])
const CANCEL_TEXT = sprintf(strings.enUS['string_cancel_cap'])

export default class Left extends Component {
  render () {
    const children = this.props.routes.scene.children
    const sceneName = children
      ? this.props.routes.scene.children[this.props.routes.scene.index].name
      : null

    switch (sceneName) {
    case 'createWallet':
      return <BackButton label={CANCEL_TEXT} onPress={() => Actions.walletList({type: 'reset'})} />
    case 'transactionDetails':
      return <BackButton label={CANCEL_TEXT} onPress={() => Actions.transactionList({type: 'reset'})} />
    case 'sendConfirmation':
      return <BackButton label={BACK_TEXT} onPress={() => Actions.scan({type: 'reset'})} />
    case 'btcSettings':
      return <BackButton label={BACK_TEXT} onPress={() => Actions.settingsOverview({type: 'reset'})} />
    case 'ethSettings':
      return <BackButton label={BACK_TEXT} onPress={() => Actions.settingsOverview({type: 'reset'})} />
    case 'ltcSettings':
      return <BackButton label={BACK_TEXT} onPress={() => Actions.settingsOverview({type: 'reset'})} />
    default:
      return null
    }
  }
}
