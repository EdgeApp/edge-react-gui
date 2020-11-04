// @flow

import type { EdgeMetaToken } from 'edge-core-js'
import * as React from 'react'
import { StyleSheet, TouchableHighlight, TouchableWithoutFeedback, View } from 'react-native'
import AntDesignIcon from 'react-native-vector-icons/AntDesign'

import { SYNCED_ACCOUNT_DEFAULTS } from '../../modules/Core/Account/settings.js'
import CheckBox from '../../modules/UI/components/CheckBox/CheckBox.ui.js'
import Text from '../../modules/UI/components/FormattedText/FormattedText.ui.js'
import { THEME } from '../../theme/variables/airbitz.js'
import { scale } from '../../util/scaling.js'
import * as UTILS from '../../util/utils.js'

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
  enabledList: string[],
  goToEditTokenScene: string => void
}

class ManageTokenRow extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {
      enabled: props.enabled
    }
  }

  render() {
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
      <TouchableHighlight onPress={() => onPress(item.currencyCode)} underlayColor={THEME.COLORS.PRIMARY_BUTTON_TOUCHED} style={styles.manageTokenRow}>
        <View style={styles.manageTokenRowInterior}>
          <View style={styles.rowLeftArea}>
            <TouchableWithoutFeedback onPress={() => toggleToken(item.currencyCode)} isVisible={item.isVisible} enabled={enabled}>
              <View style={styles.touchableCheckboxInterior}>
                <CheckBox style={styles.checkBox} enabled={enabled} />
              </View>
            </TouchableWithoutFeedback>
            <View style={styles.tokenNameArea}>
              <Text style={styles.tokenNameText}>
                {item.currencyName} ({item.currencyCode})
              </Text>
            </View>
          </View>
          <View>{isEditable && <AntDesignIcon style={styles.rowRightArrow} name="right" size={scale(16)} />}</View>
        </View>
      </TouchableHighlight>
    )
  }
}

const rawStyles = {
  manageTokenRow: {
    height: scale(44),
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: THEME.COLORS.GRAY_3,
    paddingLeft: scale(20),
    paddingRight: scale(20)
  },
  rowLeftArea: {
    flexDirection: 'row'
  },
  manageTokenRowInterior: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  touchableCheckboxInterior: {
    paddingHorizontal: scale(8),
    justifyContent: 'center',
    alignItems: 'center'
  },
  checkBox: {
    alignSelf: 'center'
  },
  tokenNameArea: {
    alignSelf: 'center'
  },
  tokenNameText: {
    color: THEME.COLORS.GRAY_1,
    fontSize: scale(16)
  },
  rowRightArrow: {
    fontSize: scale(18),
    color: THEME.COLORS.GRAY_1
  }
}
const styles: typeof rawStyles = StyleSheet.create(rawStyles)

export default ManageTokenRow
