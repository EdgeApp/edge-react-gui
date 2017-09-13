import React, {Component} from 'react'
import {sprintf} from 'sprintf-js'
import strings from '../../../../../locales/default'
import {TouchableOpacity} from 'react-native'
import {openHelpModal} from '../../HelpModal/actions.js'
import {connect} from 'react-redux'
import SendConfirmationOptions from '../../../scenes/SendConfirmation/SendConfirmationOptions.js'
import T from '../../../components/FormattedText'
import styles from '../style'

class HelpButton extends Component {
  render () {
    return (
      <TouchableOpacity style={styles.sideTextWrap} onPress={() => this.props.dispatch(openHelpModal())}>
        <T style={[styles.sideText]}>{sprintf(strings.enUS['string_help'])}</T>
      </TouchableOpacity>
    )
  }
}

const HelpButtonConnect = connect()(HelpButton)

export default class Right extends Component {

  render () {
    const children = this.props.routes.scene.children
    const sceneName = children
      ? this.props.routes.scene.children[this.props.routes.scene.index].name
      : null

    switch (sceneName) {
    case 'scan':
      return <HelpButtonConnect />
    case 'walletList':
      return <HelpButtonConnect />
    case 'directory':
      return <HelpButtonConnect />
    case 'transactionsList':
      return <HelpButtonConnect />
    case 'transactionDetails':
      return <HelpButtonConnect />
    case 'request':
      return <HelpButtonConnect />
    case 'sendConfirmation':
      return <SendConfirmationOptions />
    case 'createWallet':
      return <HelpButtonConnect />
    default:
      return null
    }
  }

}
