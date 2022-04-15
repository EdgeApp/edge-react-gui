// @flow

import * as React from 'react'
import { TouchableOpacity, View } from 'react-native'

import s from '../../locales/strings.js'
import { type Theme, type ThemeProps, cacheStyles, withTheme } from '../services/ThemeContext.js'
import { EdgeText } from '../themed/EdgeText.js'
import { type OutlinedTextInputRef, OutlinedTextInput } from './OutlinedTextInput.js'

type OwnProps = {
  searching: boolean,
  searchText: string,
  onChangeSearchText: (search: string) => void,
  onChangeSearchingState: (searching: boolean) => void
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
    const { searchText, theme } = this.props
    const styles = getStyles(theme)

    return (
      <View style={styles.searchContainer}>
        <View style={styles.searchTextInput}>
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
        <TouchableOpacity onPress={this.handleSearchDone} style={styles.searchDoneButton}>
          <EdgeText style={styles.searchDoneButtonText}>{s.strings.string_done_cap}</EdgeText>
        </TouchableOpacity>
      </View>
    )
  }
}

const getStyles = cacheStyles((theme: Theme) => ({
  headerContainer: {
    flexDirection: 'row',
    marginTop: theme.rem(0.5),
    marginRight: theme.rem(1)
  },
  headerText: {
    flex: 1
  },
  headerButtonsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center'
  },

  searchTextInput: {
    flex: 1
  },
  searchContainer: {
    flexDirection: 'row',
    marginTop: theme.rem(0.5),
    marginRight: theme.rem(1)
  },
  searchDoneButton: {
    justifyContent: 'center',
    paddingLeft: theme.rem(0.75),
    paddingBottom: theme.rem(1)
  },
  searchDoneButtonText: {
    color: theme.textLink
  }
}))

export const WalletListHeader = withTheme(WalletListHeaderComponent)
