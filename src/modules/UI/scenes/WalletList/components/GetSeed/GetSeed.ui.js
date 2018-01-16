// @flow

import React, {Component} from 'react'
import {View, TouchableHighlight} from 'react-native'
import {MaterialInputOnWhite, ConfirmPasswordModalStyle} from '../../../../../../styles/indexStyles'
import {FormField} from '../../../../../../components/indexComponents'
import * as WALLET_API from '../../../../../Core/Wallets/api.js'

import T from '../../../../components/FormattedText/FormattedText.ui'
import styles from '../../style'
import s from '../../../../../../locales/strings.js'

const NEGATIVE_TEXT = s.strings.string_cancel_cap
const POSITIVE_TEXT = s.strings.string_get_seed

export const GET_SEED_WALLET_START = 'GET_SEED_WALLET_START'
export const GET_SEED_WALLET_SUCCESS = 'GET_SEED_WALLET_SUCCESS'

type Props = {
  onPositive: (walletId: string) => void,
  onNegative: () => void,
  onDone: () => void,
  walletId: string,
  getSeed: any
}
type State = {
  confimPassword: String
}

export default class GetSeed extends Component<Props, State> {
  componentWillMount () {
    this.setState({
      confimPassword: ''
    })
  }

  textChange = (value: string) => {
    this.setState({
      confimPassword: value
    })
  }

  onDone = () => {
    this.props.onDone()
  }

  onNegative = () => {
    this.props.onNegative()
    this.props.onDone()
  }

  onPositive = () => {
    this.props.onPositive(this.state.confimPassword)
  }

  renderMiddle = (style: any) => {
    const formStyle = {...MaterialInputOnWhite,
      container: {...MaterialInputOnWhite.container, width: 244}
    }
    return <View style={ConfirmPasswordModalStyle.middle.container} >
      <FormField onChangeText={this.textChange}
        style={formStyle}
        label={s.strings.confirm_password_text}
        value={this.state.confimPassword}
        secureTextEntry
        autoFocus/>
    </View>
  }

  renderBottom = () => {
    return <View style={[styles.buttonsWrap]}>
      <TouchableHighlight style={[styles.cancelButtonWrap, styles.stylizedButton]}
        onPress={this.onNegative}>
        <View style={styles.stylizedButtonTextWrap}>
          <T style={[styles.cancelButton, styles.stylizedButtonText]}>
            {NEGATIVE_TEXT}
          </T>
        </View>
      </TouchableHighlight>

      <TouchableHighlight style={[styles.doneButtonWrap, styles.stylizedButton]}
        onPress={this.onPositive}>
        <View style={styles.stylizedButtonTextWrap}>
          <T style={[styles.doneButton, styles.stylizedButtonText]}>
            {POSITIVE_TEXT}
          </T>
        </View>
      </TouchableHighlight>

    </View>
  }

  render () {
    if (this.props.privateSeedUnlocked) {
      return (<T> {this.props.getSeed()} </T>)
    }
    return (
      <View style={[styles.container, {flexDirection: 'column'}]}>
        {this.renderMiddle()}
        {this.renderBottom()}
      </View>
    )
  }
}
