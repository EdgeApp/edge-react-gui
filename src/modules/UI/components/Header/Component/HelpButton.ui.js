import React, {Component} from 'react'
import {connect} from 'react-redux'
import {TouchableOpacity} from 'react-native'

import s from '../../../../../locales/strings.js'

import {openHelpModal} from '../../HelpModal/actions.js'
import T from '../../../components/FormattedText'
import styles from '../style'

const HELP_TEXT = s.strings.string_help

class HelpButton extends Component {
  render () {
    return (
      <TouchableOpacity style={styles.sideTextWrap} onPress={() => this.props.dispatch(openHelpModal())}>
        <T style={[styles.sideText]}>
          {HELP_TEXT}
        </T>
      </TouchableOpacity>
    )
  }
}

export default connect()(HelpButton)
