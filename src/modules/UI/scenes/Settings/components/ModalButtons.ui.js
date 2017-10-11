import React, {Component} from 'react'
import {TouchableHighlight, View} from 'react-native'

import strings from '../../../../../locales/default'
import FormattedText from '../../../components/FormattedText/FormattedText.ui'

import styles, {styles as styleRaw} from '../../../components/Modal/style'

const CANCEL_TEXT = strings.enUS['string_cancel_cap']
const DONE_TEXT   = strings.enUS['calculator_done']

export default class ModalButtons extends Component {
  render () {
    const {
      onDone,
      onCancel
    } = this.props

    return <View style={[styles.buttonsWrap]}>
      <TouchableHighlight style={[styles.cancelButtonWrap, styles.stylizedButton]}
        underlayColor={styleRaw.cancelUnderlay.color}
        onPress={onCancel}>
        <View style={styles.stylizedButtonTextWrap}>
          <FormattedText style={[styles.stylizedButtonText]}>
            {CANCEL_TEXT}
          </FormattedText>
        </View>
      </TouchableHighlight>

      <TouchableHighlight style={[styles.doneButtonWrap, styles.stylizedButton]}
        underlayColor={styleRaw.doneUnderlay.color}
        onPress={onDone}>
        <View style={styles.stylizedButtonTextWrap}>
          <FormattedText style={[styles.stylizedButtonText]}>
            {DONE_TEXT}
          </FormattedText>
        </View>
      </TouchableHighlight>
    </View>
  }
}
