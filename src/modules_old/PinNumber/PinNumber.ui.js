import React, { Component } from 'react'
import { connect } from 'react-redux'
import { View, Text, TextInput } from 'react-native'

import { changePinNumberValue } from './PinNumber.action'
import { checkPIN } from './PinNumber.middleware'

import { MKTextField } from 'react-native-material-kit'
import Container from '../SignUp.ui'
import style from './PinNumber.style'
import t from '../../lib/LocaleStrings'
import NextButton from '../NextButton/NextButton.ui'

class PinComponent extends Component {

  handleSubmit = () => {
    this.refs.signupPin.blur()
    this.props.dispatch(
      checkPIN(this.props.pinNumber, this.props.navigator)
    )
  }
  changePinDummy = (pinDummy) => {
    if (this.props.pinDummy.length < this.props.pinNumber.length) {
      this.props.dispatch(changePinNumberValue(this.props.pinNumber.substr(0, this.props.pinDummy.length)))
    }
  }
  focusPin = () => {
    this.refs.signupPinDummy.blur()
    this.refs.signupPin.focus()
  }
  handleOnChangeText = (pinNumber) => {
    this.props.dispatch(changePinNumberValue(pinNumber))
    if (pinNumber.length > 3) {
      this.refs.signupPin.blur()
    }
  }
  pinStyle = () => {
    if (this.props.pinDummy.length > 0) return {fontSize: 110, paddingTop: 0, paddingBottom: -35}
    return {}
  }
  render () {
    return (
      <Container>
        <View style={style.inputView}>
          <Text style={style.inputLabel}>
            {t('fragment_setup_pin_title')}
          </Text>
          <MKTextField
            selectionColor='#CCCCCC'
            style={{alignSelf: 'center', marginVertical: 15}}
            tintColor='#CCC'
            textInputStyle={[style.input, {textAlign: 'center'}, this.pinStyle()]}
            placeholder={t('activity_signup_pin_hint')}
            onChangeText={this.changePinDummy}
            onFocus={this.focusPin}
            value={this.props.pinDummy}
            ref='signupPinDummy'
          />
          <Text style={style.paragraph}>
            {t('fragment_setup_pin_text')}
          </Text>
          <NextButton onPress={this.handleSubmit} />
          <TextInput
            ref='signupPin'
            style={{height: 0, width: 0}}
            secureTextEntry
            value={this.props.pinNumber}
            onChangeText={this.handleOnChangeText}
            autoFocus
            autoCorrect={false}
            onSubmitEditing={this.handleSubmit}
            blurOnSubmit
            keyboardType='numeric'
            maxLength={4}
          />
        </View>
      </Container>
    )
  }
}

export default connect(state => ({

  pinNumber: state.pinNumber,
  pinDummy: state.pinDummy

}))(PinComponent)
