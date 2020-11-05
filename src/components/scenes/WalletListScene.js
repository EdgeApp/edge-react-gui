// @flow

import * as React from 'react'
import { ActivityIndicator, TouchableOpacity, View } from 'react-native'
import { Actions } from 'react-native-router-flux'
// import SortableListView from 'react-native-sortable-listview'
import Ionicon from 'react-native-vector-icons/Ionicons'
import { connect } from 'react-redux'

import { toggleAccountBalanceVisibility, updateActiveWalletsOrder } from '../../actions/WalletListActions.js'
import { Fontello } from '../../assets/vector/index.js'
import XPubModal from '../../connectors/XPubModalConnector.js'
import * as Constants from '../../constants/indexConstants.js'
import s from '../../locales/strings.js'
import { getDefaultIsoFiat, getIsAccountBalanceVisible } from '../../modules/Settings/selectors.js'
import { WiredProgressBar } from '../../modules/UI/components/WiredProgressBar/WiredProgressBar.ui.js'
import { getActiveWalletIds, getWalletLoadingPercent } from '../../modules/UI/selectors.js'
import { type Dispatch, type RootState } from '../../types/reduxTypes.js'
import { type GuiWallet } from '../../types/types.js'
import { getTotalFiatAmountFromExchangeRates } from '../../util/utils.js'
import { CrossFade } from '../common/CrossFade.js'
import { SceneWrapper } from '../common/SceneWrapper.js'
import { WalletList } from '../common/WalletList.js'
import { WalletListFooter } from '../common/WalletListFooter.js'
import { WalletListSortableRow } from '../common/WalletListSortableRow.js'
import { WiredBalanceBox } from '../common/WiredBalanceBox.js'
import { type Theme, type ThemeProps, cacheStyles, withTheme } from '../services/ThemeContext.js'
import { EdgeText } from '../themed/EdgeText.js'
import { PromoCard } from '../themed/PromoCard.js'
import { SettingsHeaderRow } from '../themed/SettingsHeaderRow.js'

type StateProps = {
  activeWalletIds: string[],
  exchangeRates: Object,
  wallets: { [walletId: string]: GuiWallet }
}

type DispatchProps = {
  toggleAccountBalanceVisibility(): void,
  updateActiveWalletsOrder(walletIds: string[]): void
}

type Props = StateProps & DispatchProps & ThemeProps

type State = {
  sorting: boolean
}

class WalletListComponent extends React.PureComponent<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {
      sorting: false
    }
  }

  handleSort = () => this.setState({ sorting: true })

  render() {
    const { wallets, theme } = this.props
    const { sorting } = this.state
    const styles = getStyles(theme)
    const loading = Object.keys(wallets).length <= 0

    return (
      <SceneWrapper>
        <WiredProgressBar progress={getWalletLoadingPercent} />
        <WiredBalanceBox
          showBalance={getIsAccountBalanceVisible}
          fiatAmount={getTotalFiatAmountFromExchangeRates}
          isoFiatCurrencyCode={getDefaultIsoFiat}
          onPress={this.props.toggleAccountBalanceVisibility}
          exchangeRates={this.props.exchangeRates}
        />
        <View /* header stack */>
          <SettingsHeaderRow icon={<Fontello name="wallet-1" size={theme.rem(1.25)} color={theme.icon} />} text={s.strings.fragment_wallets_header} />
          <CrossFade activeKey={sorting ? 'doneButton' : 'defaultButtons'}>
            <View key="defaultButtons" style={styles.headerButtonsContainer}>
              <TouchableOpacity style={styles.addButton} onPress={Actions[Constants.CREATE_WALLET_SELECT_CRYPTO]}>
                <Ionicon name="md-add" size={theme.rem(1.25)} color={theme.iconTappable} />
              </TouchableOpacity>
              <TouchableOpacity onPress={this.handleSort}>
                <Fontello name="sort" size={theme.rem(1.25)} color={theme.iconTappable} />
              </TouchableOpacity>
            </View>
            <TouchableOpacity key="doneButton" style={styles.headerButtonsContainer} onPress={this.disableSorting}>
              <EdgeText>{s.strings.string_done_cap}</EdgeText>
            </TouchableOpacity>
          </CrossFade>
        </View>
        <View style={styles.listStack}>
          <CrossFade activeKey={loading ? 'spinner' : sorting ? 'sortList' : 'fullList'}>
            <ActivityIndicator key="spinner" style={styles.listSpinner} size="large" />
            <WalletList key="fullList" header={PromoCard} footer={WalletListFooter} />
            {/* <SortableListView
              key="sortList"
              style={StyleSheet.absoltueFill}
              data={wallets}
              order={activeWalletIds}
              onRowMoved={this.onActiveRowMoved}
              renderRow={this.renderSortableRow}
            /> */}
          </CrossFade>
        </View>
        <XPubModal />
      </SceneWrapper>
    )
  }

  renderSortableRow = (guiWallet: GuiWallet | void) => {
    return <WalletListSortableRow guiWallet={guiWallet} showBalance={getIsAccountBalanceVisible} />
  }

  disableSorting = () => this.setState({ sorting: false })

  onActiveRowMoved = (action: { from: number, to: number }) => {
    const newOrder = [...this.props.activeWalletIds]
    newOrder.splice(action.to, 0, newOrder.splice(action.from, 1)[0])
    this.props.updateActiveWalletsOrder(newOrder)
    this.forceUpdate()
  }
}

const getStyles = cacheStyles((theme: Theme) => ({
  // The sort & add buttons are stacked on top of the header component:
  headerButtonsContainer: {
    flexGrow: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-end',
    paddingHorizontal: theme.rem(1)
  },
  addButton: {
    marginRight: theme.rem(0.75)
  },
  // The two lists are stacked vertically on top of each other:
  listStack: {
    flexGrow: 1
  },
  listSpinner: {
    flexGrow: 1,
    alignSelf: 'center'
  }
}))

export const WalletListScene = connect(
  (state: RootState): StateProps => {
    let activeWalletIds = getActiveWalletIds(state)

    // FIO disable changes below
    if (global.isFioDisabled) {
      const { currencyWallets = {} } = state.core.account
      activeWalletIds = activeWalletIds.filter(id => {
        const wallet = currencyWallets[id]
        return wallet == null || wallet.type !== 'wallet:fio'
      })
    }

    return {
      activeWalletIds,
      exchangeRates: state.exchangeRates,
      wallets: state.ui.wallets.byId
    }
  },
  (dispatch: Dispatch): DispatchProps => ({
    toggleAccountBalanceVisibility() {
      dispatch(toggleAccountBalanceVisibility())
    },
    updateActiveWalletsOrder(activeWalletIds) {
      dispatch(updateActiveWalletsOrder(activeWalletIds))
    }
  })
)(withTheme(WalletListComponent))
