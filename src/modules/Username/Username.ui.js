import React, { Component } from 'react'
import { connect } from 'react-redux'
import { View, Text, TextInput } from 'react-native'

import { changeUsernameValue } from './Username.action'
import { checkUsername } from './Username.middleware'

import Container from '../SignUp.ui'

import style from './Username.style'
import t from '../../lib/LocaleStrings'
import NextButton from '../NextButton/NextButton.ui'

class UsernameComponent extends Component {

  handleSubmit = () => {
    this.props.dispatch(checkUsername(this.props.username))
  }

  handleOnChangeText = (username) => {
    this.props.dispatch(changeUsernameValue(username))
  }

  render () {
    const { username } = this.props
    return (
      <Container>
        <View style={style.inputView}>
          <TextInput
            autoCorrect={false}
            style={style.usernameInput}
            placeholder={t('fragment_landing_username_hint')}
            onChangeText={this.handleOnChangeText}
            value={username}
            autoFocus
            blurOnSubmit
            returnKeyType='next'
            onBlur={() => { this.handleSubmit() }}
          />
          <Text style={style.paragraph}>
            {t('fragment_setup_username_text')}
          </Text>
          <NextButton onPress={() => { this.handleSubmit() }} />
        </View>
      </Container>
    )
  }
}

export default connect(state => ({

  username: state.username

}))(UsernameComponent)
