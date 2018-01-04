import React, {Component} from 'react'
import {TouchableHighlight, View} from 'react-native'

import s from '../../../../../locales/strings.js'
import FormattedText from '../../../components/FormattedText/FormattedText.ui'

import styles, {styles as styleRaw} from '../../../components/Modal/style'

const CANCEL_TEXT = s.strings.string_cancel_cap
const DONE_TEXT   = s.strings.calculator_done

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
