// @flow

import React, { Component } from 'react'
import { TouchableOpacity } from 'react-native'
import { Actions } from 'react-native-router-flux'

import s from '../../../../../locales/strings.js'
import T from '../../../components/FormattedText'
import styles from '../style'

const EXIT_TEXT = s.strings.string_exit

type Props = {}

class ExitButton extends Component<Props> {
  popThis = () => {
    Actions.pop()
  }
  render () {
    return (
      <TouchableOpacity style={styles.sideTextWrap} onPress={this.popThis}>
        <T style={[styles.sideText]}>{EXIT_TEXT}</T>
      </TouchableOpacity>
    )
  }
}
export { ExitButton }
