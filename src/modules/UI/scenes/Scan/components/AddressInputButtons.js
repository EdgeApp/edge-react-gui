/* eslint-disable flowtype/require-valid-file-annotation */

import React, { Component } from 'react'
import { TouchableHighlight, View } from 'react-native'

import s from '../../../../../locales/strings.js'
import { border } from '../../../../utils.js'
import T from '../../../components/FormattedText'
import ModalStyle from '../../../components/Modal/style'
import { styles as styleRaw } from '../style'

const CANCEL_TEXT = s.strings.string_cancel_cap
const DONE_TEXT = s.strings.string_done_cap

export class AddressInputButtons extends Component {
  render () {
    return (
      <View style={[ModalStyle.buttonsWrap, border('gray')]}>
        <TouchableHighlight
          style={[ModalStyle.cancelButtonWrap, ModalStyle.stylizedButton]}
          underlayColor={styleRaw.cancelUnderlay.color}
          onPress={this.props.onCancel}
        >
          <View style={ModalStyle.stylizedButtonTextWrap}>
            <T style={[ModalStyle.cancelButton, ModalStyle.stylizedButtonText]}>{CANCEL_TEXT}</T>
          </View>
        </TouchableHighlight>

        <TouchableHighlight
          style={[ModalStyle.doneButtonWrap, ModalStyle.stylizedButton]}
          underlayColor={styleRaw.doneUnderlay.color}
          onPress={this.props.onSubmit}
        >
          <View style={ModalStyle.stylizedButtonTextWrap}>
            <T style={[ModalStyle.doneButton, ModalStyle.stylizedButtonText]}>{DONE_TEXT}</T>
          </View>
        </TouchableHighlight>
      </View>
    )
  }
}
