// @flow

import * as React from 'react'
import { TouchableOpacity, View } from 'react-native'
import { isIPhoneX } from 'react-native-safe-area-view'
import Ionicon from 'react-native-vector-icons/Ionicons'

import { Fontello } from '../../assets/vector/index.js'
import { EXCHANGE, PLUGIN_BUY, PLUGIN_SELL, WALLET_LIST, WALLET_LIST_SCENE } from '../../constants/SceneKeys.js'
import s from '../../locales/strings.js'
import { type ParamList, Actions } from '../../types/routerTypes.js'
import { type Theme, type ThemeProps, cacheStyles, withTheme } from '../services/ThemeContext.js'
import { EdgeText } from './EdgeText.js'

type OwnProps = {
  navigation: any
}

type Props = OwnProps & ThemeProps

const title = {
  [WALLET_LIST]: s.strings.title_wallets,
  [PLUGIN_BUY]: s.strings.title_buy,
  [PLUGIN_SELL]: s.strings.title_sell,
  [EXCHANGE]: s.strings.title_exchange
}

class MenuTabComponent extends React.PureComponent<Props> {
  handleOnPress = (route: $Keys<ParamList>) => {
    if (route === WALLET_LIST) {
      return Actions.jump(WALLET_LIST_SCENE)
    }
    Actions.jump(route)
  }

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
            [WALLET_LIST]: <Fontello name="wallet-1" size={theme.rem(1.25)} color={color} />,
            [PLUGIN_BUY]: <Fontello name="buy" size={theme.rem(1.25)} color={color} />,
            [PLUGIN_SELL]: <Fontello name="sell" size={theme.rem(1.25)} color={color} />,
            [EXCHANGE]: <Ionicon name="swap-horizontal" size={theme.rem(1.25)} color={color} />
          }
          return (
            <TouchableOpacity style={styles.content} key={element.key} onPress={() => this.handleOnPress(element.key)}>
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
