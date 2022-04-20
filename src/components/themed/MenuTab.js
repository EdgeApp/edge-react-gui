// @flow

import * as React from 'react'
import { TouchableOpacity } from 'react-native'
import LinearGradient from 'react-native-linear-gradient'
import { isIPhoneX } from 'react-native-safe-area-view'
import Ionicon from 'react-native-vector-icons/Ionicons'

import { Fontello } from '../../assets/vector/index.js'
import s from '../../locales/strings.js'
import { type NavigationProp, type ParamList, Actions } from '../../types/routerTypes.js'
import { type Theme, type ThemeProps, cacheStyles, withTheme } from '../services/ThemeContext.js'
import { EdgeText } from './EdgeText.js'

type OwnProps = {
  navigation: NavigationProp<'edge'>
}

type Props = OwnProps & ThemeProps

const title: { [name: $Keys<ParamList>]: string } = {
  walletList: s.strings.title_wallets,
  pluginBuy: s.strings.title_buy,
  pluginSell: s.strings.title_sell,
  exchange: s.strings.title_exchange
}

export class MenuTabComponent extends React.PureComponent<Props> {
  handleOnPress = (route: 'walletList' | 'pluginBuy' | 'pluginSell' | 'exchange') => {
    switch (route) {
      case 'walletList':
        return Actions.jump('walletListScene')
      case 'pluginBuy':
        return Actions.jump('pluginBuy', { direction: 'buy' })
      case 'pluginSell':
        return Actions.jump('pluginSell', { direction: 'sell' })
      case 'exchange':
        return Actions.jump('exchange')
    }
  }

  render() {
    const { theme } = this.props
    const styles = getStyles(theme)
    const state: any = this.props.navigation.state
    const activeTabIndex = state.index
    const colors = theme.tabBarBackground
    const start = theme.tabBarBackgroundStart
    const end = theme.tabBarBackgroundEnd

    return (
      <LinearGradient colors={colors} start={start} end={end} style={styles.container}>
        {state.routes.map((element, index) => {
          const color = activeTabIndex === index ? theme.tabBarIconHighlighted : theme.tabBarIcon
          const icon = {
            walletList: <Fontello name="wallet-1" size={theme.rem(1.25)} color={color} />,
            pluginBuy: <Fontello name="buy" size={theme.rem(1.25)} color={color} />,
            pluginSell: <Fontello name="sell" size={theme.rem(1.25)} color={color} />,
            exchange: <Ionicon name="swap-horizontal" size={theme.rem(1.25)} color={color} />
          }
          return (
            <TouchableOpacity style={styles.content} key={element.key} onPress={() => this.handleOnPress(element.key)}>
              {icon[element.key]}
              <EdgeText style={{ ...styles.text, color: color }}>{title[element.key]}</EdgeText>
            </TouchableOpacity>
          )
        })}
      </LinearGradient>
    )
  }
}

const getStyles = cacheStyles((theme: Theme) => ({
  container: {
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
