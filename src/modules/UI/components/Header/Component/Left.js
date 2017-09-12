import React, {Component} from 'react'
import {TouchableOpacity} from 'react-native'
import {Actions} from 'react-native-router-flux'
import {sprintf} from 'sprintf-js'
import strings from '../../../../../locales/default'
import T from '../../../components/FormattedText'
import styles from '../style'

export default class Left extends Component {
  render () {
    const children = this.props.routes.scene.children
    const sceneName = children
      ? this.props.routes.scene.children[this.props.routes.scene.index].name
      : null

    switch (sceneName) {
    case 'sendConfirmation':
      return <BackButton syntax='Back' onPressFxn={() => Actions.scan({type: 'reset'})} />
    case 'createWallet':
      return <BackButton syntax='Cancel' onPressFxn={() => Actions.walletList({type: 'reset'})} />
    case 'btcSettings':
      return <BackButton syntax='Back' onPressFxn={() => Actions.settingsOverview({type: 'reset'})} />
    case 'ethSettings':
      return <BackButton syntax='Back' onPressFxn={() => Actions.settingsOverview({type: 'reset'})} />
    case 'transactionDetails':
      return <BackButton syntax='Cancel' onPressFxn={() => Actions.transactionsList({type: 'reset'})} />
    default:
      return null
    }
  }
}

class BackButton extends Component {
  constructor (props) {
    super(props)
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
