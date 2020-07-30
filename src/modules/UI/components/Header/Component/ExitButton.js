// @flow

import * as React from 'react'
import { TouchableOpacity } from 'react-native'
import { Actions } from 'react-native-router-flux'

import s from '../../../../../locales/strings.js'
import T from '../../../components/FormattedText/FormattedText.ui.js'
import styles from '../style'

type Props = {}

class ExitButton extends React.Component<Props> {
  popThis = () => {
    Actions.pop()
  }

  render() {
    return (
      <TouchableOpacity style={styles.sideTextWrap} onPress={this.popThis}>
        <T style={styles.sideText}>{s.strings.string_exit}</T>
      </TouchableOpacity>
    )
  }
}
export { ExitButton }
