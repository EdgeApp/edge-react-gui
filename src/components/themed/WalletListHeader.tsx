import * as React from 'react'
import { TouchableOpacity, View } from 'react-native'
import Ionicon from 'react-native-vector-icons/Ionicons'

import { Fontello } from '../../assets/vector/index'
import { lstrings } from '../../locales/strings'
import { NavigationBase } from '../../types/routerTypes'
import { PromoCard } from '../cards/PromoCard'
import { cacheStyles, Theme, ThemeProps, withTheme } from '../services/ThemeContext'
import { EdgeText } from '../themed/EdgeText'
import { WiredBalanceBox } from '../themed/WiredBalanceBox'
import { OutlinedTextInput, OutlinedTextInputRef } from './OutlinedTextInput'

interface OwnProps {
  navigation: NavigationBase
  sorting: boolean
  searching: boolean
  searchText: string
  openSortModal: () => void
  onChangeSearchText: (search: string) => void
  onChangeSearchingState: (searching: boolean) => void
}

type Props = OwnProps & ThemeProps

export class WalletListHeaderComponent extends React.PureComponent<Props> {
  textInput = React.createRef<OutlinedTextInputRef>()

  componentDidUpdate(prevProps: Props) {
    if (!prevProps.searching && this.props.searching && this.textInput.current) {
      this.textInput.current.focus()
    }
  }

  handleOnChangeText = (input: string) => this.props.onChangeSearchText(input)

  handleTextFieldFocus = () => {
    this.props.onChangeSearchingState(true)
  }

  handleSearchDone = () => {
    this.props.onChangeSearchingState(false)
    if (this.textInput.current) {
      this.textInput.current.clear()
    }
  }

  render() {
    const { navigation, sorting, searching, searchText, theme } = this.props
    const styles = getStyles(theme)

    return (
      <>
        <View style={styles.searchContainer}>
          <View style={{ flex: 1, flexDirection: 'column' }}>
            <OutlinedTextInput
              returnKeyType="search"
              label={lstrings.wallet_list_wallet_search}
              onChangeText={this.handleOnChangeText}
              value={searchText}
              onFocus={this.handleTextFieldFocus}
              ref={this.textInput}
              marginRem={[0, 0, 1]}
              searchIcon
            />
          </View>
          {searching && (
            <TouchableOpacity onPress={this.handleSearchDone} style={styles.searchDoneButton}>
              <EdgeText style={{ color: theme.textLink }}>{lstrings.string_done_cap}</EdgeText>
            </TouchableOpacity>
          )}
        </View>
        {!searching && <WiredBalanceBox />}
        {!sorting && !searching && (
          <View style={styles.headerContainer}>
            <EdgeText style={styles.headerText}>{lstrings.title_wallets}</EdgeText>
            <View key="defaultButtons" style={styles.headerButtonsContainer}>
              <TouchableOpacity accessible={false} style={styles.addButton} onPress={() => navigation.push('createWalletSelectCrypto', {})}>
                <Ionicon
                  testID="addButton"
                  accessibilityHint={lstrings.wallet_list_add_wallet}
                  color={theme.iconTappable}
                  name="md-add"
                  size={theme.rem(1.5)}
                />
              </TouchableOpacity>
              <TouchableOpacity accessible={false} onPress={this.props.openSortModal}>
                <Fontello testID="sortButton" accessibilityHint={lstrings.sort_wallets_hint} color={theme.iconTappable} name="sort" size={theme.rem(1.5)} />
              </TouchableOpacity>
            </View>
          </View>
        )}
        {searching ? null : <PromoCard navigation={navigation} />}
      </>
    )
  }
}

const getStyles = cacheStyles((theme: Theme) => ({
  headerContainer: {
    flexDirection: 'row',
    marginTop: theme.rem(0.5),
    marginHorizontal: theme.rem(1)
  },
  headerText: {
    flex: 1
  },
  headerButtonsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center'
  },
  addButton: {
    marginRight: theme.rem(0.5)
  },

  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: theme.rem(0.5),
    marginHorizontal: theme.rem(1)
  },
  searchDoneButton: {
    justifyContent: 'center',
    paddingLeft: theme.rem(0.75),
    paddingBottom: theme.rem(1)
  }
}))

export const WalletListHeader = withTheme(WalletListHeaderComponent)
