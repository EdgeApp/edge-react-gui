import React, { Component } from 'react'
import { View, Text, StyleSheet, TouchableHighlight } from 'react-native'
import { connect } from 'react-redux'

import Details from './UserDetails.ReviewDetails.ui'
// import Disclaimer from './Disclaimer'
import { showSignInDetails, hideSignInDetails  } from './ReviewDetails.action'
import t from "../../lib/LocaleStrings"
import style from './ReviewDetails.style'

class Review extends Component {

  handleHideDetails = () => {
    if(this.props.review) {
      this.props.dispatch(hideSignInDetails())
    }  
  }

  handleShowDetails = () => {
    if(!this.props.review) {
      this.props.dispatch(showSignInDetails())
    }  
  }

  render() {

    if(this.props.review) {
      return (
        <View style={style.container}>
          <Details username={this.props.username} pinNumber={this.props.pinNumber} password={this.props.password}/>  
          <TouchableHighlight style={style.button} onPress={this.handleHideDetails}>
            <Text style={style.buttonText}>{t('fragment_setup_writeitdown_hide')}</Text>
          </TouchableHighlight>
        </View>
      )  

    }  

    if(!this.props.review){
      return (
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
      )  
    }

  }
}

export default connect( state => ({
  
  username  : state.username,
  pinNumber  : state.pinNumber,
  password  : state.password.password,
  review    : state.reviewDetails

}) )(Review)
