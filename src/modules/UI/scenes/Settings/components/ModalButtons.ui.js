import React, {Component} from 'react'
import {
  View,
  TouchableHighlight
} from 'react-native'

import {sprintf} from 'sprintf-js'
import strings from '../../../../../locales/default'
import FormattedText from '../../../components/FormattedText/FormattedText.ui'

import styles from '../style'

export default class ModalButtons extends Component {
  render () {
    const {onDone, onCancel} = this.props
    return (
      <View style={[styles.buttonsWrap]}>

        <TouchableHighlight onPress={onCancel} style={[styles.cancelButtonWrap, styles.stylizedButton]}>
          <View style={styles.stylizedButtonTextWrap}>
            <FormattedText style={[styles.cancelButton, styles.stylizedButtonText]}>
              {sprintf(strings.enUS['string_cancel_cap'])}
            </FormattedText>
          </View>
        </TouchableHighlight>

        <TouchableHighlight onPress={onDone} style={[styles.doneButtonWrap, styles.stylizedButton]}>
          <View style={styles.stylizedButtonTextWrap}>
            <FormattedText style={[styles.doneButton, styles.stylizedButtonText]}>
              {sprintf(strings.enUS['calculator_done'])}
            </FormattedText>
          </View>
        </TouchableHighlight>

      </View>
    )
  }
}
