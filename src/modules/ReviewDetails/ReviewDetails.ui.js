import React, { Component } from 'react'
import { View, Text, TouchableHighlight } from 'react-native'
import { connect } from 'react-redux'
import { Actions } from 'react-native-router-flux'

import Details from './UserDetails.ReviewDetails.ui'
import ErrorModal from '../ErrorModal/ErrorModal.ui'
import Loader from '../Loader/Loader.ui'
import { showSignInDetails, hideSignInDetails } from './ReviewDetails.action'
import { loginWithPassword } from '../Login/Login.middleware'
import t from '../../lib/LocaleStrings'
import style from './ReviewDetails.style'
import NextButton from '../NextButton/NextButton.ui'

class Review extends Component {

  handleHideDetails = () => {
    if (this.props.review) {
      this.props.dispatch(hideSignInDetails())
    }
  }

  handleShowDetails = () => {
    if (!this.props.review) {
      this.props.dispatch(showSignInDetails())
    }
  }

  handleFinish = () => {
    const { username, password } = this.props.details
    this.props.dispatch(loginWithPassword(username, password))
    Actions.home()
  }

  render () {
    if (this.props.review) {
      return (
        <View style={{ flex: 1 }}>
          <View style={style.container}>
            <Details username={this.props.details.username} pinNumber={this.props.details.pin} password={this.props.details.password} />
            <TouchableHighlight style={style.button} onPress={this.handleHideDetails}>
              <Text style={style.buttonText}>{t('fragment_setup_writeitdown_hide')}</Text>
            </TouchableHighlight>
          </View>
          <NextButton onPress={this.handleFinish} />
          <ErrorModal />
          <Loader />
        </View>
      )
    }

    if (!this.props.review) {
      return (
        <View style={{ flex: 1 }}>
          <View style={style.container}>
            <View style={style.detailsContainer}>
              <Text style={style.text}>
                {t('fragment_setup_writeitdown_text')}
              </Text>
              <Text style={[ style.text, style.warning ]}>
                {t('fragment_setup_writeitdown_text_warning')}
              </Text>
            </View>
            <TouchableHighlight style={style.button} onPress={this.handleShowDetails}>
              <Text style={style.buttonText}>{t('fragment_setup_writeitdown_show')}</Text>
            </TouchableHighlight>
          </View>
          <NextButton onPress={this.handleFinish} />
          <ErrorModal />
          <Loader />
        </View>
      )
    }
  }
}

export default connect(state => ({

  details: state.reviewDetails.details,
  review: state.reviewDetails.view

}))(Review)
