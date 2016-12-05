import tron from '../util/reactotron';
import { connect } from 'react-redux'
import React, { Component } from 'react'
import { Text, Image, StyleSheet } from 'react-native'
import {Container, Content, Button, Icon} from 'native-base';
import t from '../lib/LocaleStrings'
import LoaderOverlay from '../Loader/LoaderOverlay'
import {Router} from "../app"
class HomeComponent extends Component {
	constructor(props) {
		super(props);

		this._openSignup = this._openSignup.bind(this);
		this._openCrash = this._openCrash.bind(this);
		this._openUserCache = this._openUserCache.bind(this);
	}

	/**
    * This is where we can define any route configuration for this
    * screen. For example, in addition to the navigationBar title we
    * could add backgroundColor.
    */
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
	render() {
		return (
				<Container>
          <Content>
						<Image source={require('../assets/drawable/background.jpg')} style={styles.backgroundImage}>
							<Text style={styles.welcome}>{t("app_name")}
							</Text>
              <Button 
              	onPress={this._openSignup}
								color="#841584"
								accessibilityLabel={t('fragment_landing_signup_button')}
							>{t('fragment_landing_signup_button')}
							</Button>
​              <Button style={{width: 140}} onPress={this._openCrash}>CRASH
                <Icon size={20} color={'#343'} name={'ios-home'} />
              </Button>
​              <Button style={{backgroundColor: '#00c497'}} >
                <Icon size={20} color={"#384850"} name={'ios-home'} />
                {t('fragment_landing_signin_button')}
              </Button>
              <Button style={{backgroundColor: '#343', width: 40}} >
                  <Icon size={20} color={"#00c497"} name={'ios-home'} />
              </Button>
              <Button transparent >
                  <Icon size={20} color={"#00c497"} name={'ios-home'} />
              </Button>
            </Image>
          </Content>
      </Container>
		);		
	}
}

const styles = StyleSheet.create({
  welcome: {
    fontSize: 30,
    textAlign: 'left',
    margin: 10,
    color: '#FFFFFF'
  },
	backgroundImage: {
		justifyContent: 'center',
		alignItems: 'stretch'
	}	  
});

export default connect()(HomeComponent)
