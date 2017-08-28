import React, { Component } from 'react'
import { TouchableOpacity } from 'react-native'
import { Actions } from 'react-native-router-flux'
import {sprintf} from 'sprintf-js'
import strings from '../../../../../locales/default'
import T from '../../../components/FormattedText'
import styles from '../style'

export default class Left extends Component {
  render () {
    switch (this.props.routes.scene.sceneKey) {
    case 'directory':
      return <BackButton />
    case 'sendConfirmation':
      return <BackButton syntax='Back' onPressFxn={() => Actions.scan({type: 'reset'})} />
    case 'createWallet':
      return <BackButton syntax='Cancel' />
    case 'transactionList':
      return this.props.routes.scene.params === 'walletList' ? <BackButton /> : null
    case 'btcSettings':
      return <BackButton syntax='Back' />
    case 'ethSettings':
      return <BackButton syntax='Back' />
    case 'transactionDetails':
      return <BackButton syntax='Cancel' />
    default:
      return null
    }
  }
}

class BackButton extends Component {
  constructor (props) {
    super(props)
    this.props.pressFxn = this.props.onPressFxn ? this.props.onPressFxn : Actions.pop
    this.props.syntax = this.props.syntax ? this.props.syntax : sprintf(strings.enUS['back_button_text'])
  }

  render () {
    return (
      <TouchableOpacity style={styles.sideTextWrap} onPress={this.props.onPressFxn ? this.props.onPressFxn : () => Actions.pop()}>
        <T style={[styles.sideText]}>{this.props.syntax}</T>
      </TouchableOpacity>
    )
  }
}
