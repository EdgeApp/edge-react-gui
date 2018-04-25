// @flow

import React, { Component } from 'react'
import { TouchableOpacity } from 'react-native'

import s from '../../../../../locales/strings.js'
import T from '../../../components/FormattedText'
import styles from '../style'

const HELP_TEXT = s.strings.string_help

type Props = { openHelpModal: () => void }
export default class HelpButton extends Component<Props> {
  render () {
    return (
      <TouchableOpacity style={styles.sideTextWrap} onPress={() => this.props.openHelpModal()}>
        <T style={[styles.sideText]}>{HELP_TEXT}</T>
      </TouchableOpacity>
    )
  }
}
