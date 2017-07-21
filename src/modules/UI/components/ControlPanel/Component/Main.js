import React, { Component } from 'react'
import { Platform, View, ScrollView, TouchableNativeFeedback, TouchableOpacity, TouchableHighlight, Image } from 'react-native'
import { connect } from 'react-redux'
import { Text, Icon } from 'native-base'
import { Actions } from 'react-native-router-flux'

import { closeSidebar } from '../../SideMenu/action'
import UserList from './UserList'

import { logout } from  '../action.js'

import styles from '../style'
const platform = Platform.OS;

import buyandsell from '../../../../../assets/images/sidenav/buysell@3x.png.png'
import directory from '../../../../../assets/images/sidenav/directory@3x.png.png'
import logout_image from '../../../../../assets/images/sidenav/logout@3x.png.png'
import refer from '../../../../../assets/images/sidenav/refer@3x.png.png'
import security from '../../../../../assets/images/sidenav/security@3x.png.png'
import settings from '../../../../../assets/images/sidenav/settings@3x.png.png'
import spend from '../../../../../assets/images/sidenav/spend@3x.png.png'

class MainComponent extends Component {
  render () {

    if(this.props.usersView) {
      return <UserList />
    }

    if(!this.props.usersView) {
      if(platform === 'android') {
        return(
          <View style={{flex:1}}>
            <ScrollView contentContainerStyle={styles.main.container}>
              { this._render2FAenabling() }
              <TouchableNativeFeedback background={TouchableNativeFeedback.SelectableBackground()} onpress={ e => console.log('') } >
                <View style={[ styles.main.link, styles.main.borderVertical ]}>
                  <View style={styles.iconImageContainer}>
                    <Image style={styles.iconImage} source={buyandsell} />
                  </View>
                  <View style={styles.main.textContainer}>
                    <Text style={styles.main.text}>
                      Buy/Sell Digital Currency
                    </Text>
                    <Text style={styles.main.textItalic}>
                      i.e Bitcoin/Ether
                    </Text>
                  </View>
                </View>
              </TouchableNativeFeedback>
              <TouchableNativeFeedback background={TouchableNativeFeedback.SelectableBackground()} onpress={ e => console.log('') } >
                <View style={[ styles.main.link, styles.main.borderBottom ]}>
                  <View style={styles.iconImageContainer}>
                    <Image style={styles.iconImage} source={spend} />
                  </View>
                  <View style={styles.main.textContainer}>
                    <Text style={styles.main.text}>Spend Bitcoins</Text>
                    <Text style={styles.main.textItalic}>Plugins</Text>
                  </View>
                </View>
              </TouchableNativeFeedback>
              <TouchableNativeFeedback background={TouchableNativeFeedback.SelectableBackground()} onpress={ e => console.log('') } >
                <View style={[ styles.main.link, styles.main.borderBottom ]}>
                  <View style={styles.iconImageContainer}>
                    <Image style={styles.iconImage} source={refer} />
                  </View>
                  <View style={styles.main.textContainer}>
                    <Text style={styles.main.text}>Refer Your Friends</Text>
                    <Text style={styles.main.textItalic}>Earn Money</Text>
                  </View>
                </View>
              </TouchableNativeFeedback>
              <TouchableNativeFeedback  onPress={() => this._handleOnPressRouting('walletList')}>
                <View style={[ styles.main.link, styles.main.borderBottom ]}>
                  <View style={styles.iconImageContainer}>
                    <Image style={styles.iconImage} source={directory} />
                  </View>
                  <View style={styles.main.textContainer}>
                    <Text style={styles.main.text}>Directory</Text>
                    <Text style={styles.main.textItalic}>Find Local Business</Text>
                  </View>
                </View>
              </TouchableNativeFeedback>
            </ScrollView>
            <View style={styles.others.container}>
              <TouchableNativeFeedback onpress={ e => console.log('') }>
                <View style={[styles.others.link, styles.others.borderVertical]}>
                  <View style={styles.iconImageContainer}>
                    <Image style={styles.iconImage} source={logout_image} />
                  </View>
                  <View style={styles.others.textContainer}>
                    <Text style={styles.others.text}>Logout</Text>
                  </View>
                </View>
              </TouchableNativeFeedback>
              <TouchableNativeFeedback  onPress={() => this._handleOnPressRouting('settingsOverview')} background={TouchableNativeFeedback.SelectableBackground()} >
                <View style={styles.others.link}>
                  <View style={styles.iconImageContainer}>
                    <Image style={styles.iconImage} source={settings} />
                  </View>
                  <View style={styles.others.textContainer}>
                    <Text style={styles.others.text}>Settings</Text>
                  </View>
                </View>
              </TouchableNativeFeedback>
            </View>
          </View>
        )
      }

      if(platform !== 'android') {
        return(
          <View style={{flex:1}}>
            <ScrollView contentContainerStyle={styles.main.container}>
              { this._render2FAenabling() }
              <TouchableHighlight style={styles.main.iosTouchableHighlight} underlayColor={styles.main.iosTouchableHighlightUnderlayColor} onPress={ e => console.log('') } >
                <View style={[ styles.main.link, styles.main.borderVertical, { flex: 1 } ]}>
                  <View style={styles.iconImageContainer}>
                    <Image style={styles.iconImage} source={buyandsell} />
                  </View>
                  <View style={styles.main.textContainer}>
                    <Text style={styles.main.text}>
                      Buy/Sell Digital Currency
                    </Text>
                    <Text style={styles.main.textItalic}>
                      i.e Bitcoin/Ether
                    </Text>
                  </View>
                </View>
              </TouchableHighlight>
              <TouchableHighlight style={styles.main.iosTouchableHighlight} underlayColor={styles.main.iosTouchableHighlightUnderlayColor}  onPress={() => this._handleOnPressRouting('transactions')} >
                <View style={[ styles.main.link, styles.main.borderBottom, { flex: 1 } ]}>
                  <View style={styles.iconImageContainer}>
                    <Image style={styles.iconImage} source={spend} />
                  </View>
                  <View style={styles.main.textContainer}>
                    <Text style={styles.main.text}>Spend Bitcoins</Text>
                    <Text style={styles.main.textItalic}>Plugins</Text>
                  </View>
                </View>
              </TouchableHighlight>
              <TouchableHighlight style={styles.main.iosTouchableHighlight} underlayColor={styles.main.iosTouchableHighlightUnderlayColor}  onPress={ e => console.log('') }>
                <View style={[styles.main.link, styles.main.borderBottom, {flex: 1}]}>
                  <View style={styles.iconImageContainer}>
                    <Image style={styles.iconImage} source={refer} />
                  </View>
                  <View style={styles.main.textContainer}>
                    <Text style={styles.main.text}>Refer Your Friends</Text>
                    <Text style={styles.main.textItalic}>Earn Money</Text>
                  </View>
                </View>
              </TouchableHighlight>
              <TouchableHighlight style={styles.main.iosTouchableHighlight} underlayColor={styles.main.iosTouchableHighlightUnderlayColor}  onPress={ e => console.log('') } >
                <View style={[ styles.main.link, styles.main.borderBottom, { flex: 1 } ]}>
                  <View style={styles.iconImageContainer}>
                    <Image style={styles.iconImage} source={directory} />
                  </View>
                  <View style={styles.main.textContainer}>
                    <Text style={styles.main.text}>Directory</Text>
                    <Text style={styles.main.textItalic}>Find Local Business</Text>
                  </View>
                </View>
              </TouchableHighlight>
            </ScrollView>
            <View style={styles.others.container}>
              <TouchableHighlight style={styles.others.iosTouchableHighlight} underlayColor={styles.main.iosTouchableHighlightUnderlayColor}   onPress={ e => console.log('') }>
                <View style={[ styles.others.link, styles.others.borderVertical, {flex: 1 }]}>
                  <View style={styles.iconImageContainer}>
                    <Image style={styles.iconImage} source={logout_image} />
                  </View>
                  <View style={styles.others.textContainer}>
                    <Text style={styles.others.text}>Logout</Text>
                  </View>
                </View>
              </TouchableHighlight>
              <TouchableHighlight style={styles.others.iosTouchableHighlight} underlayColor={styles.main.iosTouchableHighlightUnderlayColor}  onPress={() => this._handleOnPressRouting('settingsOverview')} >
                <View style={[ styles.others.link, styles.others.borderBottom, { flex: 1 } ]}>
                  <View style={styles.iconImageContainer}>
                    <Image style={styles.iconImage} source={settings} />
                  </View>
                  <View style={styles.others.textContainer}>
                    <Text style={styles.others.text}>Settings</Text>
                  </View>
                </View>
              </TouchableHighlight>
            </View>
          </View>
        )
      }
    }
  }

