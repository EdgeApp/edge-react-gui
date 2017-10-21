// @flow

import React, {Component} from 'react'
import {TouchableHighlight, View} from 'react-native'
import T from '../../../components/FormattedText'
import styles from '../style'
import strings from '../../../../../locales/default'
import {sprintf} from 'sprintf-js'

const NEGATIVE_TEXT = sprintf(strings.enUS['string_cancel_cap'])
const POSITIVE_TEXT = sprintf(strings.enUS['calculator_done'])

export type JsxProps = {
  walletName: string,
}

export type StateToProps = {
  walletId: string,
  renameWalletInput: string
}

export type DispatchProps = {
  onPositive: (walletId: string, walletName: string) => any,
  onNegative: () => any,
  onDone: () => any
}

type Props = JsxProps & StateToProps & DispatchProps

export default class RenameWalletButtons extends Component <Props> {
  onPositive = () => {
    if (this.props.renameWalletInput) {
      this.props.onPositive(this.props.walletId, this.props.renameWalletInput)
    } else {
      this.props.onPositive(this.props.walletId, this.props.walletName)
    }
    this.props.onDone()
  }

  onNegative = () => {
    this.props.onNegative()
    this.props.onDone()
  }

  render () {
    return (
      <View style={[styles.buttonsWrap]}>

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
    )
  }
}
