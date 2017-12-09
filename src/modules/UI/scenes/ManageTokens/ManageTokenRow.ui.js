// @flow

import React, {Component} from 'react'
import {
  View,
  TouchableHighlight
} from 'react-native'
import Text from '../../components/FormattedText'
import CheckBox from '../../components/CheckBox'
import styles from './style.js'
import THEME from '../../../../theme/variables/airbitz'

export type State = {
  enabled?: boolean
}

export type Props = {
  toggleToken: (string) => void,
  metaToken: any,
  enabled?: boolean,
  enabledList: Array<string>
}

class ManageTokenRow extends Component<Props, State> {
  constructor (props: Props) {
    super(props)
    this.state = {
      enabled: props.enabled
    }
  }

  render () {
    const { item } = this.props.metaToken
    let enabled = false
    if (this.props.enabledList.indexOf(item.currencyCode) >= 0) {
      enabled = true
    }

    return (
      <TouchableHighlight
        style={[styles.manageTokenRow]}
        onPress={() => this.props.toggleToken(item.currencyCode)}
        underlayColor={THEME.COLORS.PRIMARY_BUTTON_TOUCHED}
      >
        <View style={[styles.manageTokenRowInterior]}>
          <View style={[styles.tokenNameArea]}>
            <Text style={[styles.tokenNameText]}>{item.currencyName} ({item.currencyCode})</Text>
          </View>
          <CheckBox enabled={enabled} />
        </View>
      </TouchableHighlight>
    )
  }
}

export default ManageTokenRow
