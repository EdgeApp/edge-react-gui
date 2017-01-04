import React, { Component } from 'react'
import { connect } from 'react-redux'
import { View, Text } from 'react-native'

import { changePinNumberValue } from './PinNumber.action'
import { checkPIN } from './PinNumber.middleware'

import { MKTextField } from 'react-native-material-kit'
import Container from '../SignUp.ui'
import style from './PinNumber.style'
import t from '../../lib/LocaleStrings'
import NextButton from '../NextButton/NextButton.ui'

class PinComponent extends Component {

  handleSubmit = () => {
    this.props.dispatch(
      checkPIN(this.props.pinNumber, this.props.navigator)
    )
  }

  handleOnChangeText = (pinNumber) => {
    this.props.dispatch(changePinNumberValue(pinNumber))
    if (pinNumber.length > 3) {
      this.refs.signupPin.blur()
    }
  }

  render () {
    const pinNumber = this.props.pinNumber
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
            textInputStyle={[style.input, {textAlign: 'center'}]}
            placeholder={t('activity_signup_pin_hint')}
            keyboardType='numeric'
            maxLength={4}
            autoFocus
            autoCorrect={false}
            secureTextEntry
            returnKeyType='next'
            onChangeText={this.handleOnChangeText}
            value={pinNumber}
            blurOnSubmit
            ref='signupPin'
          />
          <Text style={style.paragraph}>
            {t('fragment_setup_pin_text')}
          </Text>
          <NextButton onPress={this.handleSubmit} />

        </View>
      </Container>
    )
  }
}

export default connect(state => ({

  pinNumber: state.pinNumber

}))(PinComponent)
