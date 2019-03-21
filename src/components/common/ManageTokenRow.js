// @flow

import type { EdgeMetaToken } from 'edge-core-js'
import React, { Component } from 'react'
import { TouchableHighlight, TouchableWithoutFeedback, View } from 'react-native'
import Icon from 'react-native-vector-icons/SimpleLineIcons'

import { SYNCED_ACCOUNT_DEFAULTS } from '../../modules/Core/Account/settings.js'
import CheckBox from '../../modules/UI/components/CheckBox/index'
import Text from '../../modules/UI/components/FormattedText/index'
import styles, { styles as rawStyles } from '../../styles/scenes/ManageTokensStyle.js'
import * as UTILS from '../../util/utils.js'

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
  goToEditTokenScene: string => void
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
    const { goToEditTokenScene, toggleToken, enabledList } = this.props
    let enabled = false
    if (enabledList.indexOf(item.currencyCode) >= 0) {
      enabled = true
    }
    // disable editing if token is native to the app
    const isEditable = !Object.keys(SYNCED_ACCOUNT_DEFAULTS).includes(item.currencyCode)
    const onPress = isEditable ? goToEditTokenScene : UTILS.noOp

    return (
      <TouchableHighlight onPress={() => onPress(item.currencyCode)} underlayColor={rawStyles.underlay.color} style={[styles.manageTokenRow]}>
        <View style={[styles.manageTokenRowInterior]}>
          <View style={styles.rowLeftArea}>
            <TouchableWithoutFeedback onPress={() => toggleToken(item.currencyCode)} isVisible={item.isVisible} enabled={enabled}>
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
