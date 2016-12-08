import React, { Component } from 'react'
import { connect } from 'react-redux'
import { Actions } from 'react-native-router-flux'

import Loader from './Loader/Loader.ui'
import ErrorModal from './ErrorModal/ErrorModal.ui'
import Login from './Login/Login.ui'
import LoginWithPin from './Login/LoginWithPin.ui'

import { openLogin } from './Login/Login.action'

import { View, Text, Image, StyleSheet } from 'react-native'
import { Button } from 'native-base';
import appTheme from '../../Themes/appTheme'
import t from '../lib/LocaleStrings'

import Dimensions from 'Dimensions'
const { width, height } = Dimensions.get('window');

class Main extends Component {

  handleOpenLogin = () => {
    this.props.dispatch(openLogin())  
  }

  render(){

    if(this.props.pin) {
      return (
        <View style={styles.main}>
          <LoginWithPin />
        </View>
      )  
    }  

    if(!this.props.pin) {

      if(this.props.password){
        return(
          <View style={styles.main}>
            <Login />
            <Button 
              large
              style={[ styles.button, { backgroundColor: "#2291CF" } ]}
              onPress={ Actions.signup }
              accessibilityLabel={t('fragment_landing_signup_button')}>
              {t('fragment_landing_signup_button')}
            </Button>            
          </View>
        )
      }

      if(!this.props.password) {
        return (
          <View style={styles.main}>
            <Button 
              large
              style={[ styles.button, { backgroundColor: "#80C342" } ]}
              onPress={this.handleOpenLogin}
              accessibilityLabel={t('fragment_landing_signin_button')}>
              {t('fragment_landing_signin_button')}
            </Button>
            <Button 
              large
              style={[ styles.button, { backgroundColor: "#2291CF" } ]}
              onPress={ Actions.signup }
              accessibilityLabel={t('fragment_landing_signup_button')}>
              {t('fragment_landing_signup_button')}
            </Button>            
          </View>
        )
      }

    }
  
  }

}

class HomeComponent extends Component {

  render() {
    return (
      <Image source={require('../assets/drawable/background.jpg')} resizeMode='cover' style={styles.backgroundImage}>
        <Image source={require('../assets/drawable/logo.png')} style={styles.logoImage}/>
        <Main {...this.props}/>
        <Loader />
        <ErrorModal />
      </Image>
    )
  }
  
}

const styles = StyleSheet.create({

  main: {
    justifyContent: 'flex-start',
    alignItems: 'center',
    margin: 10,
    flex: 3,
    zIndex:0
  },

  welcome: {
    fontSize: 30,
    textAlign: 'left',
    margin: 10,
    color: '#FFFFFF'
  },

  backgroundImage: {
    flex:1,
    width: null,
    height: null,
    resizeMode: 'cover',
    justifyContent: 'flex-start',
    alignItems: 'center'
  },

  logoImage: {
    flex: 1,
    justifyContent: 'center',
    resizeMode: 'contain',
    width: width * 0.5,
  },

  button: {
    marginVertical: 10,
    width: width * 0.6,
    alignSelf: 'center',
    height: 45
  },

});

export default connect( state =>  ({

  password  : state.login.viewPassword,
  pin       : state.login.viewPIN

}) )(HomeComponent)
