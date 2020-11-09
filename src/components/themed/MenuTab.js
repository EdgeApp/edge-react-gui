// @flow

import * as React from 'react'
import { TouchableOpacity, View } from 'react-native'
import { type Navigation, Actions } from 'react-native-router-flux'
import { isIPhoneX } from 'react-native-safe-area-view'
import Ionicon from 'react-native-vector-icons/Ionicons'

import { Fontello } from '../../assets/vector/index.js'
import * as Constants from '../../constants/indexConstants'
import s from '../../locales/strings.js'
import { type Theme, type ThemeProps, cacheStyles, withTheme } from '../services/ThemeContext.js'
import { EdgeText } from './EdgeText.js'

type OwnProps = {
  navigation: Navigation
}

type Props = OwnProps & ThemeProps

const title = {
  [Constants.WALLET_LIST]: s.strings.title_wallets,
  [Constants.PLUGIN_BUY]: s.strings.title_buy,
  [Constants.PLUGIN_SELL]: s.strings.title_sell,
  [Constants.EXCHANGE]: s.strings.title_exchange
}

class MenuTabComponent extends React.PureComponent<Props> {
  render() {
    const { theme } = this.props
    const styles = getStyles(theme)
    const { state } = this.props.navigation
    const activeTabIndex = state.index
    return (
      <View style={styles.container}>
        {state.routes.map((element, index) => {
          const color = activeTabIndex === index ? theme.tabBarIconHighlighted : theme.tabBarIcon
          const icon = {
            [Constants.WALLET_LIST]: <Fontello name="wallet-1" size={theme.rem(1.25)} color={color} />,
            [Constants.PLUGIN_BUY]: <Fontello name="buy" size={theme.rem(1.25)} color={color} />,
            [Constants.PLUGIN_SELL]: <Fontello name="sell" size={theme.rem(1.25)} color={color} />,
            [Constants.EXCHANGE]: <Ionicon name="swap-horizontal" size={theme.rem(1.25)} color={color} />
          }
          return (
            <TouchableOpacity style={styles.content} key={element.key} onPress={() => Actions.jump(element.key)}>
              {icon[element.key]}
              <EdgeText style={{ ...styles.text, color: color }}>{title[element.key]}</EdgeText>
            </TouchableOpacity>
          )
        })}
      </View>
    )
  }
}

const getStyles = cacheStyles((theme: Theme) => ({
  container: {
    backgroundColor: theme.tabBarBackground,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center'
  },
  content: {
    flex: 1,
    paddingTop: theme.rem(0.75),
    paddingBottom: isIPhoneX ? theme.rem(2.125) : theme.rem(0.75),
    justifyContent: 'center',
    alignItems: 'center'
  },
  text: {
    fontSize: theme.rem(0.75),
    marginTop: theme.rem(2 / 16)
  }
}))

export const MenuTab = withTheme(MenuTabComponent)
