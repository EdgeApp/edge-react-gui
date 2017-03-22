import React, { Component } from 'react'
import { connect } from 'react-redux'
import { View, Text } from 'react-native'
import { MKTextField } from 'react-native-material-kit'
import { changeUsernameValue } from './Username.action'
import { checkUsername } from './Username.middleware'
import { Actions } from 'react-native-router-flux'
import { fadeWhiteOverlay } from '../Landing.action'
import Container from '../SignUp.ui'
import style from './Username.style'
import t from '../../lib/LocaleStrings'
import NextButton from '../NextButton/NextButton.ui'

class UsernameComponent extends Component {

  handleSubmit = () => {
    this.refs.usernameInput.blur()
    this.props.dispatch(checkUsername(this.props.username))
  }
  handleBack = () => {
    if (this.props.loader.loading === false) {
      this.props.dispatch(fadeWhiteOverlay())
      Actions.pop()
    }
  }
  componentWillMount = () => {
    Actions.refresh({onLeft: this.handleBack})
  }

  handleOnChangeText = (username) => {
    this.props.dispatch(changeUsernameValue(username))
  }

  render () {
    const { username } = this.props
    return (
      <Container>
        <View style={style.inputView}>
          <MKTextField
            selectionColor='#CCCCCC'
            style={{marginHorizontal: 30, marginVertical: 15}}
            textInputStyle={style.usernameInput}
            ref='usernameInput'
            autoCorrect={false}
            placeholder={t('fragment_landing_username_hint')}
            onChangeText={this.handleOnChangeText}
            value={username}
            autoFocus
            blurOnSubmit
            returnKeyType='done'
          />
          <Text style={style.paragraph}>
            {t('fragment_setup_username_text')}
          </Text>
          <NextButton onPress={this.handleSubmit} />
        </View>
      </Container>
    )
  }
}

export default connect(state => ({

  username: state.username,
  loader: state.loader

}))(UsernameComponent)
