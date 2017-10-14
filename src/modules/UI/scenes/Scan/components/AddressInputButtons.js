import React, {Component} from 'react'
import {
  View,
  TouchableHighlight
} from 'react-native'
import ModalStyle from '../../../components/Modal/style'
import {border} from '../../../../utils.js'
import strings from '../../../../../locales/default'
import T from '../../../components/FormattedText'
import {styles as styleRaw} from '../style'

const CANCEL_TEXT = strings.enUS['string_cancel_cap']
const DONE_TEXT   = strings.enUS['string_done_cap']

export class AddressInputButtons extends Component {
  render () {
    return (
      <View style={[ModalStyle.buttonsWrap, border('gray')]}>

        <TouchableHighlight style={[
          ModalStyle.cancelButtonWrap,
          ModalStyle.stylizedButton
        ]}
          underlayColor={styleRaw.cancelUnderlay.color}
          onPress={this.props.onCancel}>
          <View style={ModalStyle.stylizedButtonTextWrap}>
            <T style={[
              ModalStyle.cancelButton,
              ModalStyle.stylizedButtonText
            ]}>
              {CANCEL_TEXT}
            </T>
          </View>
        </TouchableHighlight>

        <TouchableHighlight style={[
          ModalStyle.doneButtonWrap,
          ModalStyle.stylizedButton
        ]}
          underlayColor={styleRaw.doneUnderlay.color}
          onPress={this.props.onSubmit}>
          <View style={ModalStyle.stylizedButtonTextWrap}>
            <T style={[
              ModalStyle.doneButton,
              ModalStyle.stylizedButtonText
            ]}>
              {DONE_TEXT}
            </T>
          </View>
        </TouchableHighlight>

      </View>
    )
  }
}
