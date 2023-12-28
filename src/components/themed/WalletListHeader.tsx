import * as React from 'react'
import { TouchableOpacity, View } from 'react-native'
import Ionicon from 'react-native-vector-icons/Ionicons'

import { Fontello } from '../../assets/vector/index'
import { lstrings } from '../../locales/strings'
import { NavigationBase } from '../../types/routerTypes'
import { PromoCard } from '../cards/PromoCard'
import { SearchIconAnimated } from '../icons/ThemedIcons'
import { cacheStyles, Theme, ThemeProps, withTheme } from '../services/ThemeContext'
import { EdgeText } from '../themed/EdgeText'
import { BalanceCardUi4 } from '../ui4/BalanceCardUi4'
import { SectionHeaderUi4 } from '../ui4/SectionHeaderUi4'
import { SimpleTextInput, SimpleTextInputRef } from './SimpleTextInput'

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
  textInput = React.createRef<SimpleTextInputRef>()

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
        <View style={styles.searchContainer}>
          <View style={{ flex: 1, flexDirection: 'column' }}>
            <SimpleTextInput
              returnKeyType="search"
              placeholder={lstrings.wallet_list_wallet_search}
              onChangeText={this.handleOnChangeText}
              value={searchText}
              onFocus={this.handleTextFieldFocus}
              ref={this.textInput}
              iconComponent={SearchIconAnimated}
            />
          </View>
          {searching && (
            <TouchableOpacity onPress={this.handleSearchDone} style={styles.searchDoneButton}>
              <EdgeText style={{ color: theme.textLink }}>{lstrings.string_done_cap}</EdgeText>
            </TouchableOpacity>
          )}
        </View>
        {searching ? null : <BalanceCardUi4 navigation={navigation} />}
        {sorting || searching ? null : <SectionHeaderUi4 leftTitle={lstrings.title_wallets} rightNode={addSortButtons} />}

        {searching ? null : <PromoCard navigation={navigation} />}
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
  },

  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: theme.rem(0.5),
    marginHorizontal: theme.rem(0.5)
  },
  searchDoneButton: {
    justifyContent: 'center',
    paddingLeft: theme.rem(0.75)
  }
}))

export const WalletListHeader = withTheme(WalletListHeaderComponent)
