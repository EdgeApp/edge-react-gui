// @flow

import React, {Component} from 'react'
import {
  View,
  TouchableHighlight
} from 'react-native'
import Text from '../../components/FormattedText'
import CheckBox from '../../components/CheckBox'
import styles from './style.js'
import * as UTILS from '../../../utils.js'
import THEME from '../../../../theme/variables/airbitz'
import type {GuiTokenInfo} from '../../../../types.js'

export type State = {
  enabled?: boolean
}

export type Props = {
  toggleToken: (string) => void,
  metaToken: GuiTokenInfo,
  enabled?: boolean
}

class ManageTokenRow extends Component<Props, State> {
  constructor (props: Props) {
    super(props)
    this.state = {
      enabled: props.enabled
    }
  }

  render () {
    const item = this.props.metaToken

    return (
      <TouchableHighlight
        style={[styles.manageTokenRow, UTILS.border()]}
        onPress={() => this.props.toggleToken(item.currencyCode)}
        underlayColor={THEME.COLORS.PRIMARY_BUTTON_TOUCHED}
      >
        <View style={[styles.manageTokenRowInterior, UTILS.border()]}>
          <View style={[styles.tokenNameArea, UTILS.border()]}>
            <Text style={[styles.tokenNameText, UTILS.border()]}>{item.currencyName} ({item.currencyCode})</Text>
          </View>
          <CheckBox enabled={item.enabled} />
        </View>
      </TouchableHighlight>
    )
  }
}

export default ManageTokenRow
