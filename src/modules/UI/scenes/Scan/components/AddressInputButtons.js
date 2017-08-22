import React, { Component } from 'react'
import {
  View,
  TouchableHighlight
} from 'react-native'
import ModalStyle from '../../../components/Modal/style'
import { border } from '../../../../utils.js'
import {sprintf} from 'sprintf-js'
import strings from '../../../../../locales/default'
import T from '../../../components/FormattedText'

export class AddressInputButtons extends Component { // this component is for the button area of the Recipient Address Modal
  render () {
    return (
      <View style={[ModalStyle.buttonsWrap, border('gray')]}>
        <TouchableHighlight onPress={this.props.onCancel} style={[ModalStyle.cancelButtonWrap, ModalStyle.stylizedButton]}>
          <View style={ModalStyle.stylizedButtonTextWrap}>
            <T style={[ModalStyle.cancelButton, ModalStyle.stylizedButtonText]}>{sprintf(strings.enUS['string_cancel_cap'])}</T>
          </View>
        </TouchableHighlight>
        <TouchableHighlight onPress={this.props.onSubmit} style={[ModalStyle.doneButtonWrap, ModalStyle.stylizedButton]}>
          <View style={ModalStyle.stylizedButtonTextWrap}>
            <T style={[ModalStyle.doneButton, ModalStyle.stylizedButtonText]}>{sprintf(strings.enUS['string_done_cap'])}</T>
          </View>
        </TouchableHighlight>
      </View>
    )
  }
}
