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

type OwnProps = {
  sorting: boolean,
  toggleSorting: (sorting: boolean) => void
}

type StateProps = {
  exchangeRates: Object
}

type DispatchProps = {
  toggleAccountBalanceVisibility(): void
}

type Props = OwnProps & StateProps & DispatchProps & ThemeProps

type State = {
  sorting: boolean,
  showSlidingTutorial: boolean
}

class WalletListHeaderComponent extends React.PureComponent<Props, State> {
  activateSorting = () => this.props.toggleSorting(true)

  render() {
    const { sorting, theme } = this.props
    const styles = getStyles(theme)

    return (
      <>
        <WiredBalanceBox
          showBalance={getIsAccountBalanceVisible}
          fiatAmount={getTotalFiatAmountFromExchangeRates}
          isoFiatCurrencyCode={getDefaultIsoFiat}
          onPress={this.props.toggleAccountBalanceVisibility}
          exchangeRates={this.props.exchangeRates}
        />
        {!sorting && (
          <View style={styles.headerContainer}>
            <EdgeText style={styles.headerText}>{s.strings.title_wallets}</EdgeText>
            <View key="defaultButtons" style={styles.headerButtonsContainer}>
              <TouchableOpacity style={styles.addButton} onPress={Actions[Constants.CREATE_WALLET_SELECT_CRYPTO]}>
                <Ionicon name="md-add" size={theme.rem(1.5)} color={theme.iconTappable} />
              </TouchableOpacity>
              <TouchableOpacity onPress={this.activateSorting}>
                <Fontello name="sort" size={theme.rem(1.5)} color={theme.iconTappable} />
              </TouchableOpacity>
            </View>
          </View>
        )}
        <PromoCard />
      </>
    )
  }
}

const getStyles = cacheStyles((theme: Theme) => ({
  headerContainer: {
    flexDirection: 'row',
    marginHorizontal: theme.rem(2)
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