  _handleOnPressRouting = (route) => {
    switch(route){
      case 'settingsOverview':
        Actions.settingsOverview()
        break
      case 'walletList':
        Actions.walletList()
        break
      case 'transactions':
        Actions.transactionList()
        break
      default:
        null
        break
    }
    return this.props.dispatch(closeSidebar())
  }

  _render2FAenabling = () => {
    if(platform === 'android') {
      return (
        <TouchableNativeFeedback onPress={ e => console.log('') } background={TouchableNativeFeedback.SelectableBackground()} >
          <View style={[ styles.main.link, styles.main.borderVertical ]}>
            <View style={styles.iconImageContainer}>
              <Image style={styles.iconImage} source={security} />
            </View>
            <View style={styles.main.textContainer}>
              <Text style={styles.main.text}>Secure Your Account</Text>
              <Text style={styles.main.textItalic}>Enable 2FA / Set Password Recovery</Text>
            </View>
          </View>
        </TouchableNativeFeedback>
      )
    }

    if(platform !== 'android') {
      return (
        <TouchableHighlight style={styles.main.iosTouchableHighlight} underlayColor={styles.main.iosTouchableHighlightUnderlayColor} onPress={ e => console.log('') } >
          <View style={[ styles.main.link, styles.main.borderVertical, { flex: 1 } ]}>
            <View style={styles.iconImageContainer}>
              <Image style={styles.iconImage} source={security} />
            </View>
            <View style={styles.main.textContainer}>
              <Text style={styles.main.text}>Secure Your Account</Text>
              <Text style={styles.main.textItalic}>Enable 2FA / Set Password Recovery</Text>
            </View>
          </View>
        </TouchableHighlight>
      )
    }
  }
}

const mapStateToProps = state => ({
  usersView : state.ui.scenes.controlPanel.usersView
})
const mapDispatchToProps = dispatch => ({
  logout: () => { dispatch(logout()) },
  dispatch: (props) => { dispatch(props) }
})

export default connect(mapStateToProps, mapDispatchToProps)(MainComponent)
