// @flow

import React, { Component } from 'react'
import { TouchableOpacity } from 'react-native'
import { Actions } from 'react-native-router-flux'

import s from '../../../../../locales/strings.js'
import T from '../../../components/FormattedText'
import styles from '../style'

type Props = {}

class ExitButton extends Component<Props> {
  popThis = () => {
    Actions.pop()
  }
  render () {
    return (
      <TouchableOpacity style={styles.sideTextWrap} onPress={this.popThis}>
        <T style={styles.sideText}>{s.strings.string_exit}</T>
      </TouchableOpacity>
    )
  }
}
export { ExitButton }
