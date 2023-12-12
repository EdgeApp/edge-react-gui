import * as React from 'react'
import { TouchableOpacity, View } from 'react-native'
import Ionicon from 'react-native-vector-icons/Ionicons'

import { Fontello } from '../../assets/vector/index'
import { lstrings } from '../../locales/strings'
import { NavigationBase } from '../../types/routerTypes'
import { PromoCard } from '../cards/PromoCard'
import { EdgeAnim } from '../common/EdgeAnim'
import { cacheStyles, Theme, ThemeProps, withTheme } from '../services/ThemeContext'
import { BalanceCardUi4 } from '../ui4/BalanceCardUi4'
import { SectionHeaderUi4 } from '../ui4/SectionHeaderUi4'

interface OwnProps {
  navigation: NavigationBase
  sorting: boolean
  searching: boolean
  openSortModal: () => void
}

type Props = OwnProps & ThemeProps

export class WalletListHeaderComponent extends React.PureComponent<Props> {
  render() {
    const { navigation, sorting, searching, theme } = this.props
    const styles = getStyles(theme)

    const addSortButtons = (
      <View key="defaultButtons" style={styles.buttonsContainer}>
        <TouchableOpacity accessible={false} style={styles.addButton} onPress={() => navigation.push('createWalletSelectCrypto', {})}>
          <Ionicon testID="addButton" accessibilityHint={lstrings.wallet_list_add_wallet} color={theme.iconTappable} name="md-add" size={theme.rem(1.5)} />
        </TouchableOpacity>
        <TouchableOpacity accessible={false} onPress={this.props.openSortModal}>
          <Fontello testID="sortButton" accessibilityHint={lstrings.sort_wallets_hint} color={theme.iconTappable} name="sort" size={theme.rem(1.5)} />
        </TouchableOpacity>
      </View>
    )

    return (
      <>
        {searching ? null : (
          <EdgeAnim enter={{ type: 'fadeInUp', distance: 60 }}>
            <BalanceCardUi4 navigation={navigation} />
          </EdgeAnim>
        )}
        {sorting || searching ? null : (
          <EdgeAnim enter={{ type: 'fadeInUp', distance: 40 }}>
            <SectionHeaderUi4 leftTitle={lstrings.title_wallets} rightNode={addSortButtons} />
          </EdgeAnim>
        )}

        {searching ? null : (
          <EdgeAnim enter={{ type: 'fadeInUp', distance: 20 }} exit={{ type: 'fadeOutUp' }}>
            <PromoCard navigation={navigation} />
          </EdgeAnim>
        )}
      </>
    )
  }
}

const getStyles = cacheStyles((theme: Theme) => ({
  buttonsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center'
  },
  addButton: {
    marginRight: theme.rem(0.5)
  }
}))

export const WalletListHeader = withTheme(WalletListHeaderComponent)
