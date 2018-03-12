// @flow

import React, { Component } from 'react'
import { Image, TouchableHighlight, View } from 'react-native'
import { Actions } from 'react-native-router-flux'
import { sprintf } from 'sprintf-js'

import logoutImage from '../../../../../assets/images/sidenav/logout.png'
import settings from '../../../../../assets/images/sidenav/settings.png'
import s from '../../../../../locales/strings.js'
import T from '../../../components/FormattedText'
import styles from '../style'
import UserList from './UserListConnector'

const LOGOUT_TEXT = sprintf(s.strings.settings_button_logout)
const SETTINGS_TEXT = sprintf(s.strings.settings_title)

type Props = {
  logout: (username?: string) => void,
  onPressOption: () => void
}

export default class Main extends Component<Props> {
  onLogout = () => {
    this.props.logout()
  }

  render () {
    return this.props.usersView ? (
      <UserList />
    ) : (
      <View style={{ flex: 1, justifyContent: 'flex-end' }}>
        <View style={styles.others.container}>
          <TouchableHighlight
            style={styles.others.iosTouchableHighlight}
            underlayColor={styles.main.iosTouchableHighlightUnderlayColor}
            onPress={this.onLogout}
          >
            <View style={[styles.others.link, styles.others.borderVertical, { flex: 1 }]}>
              <View style={styles.iconImageContainer}>
                <Image style={styles.iconImage} source={logoutImage} />
              </View>
              <View style={styles.others.textContainer}>
                <T style={styles.others.text}>{LOGOUT_TEXT}</T>
              </View>
            </View>
          </TouchableHighlight>
          <TouchableHighlight
            style={styles.others.iosTouchableHighlight}
            underlayColor={styles.main.iosTouchableHighlightUnderlayColor}
            onPress={Actions.settingsOverviewTab}
          >
            <View style={[styles.others.link, styles.others.borderBottom, { flex: 1 }]}>
              <View style={styles.iconImageContainer}>
                <Image style={styles.iconImage} source={settings} />
              </View>
              <View style={styles.others.textContainer}>
                <T style={styles.others.text}>{SETTINGS_TEXT}</T>
              </View>
            </View>
          </TouchableHighlight>
        </View>
      </View>
    )
  }
}
