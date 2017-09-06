import React, { Component } from 'react'
import { Platform, View, ScrollView, TouchableNativeFeedback, TouchableHighlight, Image } from 'react-native'
import { connect } from 'react-redux'
import { Actions } from 'react-native-router-flux'
import strings from '../../../../../locales/default'
import {sprintf} from 'sprintf-js'

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
                      {sprintf(strings.enUS['drawer_buy_sell_digital_currency'])}
                    </T>
                    <T style={styles.main.textItalic}>
                      {sprintf(strings.enUS['drawer_ie_bitcoin_ether'])}
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
                      {sprintf(strings.enUS['drawer_spend_bitcoin'])}
                    </T>
                    <T style={styles.main.textItalic}>
                      {sprintf(strings.enUS['drawer_plugins'])}
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
                      {sprintf(strings.enUS['drawer_refer_friends'])}
                    </T>
                    <T style={styles.main.textItalic}>
                      {sprintf(strings.enUS['drawer_earn_money'])}
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
                      {sprintf(strings.enUS['drawer_directory'])}
                    </T>
                    <T style={styles.main.textItalic}>
                      {sprintf(strings.enUS['drawer_find_local_business'])}
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
                      {sprintf(strings.enUS['drawer_logout'])}
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
                      {sprintf(strings.enUS['drawer_settings'])}
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
                      {sprintf(strings.enUS['drawer_buy_sell_digital_currency'])}
                    </T>
                    <T style={styles.main.textItalic}>
                      {sprintf(strings.enUS['drawer_ie_bitcoin_ether'])}
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
                      {sprintf(strings.enUS['drawer_spend_bitcoin'])}
                    </T>
                    <T style={styles.main.textItalic}>
                      {sprintf(strings.enUS['drawer_plugins'])}
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
                      {sprintf(strings.enUS['drawer_refer_friends'])}
                    </T>
                    <T style={styles.main.textItalic}>
                      {sprintf(strings.enUS['drawer_earn_money'])}
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
                      {sprintf(strings.enUS['drawer_directory'])}
                    </T>
                    <T style={styles.main.textItalic}>
                      {sprintf(strings.enUS['drawer_find_local_business'])}
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
                      {sprintf(strings.enUS['drawer_logout'])}
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
                      {sprintf(strings.enUS['drawer_settings'])}
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
                {sprintf(strings.enUS['two_fa_secure_your_account'])}
              </T>
              <T style={styles.main.textItalic}>
                {sprintf(strings.enUS['two_fa_enable_2fa'])}
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
                {sprintf(strings.enUS['two_fa_secure_your_account'])}
              </T>
              <T style={styles.main.textItalic}>
                {sprintf(strings.enUS['two_fa_enable_2fa'])}
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
