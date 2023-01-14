import * as React from 'react'
import { TouchableOpacity, View } from 'react-native'
import LinearGradient from 'react-native-linear-gradient'
import { isIPhoneX } from 'react-native-safe-area-view'
import Foundation from 'react-native-vector-icons/Foundation'
import Ionicon from 'react-native-vector-icons/Ionicons'

import { Fontello } from '../../assets/vector/index'
import { LocaleStringKey } from '../../locales/en_US'
import s from '../../locales/strings'
import { config } from '../../theme/appConfig'
import { NavigationProp } from '../../types/routerTypes'
import { cacheStyles, Theme, ThemeProps, withTheme } from '../services/ThemeContext'
import { DividerLine } from './DividerLine'
import { EdgeText } from './EdgeText'
import { VectorIcon } from './VectorIcon'

interface OwnProps {
  navigation: NavigationProp<'edge'>
}

type Props = OwnProps & ThemeProps

const extraTabString: LocaleStringKey = config.extraTab?.tabTitleKey ?? 'title_map'

const title = {
  coinRanking: s.strings.title_markets,
  walletList: s.strings.title_wallets,
  pluginListBuy: s.strings.title_buy,
  pluginListSell: s.strings.title_sell,
  exchange: s.strings.title_exchange,
  extraTab: s.strings[extraTabString]
}

export class MenuTabComponent extends React.PureComponent<Props> {
  handleOnPress = (route: 'coinRanking' | 'walletList' | 'pluginListBuy' | 'pluginListSell' | 'exchange' | 'extraTab') => {
    const { navigation } = this.props

    switch (route) {
      case 'coinRanking':
        return navigation.navigate('coinRanking', {})
      case 'walletList':
        return navigation.navigate('walletListScene', {})
      case 'pluginListBuy':
        return navigation.navigate('pluginListBuy', { direction: 'buy' })
      case 'pluginListSell':
        return navigation.navigate('pluginListSell', { direction: 'sell' })
      case 'exchange':
        return navigation.navigate('exchange', {})
      case 'extraTab':
        return navigation.navigate('extraTab', undefined)
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
    let routes = state.routes

    if (config.extraTab == null) {
      routes = routes.slice(0, -1)
    }

    return (
      <View>
        <DividerLine colors={theme.tabBarTopOutlineColors} />
        <LinearGradient colors={colors} start={start} end={end} style={styles.container}>
          {routes.map((element: any, index: number) => {
            const color = activeTabIndex === index ? theme.tabBarIconHighlighted : theme.tabBarIcon
            const icon = {
              coinRanking: <Foundation name="list-number" size={theme.rem(1.25)} color={color} />,
              walletList: <Fontello name="wallet-1" size={theme.rem(1.25)} color={color} />,
              pluginListBuy: <Fontello name="buy" size={theme.rem(1.25)} color={color} />,
              pluginListSell: <Fontello name="sell" size={theme.rem(1.25)} color={color} />,
              exchange: <Ionicon name="swap-horizontal" size={theme.rem(1.25)} color={color} />,
              extraTab: <VectorIcon font="Feather" name="map-pin" size={theme.rem(1.25)} color={color} />
            }
            return (
              <TouchableOpacity style={styles.content} key={element.key} onPress={() => this.handleOnPress(element.key)}>
                {
                  // @ts-expect-error
                  icon[element.key]
                }
                <EdgeText style={{ ...styles.text, color: color }}>
                  {
                    // @ts-expect-error
                    title[element.key]
                  }
                </EdgeText>
              </TouchableOpacity>
            )
          })}
        </LinearGradient>
      </View>
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
