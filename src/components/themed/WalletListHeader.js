// @flow

import * as React from 'react'
import { TouchableOpacity, View } from 'react-native'
import { Actions } from 'react-native-router-flux'
import Ionicon from 'react-native-vector-icons/Ionicons'
import { connect } from 'react-redux'

import { toggleAccountBalanceVisibility } from '../../actions/WalletListActions.js'
import { Fontello } from '../../assets/vector/index.js'
import * as Constants from '../../constants/indexConstants.js'
import s from '../../locales/strings.js'
import { getDefaultIsoFiat, getIsAccountBalanceVisible } from '../../modules/Settings/selectors.js'
import { type Dispatch, type RootState } from '../../types/reduxTypes.js'
import { getTotalFiatAmountFromExchangeRates } from '../../util/utils.js'
import { type Theme, type ThemeProps, cacheStyles, withTheme } from '../services/ThemeContext.js'
import { EdgeText } from '../themed/EdgeText.js'
import { PromoCard } from '../themed/PromoCard.js'
import { WiredBalanceBox } from '../themed/WiredBalanceBox.js'
import { EdgeTextFieldOutlined } from './EdgeTextField.js'

type OwnProps = {
  sorting: boolean,
  searching: boolean,
  searchText: string,
  openSortModal: () => void,
  onChangeSearchText: (search: string) => void,
  onChangeSearchingState: (searching: boolean) => void
}

type StateProps = {
  exchangeRates: Object
}

type DispatchProps = {
  toggleAccountBalanceVisibility(): void
}

type Props = OwnProps & StateProps & DispatchProps & ThemeProps

class WalletListHeaderComponent extends React.PureComponent<Props> {
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

  render() {
    const { sorting, searching, searchText, theme } = this.props
    const styles = getStyles(theme)

    return (
      <>
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
        {!searching && (
          <WiredBalanceBox
            showBalance={getIsAccountBalanceVisible}
            fiatAmount={getTotalFiatAmountFromExchangeRates}
            isoFiatCurrencyCode={getDefaultIsoFiat}
            onPress={this.props.toggleAccountBalanceVisibility}
            exchangeRates={this.props.exchangeRates}
          />
        )}
        {!sorting && !searching && (
          <View style={styles.headerContainer}>
            <EdgeText style={styles.headerText}>{s.strings.title_wallets}</EdgeText>
            <View key="defaultButtons" style={styles.headerButtonsContainer}>
              <TouchableOpacity style={styles.addButton} onPress={Actions[Constants.CREATE_WALLET_SELECT_CRYPTO]}>
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
    marginHorizontal: theme.rem(1),
    height: theme.rem(4.5)
  },
  searchDoneButton: {
    height: theme.rem(3.5),
    justifyContent: 'center',
    paddingLeft: theme.rem(0.75),
    paddingRight: 0,
    paddingBottom: theme.rem(0.5)
  }
}))

export const WalletListHeader = connect(
  (state: RootState): StateProps => ({
    exchangeRates: state.exchangeRates
  }),
  (dispatch: Dispatch): DispatchProps => ({
    toggleAccountBalanceVisibility() {
      dispatch(toggleAccountBalanceVisibility())
    }
  })
)(withTheme(WalletListHeaderComponent))
