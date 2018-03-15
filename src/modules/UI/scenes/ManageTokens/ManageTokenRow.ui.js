// @flow

import type { EdgeMetaToken } from 'edge-core-js'
import _ from 'lodash'
import React, { Component } from 'react'
import { TouchableHighlight, TouchableWithoutFeedback, View } from 'react-native'
import Icon from 'react-native-vector-icons/SimpleLineIcons'

import type { CustomTokenInfo } from '../../../../types.js'
import * as UTILS from '../../../utils.js'
import CheckBox from '../../components/CheckBox'
import Text from '../../components/FormattedText'
import styles, { styles as rawStyles } from './style.js'

// import THEME from '../../../../theme/variables/airbitz'

export type State = {
  enabled?: boolean
}

export type Props = {
  toggleToken: string => void,
  // this is an stange case that needs to be looked at later
  metaToken: EdgeMetaToken & {
    item: any
  },
  enabled?: boolean,
  enabledList: Array<string>,
  goToEditTokenScene: string => void,
  customTokensList: Array<CustomTokenInfo>
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

    const isEditable: boolean = _.findIndex(this.props.customTokensList, token => token.currencyCode === item.currencyCode) !== -1
    const onPress = isEditable ? this.props.goToEditTokenScene : UTILS.noOp

    return (
      <TouchableHighlight onPress={() => onPress(item.currencyCode)} underlayColor={rawStyles.underlay.color} style={[styles.manageTokenRow]}>
        <View style={[styles.manageTokenRowInterior]}>
          <View style={styles.rowLeftArea}>
            <TouchableWithoutFeedback onPress={() => this.props.toggleToken(item.currencyCode)} isVisible={item.isVisible} enabled={enabled}>
              <View style={[styles.touchableCheckboxInterior]}>
                <CheckBox style={styles.checkBox} enabled={enabled} />
              </View>
            </TouchableWithoutFeedback>
            <View style={[styles.tokenNameArea]}>
              <Text style={[styles.tokenNameText]}>
                {item.currencyName} ({item.currencyCode})
              </Text>
            </View>
          </View>
          <View>{isEditable && <Icon style={styles.rowRightArrow} name="arrow-right" />}</View>
        </View>
      </TouchableHighlight>
    )
  }
}

export default ManageTokenRow
