import React, { Component } from 'react'
import { connect } from 'react-redux'
import { View, Text, Image, StyleSheet } from 'react-native'
import {Container, Content, Button, Icon} from 'native-base';
import t from '../lib/LocaleStrings'
import {Router} from "../app"
import appTheme from '../../Themes/appTheme'

import Loader from './Loader/Loader.ui'
import ErrorModal from './ErrorModal/ErrorModal.ui'
import Login from './Login/Login.ui'
import { openLogin } from './Login/Login.action'

class HomeComponent extends Component {

  constructor(props) {
    super(props);
    this._openSignup = this._openSignup.bind(this);
    this._openCrash = this._openCrash.bind(this);
    this._openUserCache = this._openUserCache.bind(this);
  }

  static route = {
    userCacheOpen: false,
    navigationBar: {
      title: t('app_name')
    }
  };

  _openSignup() {
    this.props.navigator.push(Router.getRoute('signup'));    
  }

  _openCrash() {
    this.props.navigator.push(Router.getRoute('fakecrash'));    
  }  

  _openUserCache() {
    this.props.navigator.updateCurrentRouteParams({userCacheOpen:true});
  }

  checkLoginViewState = () => {

    if(!this.props.login) {
      return (
        <Button
          style={styles.signInButton}
          onPress={this.handleOpenLogin}
          accessibilityLabel={t('fragment_landing_signin_button')}>
          {t('fragment_landing_signin_button')}
        </Button>
      )  
    }  

    if(this.props.login) {
      return (
        <Login />
      )  
    }  

  }

  handleOpenLogin = () => {
    this.props.dispatch(openLogin())  
  }

  render() {
    return (
      <Container theme={appTheme}>
        <Content>
          <Image source={require('../assets/drawable/background.jpg')} style={styles.backgroundImage}>
            <Image source={require('../assets/drawable/logo.png')} style={styles.logoImage}/>
            <View style={styles.buttonView}>
              { this.checkLoginViewState() }
              <Button
                style={styles.signUpButton}
                onPress={this._openSignUp}
                accessibilityLabel={t('fragment_landing_signup_button')}>
                {t('fragment_landing_signup_button')}
              </Button>            
              <Button onPress={this._openCrash}> CRASH </Button>          
            </View>
          </Image>
        </Content>
	    <Loader />
	    <ErrorModal />
      </Container>
    )
  }
}

const styles = StyleSheet.create({

  buttonView: {
    justifyContent: 'flex-start',
    alignItems: 'center',
    margin: 10
  },

  welcome: {
    fontSize: 30,
    textAlign: 'left',
    margin: 10,
    color: '#FFFFFF'
  },

  backgroundImage: {
    justifyContent: 'flex-start',
    alignItems: 'center',
    resizeMode: Image.resizeMode.cover,
    flex:1,
    width: null
  },

  logoImage: {
    flex:0,
    alignSelf: 'center'
  },

  signInButton: {
    flex: 0,
    width: 280,
    alignSelf: 'center',
    backgroundColor: '#841584'
  },

  signUpButton: {
    flex: 0,
    width: 280,
    margin: 20,
    alignSelf: 'center',
    backgroundColor: '#000088'
  }
});

export default connect( state =>  ({

  login  :  state.login.view

}) )(HomeComponent)
