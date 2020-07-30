// @flow

import * as React from 'react'
import { TouchableOpacity } from 'react-native'

import { showHelpModal } from '../../../../../components/modals/HelpModal.js'
import s from '../../../../../locales/strings.js'
import T from '../../../components/FormattedText/FormattedText.ui.js'
import styles from '../style'

type Props = {}

export default class HelpButton extends React.Component<Props> {
  render() {
    return (
      <TouchableOpacity style={styles.sideTextWrap} onPress={() => showHelpModal()}>
        <T style={styles.sideText}>{s.strings.string_help}</T>
      </TouchableOpacity>
    )
  }
}
