import React, {Component} from 'react'
import {View, ScrollView, TouchableNativeFeedback, Image} from 'react-native'
import {connect} from 'react-redux'
import {Text} from 'native-base'
import {Actions} from 'react-native-router-flux'

import {closeSidebar} from '../../SideMenu/action'
import {logoutRequest} from '../action'
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
  render () {
    return this.props.usersView ? <UserList /> : (
      <View style={{flex: 1}}>
        <ScrollView contentContainerStyle={styles.main.container}>
          {this._render2FAenabling()}
          <TouchableNativeFeedback background={TouchableNativeFeedback.SelectableBackground()} onpress={() => console.log('')}>
            <View style={[ styles.main.link, styles.main.borderVertical ]}>
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
          </TouchableNativeFeedback>
          <TouchableNativeFeedback background={TouchableNativeFeedback.SelectableBackground()} onpress={() => console.log('')}>
            <View style={[ styles.main.link, styles.main.borderBottom ]}>
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
          </TouchableNativeFeedback>
          <TouchableNativeFeedback background={TouchableNativeFeedback.SelectableBackground()} onpress={() => console.log('')}>
            <View style={[ styles.main.link, styles.main.borderBottom ]}>
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
          </TouchableNativeFeedback>
          <TouchableNativeFeedback onPress={() => this._handleOnPressRouting('walletList')}>
            <View style={[ styles.main.link, styles.main.borderBottom ]}>
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
          </TouchableNativeFeedback>
        </ScrollView>
        <View style={styles.others.container}>
          <TouchableNativeFeedback onpress={() => console.log('')}>
            <View style={[styles.others.link, styles.others.borderVertical]}>
              <View style={styles.iconImageContainer}>
                <Image style={styles.iconImage} source={logoutImage} />
              </View>
              <View style={styles.others.textContainer}>
                <Text style={styles.others.text}>
                  Logout
                </Text>
              </View>
            </View>
          </TouchableNativeFeedback>
          <TouchableNativeFeedback onPress={() => this._handleOnPressRouting('settingsOverview')} background={TouchableNativeFeedback.SelectableBackground()}>
            <View style={styles.others.link}>
              <View style={styles.iconImageContainer}>
                <Image style={styles.iconImage} source={settings} />
              </View>
              <View style={styles.others.textContainer}>
                <Text style={styles.others.text}>
                  Settings
                </Text>
              </View>
            </View>
          </TouchableNativeFeedback>
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

  _render2FAenabling = () => (
      <TouchableNativeFeedback onPress={() => console.log('')} background={TouchableNativeFeedback.SelectableBackground()}>
        <View style={[ styles.main.link, styles.main.borderVertical ]}>
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
      </TouchableNativeFeedback>
    )
}

const mapStateToProps = state => ({
  usersView: state.ui.scenes.controlPanel.usersView
})
const mapDispatchToProps = dispatch => ({
  logout: () => dispatch(logoutRequest()),
  dispatch: (props) => dispatch(props)
})

export default connect(mapStateToProps, mapDispatchToProps)(MainComponent)
