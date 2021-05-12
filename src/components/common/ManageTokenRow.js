// @flow

import type { EdgeMetaToken } from 'edge-core-js'
import * as React from 'react'
import { Image, TouchableHighlight, TouchableWithoutFeedback, View } from 'react-native'
import AntDesignIcon from 'react-native-vector-icons/AntDesign'

import { SYNCED_ACCOUNT_DEFAULTS } from '../../modules/Core/Account/settings.js'
import CheckBox from '../../modules/UI/components/CheckBox/CheckBox.ui.js'
import { THEME } from '../../theme/variables/airbitz.js'
import { scale } from '../../util/scaling.js'
import * as UTILS from '../../util/utils.js'
import { type Theme, cacheStyles, useTheme } from '../services/ThemeContext.js'
import { WalletListRow } from '../themed/WalletListRow'

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

function ManageTokenRow(props: Props) {
  const theme = useTheme()
  const styles = getStyles(theme)

  const { item } = props.metaToken
  const { goToEditTokenScene, enabledList, toggleToken } = props

  const Icon = () => (
    <View style={styles.iconContainer}>
      <Image style={styles.iconSize} source={{ uri: item.symbolImage }} />
    </View>
  )

  const enabled = enabledList.indexOf(item.currencyCode) >= 0

  // disable editing if token is native to the app
  const isEditable = !Object.keys(SYNCED_ACCOUNT_DEFAULTS).includes(item.currencyCode)
  const onPress = isEditable ? goToEditTokenScene : UTILS.noOp

  return (
    <TouchableHighlight onPress={() => onPress(item.currencyCode)} underlayColor={THEME.COLORS.PRIMARY_BUTTON_TOUCHED}>
      <View>
        <WalletListRow gradient icon={<Icon />} currencyCode={item.currencyCode} walletName={item.currencyName}>
          <TouchableWithoutFeedback onPress={() => toggleToken(item.currencyCode)} isVisible={item.isVisible} enabled={enabled}>
            <View style={styles.touchableCheckboxInterior}>
              <CheckBox style={styles.checkBox} enabled={enabled} />
            </View>
          </TouchableWithoutFeedback>
        </WalletListRow>
        <View>{isEditable && <AntDesignIcon style={styles.rowRightArrow} name="right" size={scale(16)} />}</View>
      </View>
    </TouchableHighlight>
  )
}

const getStyles = cacheStyles((theme: Theme) => ({
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.rem(1)
  },
  iconSize: {
    width: theme.rem(2),
    height: theme.rem(2)
  },
  touchableCheckboxInterior: {
    justifyContent: 'center',
    alignItems: 'center'
  },
  checkBox: {
    alignSelf: 'center'
  },
  rowRightArrow: {
    fontSize: scale(18),
    color: THEME.COLORS.GRAY_1
  }
}))

export default ManageTokenRow
