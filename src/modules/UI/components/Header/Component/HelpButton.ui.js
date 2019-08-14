// @flow

import React, { Component } from 'react'
import { TouchableOpacity } from 'react-native'

import { showHelpModal } from '../../../../../components/modals/HelpModal.js'
import s from '../../../../../locales/strings.js'
import T from '../../../components/FormattedText'
import styles from '../style'

const HELP_TEXT = s.strings.string_help

type Props = {}

export default class HelpButton extends Component<Props> {
  render () {
    return (
      <TouchableOpacity style={styles.sideTextWrap} onPress={() => showHelpModal()}>
        <T style={[styles.sideText]}>{HELP_TEXT}</T>
      </TouchableOpacity>
    )
  }
}
