import React, {Component} from 'react'
import {TouchableHighlight, View} from 'react-native'
import T from '../../../components/FormattedText'
import styles from '../style'
import strings from '../../../../../locales/default'
import {sprintf} from 'sprintf-js'

const NEGATIVE_TEXT = sprintf(strings.enUS['string_cancel_cap'])
const POSITIVE_TEXT = sprintf(strings.enUS['calculator_done'])

export default class RenameWalletButtons extends Component {
  onPositive = () => {
    this.props.onPositive(this.props.walletId, this.props.renameWalletInput)
    this.props.onDone()
  }

  onNegative = () => {
    this.props.onNegative('')
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
