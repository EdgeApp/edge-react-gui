import React, { Component } from 'react'
import { Platform, View, TouchableNativeFeedback, TouchableOpacity, TouchableHighlight } from 'react-native'
import { connect } from 'react-redux'
import { Text, Icon } from 'native-base'
import { Actions } from 'react-native-router-flux'

import { closeSidebar } from '../../SideMenu/action'
import UserList from './UserList'

import styles from '../style'
const platform = Platform.OS;

class MainComponent extends Component {


  _handleOnPressRouting = (route) => {
    let goRoute = Actions[route]
    goRoute()

    return this.props.dispatch(closeSidebar())
  }

  render () {

    if(this.props.usersView) {
      return <UserList />
    }

    if(!this.props.usersView) {
      if(platform === 'android') {
        return(
          <View style={{flex:1}}>
            <View style={styles.main.container}>
              <TouchableNativeFeedback  onPress={() => this._handleOnPressRouting('directory')} background={TouchableNativeFeedback.SelectableBackground()} >
                <View style={[ styles.main.link, styles.main.borderVertical ]}>
                  <Icon style={styles.main.icon} name='repeat' />
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
              <TouchableNativeFeedback  onPress={() => this._handleOnPressRouting('transactions')} background={TouchableNativeFeedback.SelectableBackground()} >
                <View style={[ styles.main.link, styles.main.borderBottom ]}>
                  <Icon style={styles.main.icon} name='basket' />
                  <View style={styles.main.textContainer}>
                    <Text style={styles.main.text}>Spend Bitcoins</Text>
                    <Text style={styles.main.textItalic}>Plugins</Text>
                  </View>
                </View>
              </TouchableNativeFeedback>
              <TouchableNativeFeedback onPress={ e => console.log('pressed3') }
                background={TouchableNativeFeedback.SelectableBackground()} >
                <View style={[ styles.main.link, styles.main.borderBottom ]}>
                  <Icon style={styles.main.icon} name='share' />
                  <View style={styles.main.textContainer}>
                    <Text style={styles.main.text}>Refer Your Friends</Text>
                    <Text style={styles.main.textItalic}>Earn Money</Text>
                  </View>
                </View>
              </TouchableNativeFeedback>
              <TouchableNativeFeedback  onPress={() => this._handleOnPressRouting('walletList')}>
                <View style={[ styles.main.link, styles.main.borderBottom ]}>
                  <Icon style={styles.main.icon} name='ios-home-outline' />
                  <View style={styles.main.textContainer}>
                    <Text style={styles.main.text}>Directory</Text>
                  </View>
                </View>
              </TouchableNativeFeedback>
            </View>
            <View style={styles.others.container}>
              <TouchableNativeFeedback onPress={ e => console.log('pressed5') }>
                <View style={[styles.others.link, styles.others.borderVertical]}>
                  <Icon style={styles.others.icon} name='log-out' />
                  <View style={styles.others.textContainer}>
                    <Text style={styles.others.text}>Logout</Text>
                  </View>
                </View>
              </TouchableNativeFeedback>
              <TouchableNativeFeedback  onPress={() => this._handleOnPressRouting('settingsOverview')} background={TouchableNativeFeedback.SelectableBackground()} >
                <View style={styles.others.link}>
                  <Icon style={styles.others.icon} name='settings' />
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
            <View style={styles.main.container}>
              <TouchableHighlight style={styles.main.iosTouchableHighlight} underlayColor={styles.main.iosTouchableHighlightUnderlayColor} onPress={() => this._handleOnPressRouting('directory')} >
                <View style={[ styles.main.link, styles.main.borderVertical, { flex: 1 } ]}>
                  <Icon style={styles.main.icon} name='repeat' />
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
                  <Icon style={styles.main.icon} name='basket' />
                  <View style={styles.main.textContainer}>
                    <Text style={styles.main.text}>Spend Bitcoins</Text>
                    <Text style={styles.main.textItalic}>Plugins</Text>
                  </View>
                </View>
              </TouchableHighlight>
              <TouchableHighlight style={styles.main.iosTouchableHighlight}
                underlayColor={styles.main.iosTouchableHighlightUnderlayColor}
                onPress={ e => console.log('pressed3') } >
                <View style={[styles.main.link, styles.main.borderBottom, {flex: 1}]}>
                  <Icon style={styles.main.icon} name='share' />
                  <View style={styles.main.textContainer}>
                    <Text style={styles.main.text}>Refer Your Friends</Text>
                    <Text style={styles.main.textItalic}>Earn Money</Text>
                  </View>
                </View>
              </TouchableHighlight>
              <TouchableHighlight style={styles.main.iosTouchableHighlight} underlayColor={styles.main.iosTouchableHighlightUnderlayColor}  onPress={() => this._handleOnPressRouting('walletList')} >
                <View style={[ styles.main.link, styles.main.borderBottom, { flex: 1 } ]}>
                  <Icon style={styles.main.icon} name='cash' />
                  <View style={styles.main.textContainer}>
                    <Text style={styles.main.text}>Directory</Text>
                  </View>
                </View>
              </TouchableHighlight>
            </View>
            <View style={styles.others.container}>
              <TouchableHighlight style={styles.others.iosTouchableHighlight}
                underlayColor={styles.main.iosTouchableHighlightUnderlayColor}
                onPress={ e => console.log('pressed5') } >
                <View style={[ styles.others.link, styles.others.borderVertical, {flex: 1 }]}>
                  <Icon style={styles.others.icon} name='log-out' />
                  <View style={styles.others.textContainer}>
                    <Text style={styles.others.text}>Logout</Text>
                  </View>
                </View>
              </TouchableHighlight>
              <TouchableHighlight style={styles.others.iosTouchableHighlight} underlayColor={styles.main.iosTouchableHighlightUnderlayColor}  onPress={() => this._handleOnPressRouting('settingsOverview')} >
                <View style={[ styles.others.link, styles.others.borderBottom, { flex: 1 } ]}>
                  <Icon style={styles.others.icon} name='settings' />
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
}

export default connect( state => ({

  usersView : state.ui.controlPanel.usersView

}) )(MainComponent)
