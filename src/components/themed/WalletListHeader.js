// @flow

import * as React from 'react'
import { TouchableOpacity, View } from 'react-native'
import Ionicon from 'react-native-vector-icons/Ionicons'

import { Fontello } from '../../assets/vector/index.js'
import s from '../../locales/strings.js'
import { type NavigationProp, withNavigation } from '../../types/routerTypes.js'
import { PromoCard } from '../cards/PromoCard.js'
import { type Theme, type ThemeProps, cacheStyles, withTheme } from '../services/ThemeContext.js'
import { EdgeText } from '../themed/EdgeText.js'
import { WiredBalanceBox } from '../themed/WiredBalanceBox.js'
import { type OutlinedTextInputRef, OutlinedTextInput } from './OutlinedTextInput.js'

type OwnProps = {
  sorting: boolean,
  searching: boolean,
  searchText: string,
  openSortModal: () => void,
  onChangeSearchText: (search: string) => void,
  onChangeSearchingState: (searching: boolean) => void,
  navigation: NavigationProp<'walletListHeaderComponent'>
}

type Props = OwnProps & ThemeProps

export class WalletListHeaderComponent extends React.PureComponent<Props> {
  textInput: { current: OutlinedTextInputRef | null } = React.createRef()

  componentDidUpdate(prevProps: Props) {
    if (prevProps.searching === false && this.props.searching === true && this.textInput.current) {
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
    const { sorting, searching, searchText, theme, navigation } = this.props
    const styles = getStyles(theme)

    return (
      <>
        <View style={styles.searchContainer}>
          <View style={{ flex: 1, flexDirection: 'column' }}>
            <OutlinedTextInput
              returnKeyType="search"
              label={s.strings.wallet_list_wallet_search}
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
              <EdgeText style={{ color: theme.textLink }}>{s.strings.string_done_cap}</EdgeText>
            </TouchableOpacity>
          )}
        </View>
        {!searching && <WiredBalanceBox />}
        {!sorting && !searching && (
          <View style={styles.headerContainer}>
            <EdgeText style={styles.headerText}>{s.strings.title_wallets}</EdgeText>
            <View key="defaultButtons" style={styles.headerButtonsContainer}>
              <TouchableOpacity style={styles.addButton} onPress={() => navigation.push('createWalletSelectCrypto')}>
                <Ionicon name="md-add" size={theme.rem(1.5)} color={theme.iconTappable} />
              </TouchableOpacity>
              <TouchableOpacity onPress={this.props.openSortModal}>
                <Fontello name="sort" size={theme.rem(1.5)} color={theme.iconTappable} />
              </TouchableOpacity>
            </View>
          </View>
        )}
        {!searching && <PromoCard />}
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

export const WalletListHeader = withTheme(withNavigation(WalletListHeaderComponent))
