import React, { Component } from 'react'
import { View, ScrollView, TouchableHighlight, Image } from 'react-native'
import { connect } from 'react-redux'
import { Text } from 'native-base'
import { Actions } from 'react-native-router-flux'

import { closeSidebar } from '../../SideMenu/action'
import { logout } from '../../../../Login/action'
import UserList from './UserList'

import styles from '../style'

import buyAndSell from '../../../../../assets/images/sidenav/buysell.png'
import directory from '../../../../../assets/images/sidenav/directory.png'
import logoutImage from '../../../../../assets/images/sidenav/logout.png'
import refer from '../../../../../assets/images/sidenav/refer.png'
import security from '../../../../../assets/images/sidenav/security.png'
import settings from '../../../../../assets/images/sidenav/settings.png'
import spend from '../../../../../assets/images/sidenav/spend.png'

class MainComponent extends Component {
  onLogout = () => {
    console.log('logout')
    this.props.logout()
  }

  render () {
    return this.props.usersView ? <UserList /> : (
      <View style={{flex: 1}}>
        <ScrollView contentContainerStyle={styles.main.container}>
          {this._render2FAenabling()}
          <TouchableHighlight style={styles.main.iosTouchableHighlight} underlayColor={styles.main.iosTouchableHighlightUnderlayColor} onPress={() => console.log('')}>
            <View style={[ styles.main.link, styles.main.borderVertical, { flex: 1 } ]}>
              <View style={styles.iconImageContainer}>
                <Image style={styles.iconImage} source={buyAndSell} />
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
          <TouchableHighlight style={styles.main.iosTouchableHighlight} underlayColor={styles.main.iosTouchableHighlightUnderlayColor} onPress={() => this._handleOnPressRouting('transactions')}>
            <View style={[ styles.main.link, styles.main.borderBottom, { flex: 1 } ]}>
              <View style={styles.iconImageContainer}>
                <Image style={styles.iconImage} source={spend} />
              </View>
              <View style={styles.main.textContainer}>
                <Text style={styles.main.text}>
                  Spend Bitcoins
                </Text>
                <Text style={styles.main.textItalic}>
                  Plugins
                </Text>
              </View>
            </View>
          </TouchableHighlight>
          <TouchableHighlight style={styles.main.iosTouchableHighlight} underlayColor={styles.main.iosTouchableHighlightUnderlayColor} onPress={() => console.log('')}>
            <View style={[styles.main.link, styles.main.borderBottom, {flex: 1}]}>
              <View style={styles.iconImageContainer}>
                <Image style={styles.iconImage} source={refer} />
              </View>
              <View style={styles.main.textContainer}>
                <Text style={styles.main.text}>
                  Refer Your Friends
                </Text>
                <Text style={styles.main.textItalic}>
                  Earn Money
                </Text>
              </View>
            </View>
          </TouchableHighlight>
          <TouchableHighlight style={styles.main.iosTouchableHighlight} underlayColor={styles.main.iosTouchableHighlightUnderlayColor} onPress={() => console.log('')}>
            <View style={[ styles.main.link, styles.main.borderBottom, { flex: 1 } ]}>
              <View style={styles.iconImageContainer}>
                <Image style={styles.iconImage} source={directory} />
              </View>
              <View style={styles.main.textContainer}>
                <Text style={styles.main.text}>
                  Directory
                </Text>
                <Text style={styles.main.textItalic}>
                  Find Local Business
                </Text>
              </View>
            </View>
          </TouchableHighlight>
        </ScrollView>
        <View style={styles.others.container}>
          <TouchableHighlight style={styles.others.iosTouchableHighlight} underlayColor={styles.main.iosTouchableHighlightUnderlayColor} onPress={this.onLogout}>
            <View style={[ styles.others.link, styles.others.borderVertical, {flex: 1} ]}>
              <View style={styles.iconImageContainer}>
                <Image style={styles.iconImage} source={logoutImage} />
              </View>
              <View style={styles.others.textContainer}>
                <Text style={styles.others.text}>
                  Logout
                </Text>
              </View>
            </View>
          </TouchableHighlight>
          <TouchableHighlight style={styles.others.iosTouchableHighlight} underlayColor={styles.main.iosTouchableHighlightUnderlayColor} onPress={() => this._handleOnPressRouting('settingsOverview')}>
            <View style={[ styles.others.link, styles.others.borderBottom, { flex: 1 } ]}>
              <View style={styles.iconImageContainer}>
                <Image style={styles.iconImage} source={settings} />
              </View>
              <View style={styles.others.textContainer}>
                <Text style={styles.others.text}>
                  Settings
                </Text>
              </View>
            </View>
          </TouchableHighlight>
        </View>
      </View>
    )
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
    return (
      <TouchableHighlight style={styles.main.iosTouchableHighlight} underlayColor={styles.main.iosTouchableHighlightUnderlayColor} onPress={() => console.log('')}>
        <View style={[ styles.main.link, styles.main.borderVertical, { flex: 1 } ]}>
          <View style={styles.iconImageContainer}>
            <Image style={styles.iconImage} source={security} />
          </View>
          <View style={styles.main.textContainer}>
            <Text style={styles.main.text}>
              Secure Your Account
            </Text>
            <Text style={styles.main.textItalic}>
              Enable 2FA / Set Password Recovery
            </Text>
          </View>
        </View>
      </TouchableHighlight>
    )
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
