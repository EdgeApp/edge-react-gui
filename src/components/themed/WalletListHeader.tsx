import * as React from 'react'
import { View } from 'react-native'
import Ionicon from 'react-native-vector-icons/Ionicons'

import { startWalletShare } from '../../actions/WalletShareActions'
import { Fontello } from '../../assets/vector/index'
import { useHandler } from '../../hooks/useHandler'
import { lstrings } from '../../locales/strings'
import { useSelector } from '../../types/reactRedux'
import type { NavigationBase } from '../../types/routerTypes'
import { BalanceCard } from '../cards/BalanceCard'
import { EdgeAnim, fadeInUp40, fadeInUp60 } from '../common/EdgeAnim'
import { EdgeTouchableOpacity } from '../common/EdgeTouchableOpacity'
import { SectionHeader } from '../common/SectionHeader'
import { ShareIcon } from '../icons/ThemedIcons'
import { showError } from '../services/AirshipInstance'
import {
  cacheStyles,
  type Theme,
  type ThemeProps,
  useTheme,
  withTheme
} from '../services/ThemeContext'

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
        <ShareButton />
        <EdgeTouchableOpacity
          accessible={false}
          style={styles.addButton}
          onPress={() => {
            navigation.push('createWalletSelectCrypto', {})
          }}
        >
          <Ionicon
            testID="addButton"
            accessibilityHint={lstrings.wallet_list_add_wallet}
            color={theme.iconTappable}
            name="add"
            size={theme.rem(1.5)}
          />
        </EdgeTouchableOpacity>
        <EdgeTouchableOpacity
          accessible={false}
          onPress={this.props.openSortModal}
        >
          <Fontello
            testID="sortButton"
            accessibilityHint={lstrings.sort_wallets_hint}
            color={theme.iconTappable}
            name="sort"
            size={theme.rem(1.5)}
          />
        </EdgeTouchableOpacity>
      </View>
    )

    return (
      <>
        {searching ? null : (
          <EdgeAnim enter={fadeInUp60}>
            <BalanceCard navigation={navigation} />
          </EdgeAnim>
        )}
        {sorting || searching ? null : (
          <EdgeAnim enter={fadeInUp40}>
            <SectionHeader
              leftTitle={lstrings.title_wallets}
              rightNode={addSortButtons}
            />
          </EdgeAnim>
        )}
      </>
    )
  }
}

/**
 * Opens the wallet-sharing chooser. Its own component so the class above
 * stays hook-free.
 */
const ShareButton: React.FC = (): React.ReactElement => {
  const theme = useTheme()
  const styles = getStyles(theme)
  const account = useSelector(state => state.core.account)

  const handlePress = useHandler(() => {
    startWalletShare(account).catch((error: unknown) => {
      showError(error)
    })
  })

  return (
    <EdgeTouchableOpacity
      accessibilityHint={lstrings.wallet_share_button_hint}
      style={styles.shareButton}
      testID="shareButton"
      onPress={handlePress}
    >
      <ShareIcon color={theme.iconTappable} size={theme.rem(1.5)} />
    </EdgeTouchableOpacity>
  )
}

const getStyles = cacheStyles((theme: Theme) => ({
  buttonsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center'
  },
  addButton: {
    marginRight: theme.rem(0.5)
  },
  shareButton: {
    marginRight: theme.rem(0.5)
  }
}))

export const WalletListHeader = withTheme(WalletListHeaderComponent)
