import React, { Component } from 'react'
import { Platform, View, ScrollView, TouchableNativeFeedback, TouchableHighlight, Image } from 'react-native'
import { connect } from 'react-redux'
import { Actions } from 'react-native-router-flux'

import { closeSidebar } from '../../SideMenu/action'
import UserList from './UserList'

import { logout } from '../action.js'

import styles from '../style'
const platform = Platform.OS
import T from '../../../components/FormattedText'

import buyAndSell from '../../../../../assets/images/sidenav/buysell.png'
import directory from '../../../../../assets/images/sidenav/directory.png'
import logoutImage from '../../../../../assets/images/sidenav/logout.png'
import refer from '../../../../../assets/images/sidenav/refer.png'
import security from '../../../../../assets/images/sidenav/security.png'
import settings from '../../../../../assets/images/sidenav/settings.png'
import spend from '../../../../../assets/images/sidenav/spend.png'

class MainComponent extends Component {
  render () {
    if (this.props.usersView) {
      return <UserList />
    }

    if (!this.props.usersView) {
      if (platform === 'android') {
        return (
          <View style={{flex: 1}}>
            <ScrollView contentContainerStyle={styles.main.container}>
              {this._render2FAenabling()}
              <TouchableNativeFeedback background={TouchableNativeFeedback.SelectableBackground()} onpress={() => console.log('')}>
                <View style={[ styles.main.link, styles.main.borderVertical ]}>
                  <View style={styles.iconImageContainer}>
                    <Image style={styles.iconImage} source={buyAndSell} />
                  </View>
                  <View style={styles.main.textContainer}>
                    <T style={styles.main.text}>
                      Buy/Sell Digital Currency
                    </T>
                    <T style={styles.main.textItalic}>
                      i.e Bitcoin/Ether
                    </T>
                  </View>
                </View>
              </TouchableNativeFeedback>
              <TouchableNativeFeedback background={TouchableNativeFeedback.SelectableBackground()} onpress={() => console.log('')}>
                <View style={[ styles.main.link, styles.main.borderBottom ]}>
                  <View style={styles.iconImageContainer}>
                    <Image style={styles.iconImage} source={spend} />
                  </View>
                  <View style={styles.main.textContainer}>
                    <T style={styles.main.text}>
                      Spend Bitcoins
                    </T>
                    <T style={styles.main.textItalic}>
                      Plugins
                    </T>
                  </View>
                </View>
              </TouchableNativeFeedback>
              <TouchableNativeFeedback background={TouchableNativeFeedback.SelectableBackground()} onpress={() => console.log('')}>
                <View style={[ styles.main.link, styles.main.borderBottom ]}>
                  <View style={styles.iconImageContainer}>
                    <Image style={styles.iconImage} source={refer} />
                  </View>
                  <View style={styles.main.textContainer}>
                    <T style={styles.main.text}>
                      Refer Your Friends
                    </T>
                    <T style={styles.main.textItalic}>
                      Earn Money
                    </T>
                  </View>
                </View>
              </TouchableNativeFeedback>
              <TouchableNativeFeedback onPress={() => this._handleOnPressRouting('walletList')}>
                <View style={[ styles.main.link, styles.main.borderBottom ]}>
                  <View style={styles.iconImageContainer}>
                    <Image style={styles.iconImage} source={directory} />
                  </View>
                  <View style={styles.main.textContainer}>
                    <T style={styles.main.text}>
                      Directory
                    </T>
                    <T style={styles.main.textItalic}>
                      Find Local Business
                    </T>
                  </View>
                </View>
              </TouchableNativeFeedback>
            </ScrollView>
            <View style={styles.others.container}>
              <TouchableNativeFeedback onpress={() => console.log('')}>
                <View style={[styles.others.link, styles.others.borderVertical]}>
                  <View style={styles.iconImageContainer}>
                    <Image style={styles.iconImage} source={logoutImage} />
                  </View>
                  <View style={styles.others.textContainer}>
                    <T style={styles.others.text}>
                      Logout
                    </T>
                  </View>
                </View>
              </TouchableNativeFeedback>
              <TouchableNativeFeedback onPress={() => this._handleOnPressRouting('settingsOverview')} background={TouchableNativeFeedback.SelectableBackground()}>
                <View style={styles.others.link}>
                  <View style={styles.iconImageContainer}>
                    <Image style={styles.iconImage} source={settings} />
                  </View>
                  <View style={styles.others.textContainer}>
                    <T style={styles.others.text}>
                      Settings
                    </T>
                  </View>
                </View>
              </TouchableNativeFeedback>
            </View>
          </View>
        )
      }

      if (platform !== 'android') {
        return (
          <View style={{flex: 1}}>
            <ScrollView contentContainerStyle={styles.main.container}>
              {this._render2FAenabling()}
              <TouchableHighlight style={styles.main.iosTouchableHighlight} underlayColor={styles.main.iosTouchableHighlightUnderlayColor} onPress={() => console.log('')}>
                <View style={[ styles.main.link, styles.main.borderVertical, { flex: 1 } ]}>
                  <View style={styles.iconImageContainer}>
                    <Image style={styles.iconImage} source={buyAndSell} />
                  </View>
                  <View style={styles.main.textContainer}>
                    <T style={styles.main.text}>
                      Buy/Sell Digital Currency
                    </T>
                    <T style={styles.main.textItalic}>
                      i.e Bitcoin/Ether
                    </T>
                  </View>
                </View>
              </TouchableHighlight>
              <TouchableHighlight style={styles.main.iosTouchableHighlight} underlayColor={styles.main.iosTouchableHighlightUnderlayColor} onPress={() => this._handleOnPressRouting('transactions')}>
                <View style={[ styles.main.link, styles.main.borderBottom, { flex: 1 } ]}>
                  <View style={styles.iconImageContainer}>
                    <Image style={styles.iconImage} source={spend} />
                  </View>
                  <View style={styles.main.textContainer}>
                    <T style={styles.main.text}>
                      Spend Bitcoins
                    </T>
                    <T style={styles.main.textItalic}>
                      Plugins
                    </T>
                  </View>
                </View>
              </TouchableHighlight>
              <TouchableHighlight style={styles.main.iosTouchableHighlight} underlayColor={styles.main.iosTouchableHighlightUnderlayColor} onPress={() => console.log('')}>
                <View style={[styles.main.link, styles.main.borderBottom, {flex: 1}]}>
                  <View style={styles.iconImageContainer}>
                    <Image style={styles.iconImage} source={refer} />
                  </View>
                  <View style={styles.main.textContainer}>
                    <T style={styles.main.text}>
                      Refer Your Friends
                    </T>
                    <T style={styles.main.textItalic}>
                      Earn Money
                    </T>
                  </View>
                </View>
              </TouchableHighlight>
              <TouchableHighlight style={styles.main.iosTouchableHighlight} underlayColor={styles.main.iosTouchableHighlightUnderlayColor} onPress={() => console.log('')}>
                <View style={[ styles.main.link, styles.main.borderBottom, { flex: 1 } ]}>
                  <View style={styles.iconImageContainer}>
                    <Image style={styles.iconImage} source={directory} />
                  </View>
                  <View style={styles.main.textContainer}>
                    <T style={styles.main.text}>
                      Directory
                    </T>
                    <T style={styles.main.textItalic}>
                      Find Local Business
                    </T>
                  </View>
                </View>
              </TouchableHighlight>
            </ScrollView>
            <View style={styles.others.container}>
              <TouchableHighlight style={styles.others.iosTouchableHighlight} underlayColor={styles.main.iosTouchableHighlightUnderlayColor} onPress={() => console.log('')}>
                <View style={[ styles.others.link, styles.others.borderVertical, {flex: 1} ]}>
                  <View style={styles.iconImageContainer}>
                    <Image style={styles.iconImage} source={logoutImage} />
                  </View>
                  <View style={styles.others.textContainer}>
                    <T style={styles.others.text}>
                      Logout
                    </T>
                  </View>
                </View>
              </TouchableHighlight>
              <TouchableHighlight style={styles.others.iosTouchableHighlight} underlayColor={styles.main.iosTouchableHighlightUnderlayColor} onPress={() => this._handleOnPressRouting('settingsOverview')}>
                <View style={[ styles.others.link, styles.others.borderBottom, { flex: 1 } ]}>
                  <View style={styles.iconImageContainer}>
                    <Image style={styles.iconImage} source={settings} />
                  </View>
                  <View style={styles.others.textContainer}>
                    <T style={styles.others.text}>
                      Settings
                    </T>
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
    switch (route) {
    case 'settingsOverview':
      Actions.settingsOverview({type: 'reset'})
      break
    case 'walletList':
      Actions.walletList({type: 'reset'})
      break
    case 'transactions':
      Actions.transactionList({type: 'reset'})
      break
    default:
      null
      break
    }
    return this.props.dispatch(closeSidebar())
  }

  _render2FAenabling = () => {
    if (platform === 'android') {
      return (
        <TouchableNativeFeedback onPress={() => console.log('')} background={TouchableNativeFeedback.SelectableBackground()}>
          <View style={[ styles.main.link, styles.main.borderVertical ]}>
            <View style={styles.iconImageContainer}>
              <Image style={styles.iconImage} source={security} />
            </View>
            <View style={styles.main.textContainer}>
              <T style={styles.main.text}>
                Secure Your Account
              </T>
              <T style={styles.main.textItalic}>
                Enable 2FA / Set Password Recovery
              </T>
            </View>
          </View>
        </TouchableNativeFeedback>
      )
    }

    if (platform !== 'android') {
      return (
        <TouchableHighlight style={styles.main.iosTouchableHighlight} underlayColor={styles.main.iosTouchableHighlightUnderlayColor} onPress={() => console.log('')}>
          <View style={[ styles.main.link, styles.main.borderVertical, { flex: 1 } ]}>
            <View style={styles.iconImageContainer}>
              <Image style={styles.iconImage} source={security} />
            </View>
            <View style={styles.main.textContainer}>
              <T style={styles.main.text}>
                Secure Your Account
              </T>
              <T style={styles.main.textItalic}>
                Enable 2FA / Set Password Recovery
              </T>
            </View>
          </View>
        </TouchableHighlight>
      )
    }
  }
}

const mapStateToProps = state => ({
  usersView: state.ui.scenes.controlPanel.usersView
})
const mapDispatchToProps = dispatch => ({
  logout: () => dispatch(logout()),
  dispatch: (props) => dispatch(props)
})

export default connect(mapStateToProps, mapDispatchToProps)(MainComponent)
