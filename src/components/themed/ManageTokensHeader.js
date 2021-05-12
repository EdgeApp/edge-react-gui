// @flow

import * as React from 'react'
import { TouchableOpacity, View } from 'react-native'
import { connect } from 'react-redux'

import { toggleAccountBalanceVisibility } from '../../actions/WalletListActions.js'
import s from '../../locales/strings.js'
import { type Dispatch } from '../../types/reduxTypes.js'
import { type Theme, type ThemeProps, cacheStyles, withTheme } from '../services/ThemeContext.js'
import { EdgeText } from '../themed/EdgeText.js'
import { WalletProgressIcon } from '../themed/WalletProgressIcon.js'
import { EdgeTextFieldOutlined } from './EdgeTextField.js'
import { Title } from './Title'

type OwnProps = {
  sorting: boolean,
  searching: boolean,
  searchText: string,
  walletId: string,
  walletName: string,
  currencyCode: string,
  openSortModal: () => void,
  onChangeSearchText: (search: string) => void,
  onChangeSearchingState: (searching: boolean) => void
}

type DispatchProps = {
  toggleAccountBalanceVisibility(): void
}

type Props = OwnProps & DispatchProps & ThemeProps

class ManageTokensComponent extends React.PureComponent<Props> {
  textInput = React.createRef()

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
    this.clearText()
    this.props.onChangeSearchingState(false)
    if (this.textInput.current) {
      this.textInput.current.clear()
    }
  }

  clearText = () => {
    this.props.onChangeSearchText('')
    if (this.textInput.current) {
      this.textInput.current.blur()
    }
  }

  renderIcon() {
    const { currencyCode, walletId, theme } = this.props
    return <WalletProgressIcon currencyCode={currencyCode} walletId={walletId} size={theme.rem(1.5)} />
  }

  render() {
    const { searching, searchText, theme, walletName } = this.props
    const styles = getStyles(theme)

    return (
      <>
        <View>
          <Title icon={this.renderIcon()} text={walletName} />
          <EdgeText style={styles.subTitle}>{s.strings.managetokens_top_instructions}</EdgeText>
        </View>
        <View style={styles.searchContainer}>
          <View style={{ flex: 1, flexDirection: 'column' }}>
            <EdgeTextFieldOutlined
              returnKeyType="search"
              label={s.strings.wallet_list_wallet_search}
              onChangeText={this.handleOnChangeText}
              value={searchText}
              onFocus={this.handleTextFieldFocus}
              ref={this.textInput}
              isClearable={searching}
              onClear={this.clearText}
              marginRem={0}
            />
          </View>
          {searching && (
            <TouchableOpacity onPress={this.handleSearchDone} style={styles.searchDoneButton}>
              <EdgeText style={{ color: theme.textLink }}>{s.strings.string_done_cap}</EdgeText>
            </TouchableOpacity>
          )}
        </View>
      </>
    )
  }
}

const getStyles = cacheStyles((theme: Theme) => ({
  header: {
    paddingBottom: theme.rem(0.25)
  },
  subTitle: {
    color: theme.secondaryText,
    fontSize: theme.rem(0.85)
  },
  searchContainer: {
    flexDirection: 'row',
    marginTop: theme.rem(0.5),
    marginHorizontal: theme.rem(1)
  },
  searchDoneButton: {
    justifyContent: 'center',
    height: theme.rem(4.5),
    paddingLeft: theme.rem(0.75),
    paddingBottom: theme.rem(0.25)
  }
}))

export const ManageTokensHeader = connect(null, (dispatch: Dispatch): DispatchProps => ({
  toggleAccountBalanceVisibility() {
    dispatch(toggleAccountBalanceVisibility())
  }
}))(withTheme(ManageTokensComponent))
