// @flow

import type { Disklet } from 'disklet'
import * as React from 'react'
import { ActivityIndicator, StyleSheet, TouchableOpacity, View } from 'react-native'
import { Actions } from 'react-native-router-flux'
import SortableListView from 'react-native-sortable-listview'
import Ionicon from 'react-native-vector-icons/Ionicons'
import { connect } from 'react-redux'

import { toggleAccountBalanceVisibility, updateActiveWalletsOrder } from '../../actions/WalletListActions.js'
import { Fontello } from '../../assets/vector/index.js'
import XPubModal from '../../connectors/XPubModalConnector.js'
import * as Constants from '../../constants/indexConstants.js'
import s from '../../locales/strings.js'
import { getDefaultIsoFiat, getIsAccountBalanceVisible } from '../../modules/Settings/selectors.js'
import { getActiveWalletIds, getWalletLoadingPercent } from '../../modules/UI/selectors.js'
import { type Dispatch, type RootState } from '../../types/reduxTypes.js'
import { type GuiWallet } from '../../types/types.js'
import { getWalletListSlideTutorial, setUserTutorialList } from '../../util/tutorial.js'
import { getTotalFiatAmountFromExchangeRates } from '../../util/utils.js'
import { CrossFade } from '../common/CrossFade.js'
import { SceneWrapper } from '../common/SceneWrapper.js'
import { WalletListSlidingTutorialModal } from '../modals/WalletListSlidingTutorialModal.js'
import { Airship } from '../services/AirshipInstance.js'
import { type Theme, type ThemeProps, cacheStyles, withTheme } from '../services/ThemeContext.js'
import { EdgeText } from '../themed/EdgeText.js'
import { PromoCard } from '../themed/PromoCard.js'
import { SettingsHeaderRow } from '../themed/SettingsHeaderRow.js'
import { WalletList } from '../themed/WalletList.js'
import { WalletListFooter } from '../themed/WalletListFooter.js'
import { WalletListSortableRow } from '../themed/WalletListSortableRow.js'
import { WiredBalanceBox } from '../themed/WiredBalanceBox.js'
import { WiredProgressBar } from '../themed/WiredProgressBar.js'

type StateProps = {
  activeWalletIds: string[],
  exchangeRates: Object,
  userId: string,
  wallets: { [walletId: string]: GuiWallet },
  disklet: Disklet,
  passwordReminderModal: boolean
}

type DispatchProps = {
  toggleAccountBalanceVisibility(): void,
  updateActiveWalletsOrder(walletIds: string[]): void
}

type Props = StateProps & DispatchProps & ThemeProps

type State = {
  sorting: boolean,
  showSlidingTutorial: boolean
}

class WalletListComponent extends React.PureComponent<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {
      sorting: false,
      showSlidingTutorial: false
    }
  }

  showTutorial = async () => {
    const { disklet, passwordReminderModal, userId } = this.props
    try {
      const userTutorialList = await getWalletListSlideTutorial(userId, disklet)
      const tutorialCount = parseInt(userTutorialList[userId].walletListSlideTutorialCount || '0')

      if (tutorialCount < 2 && !passwordReminderModal) {
        Airship.show(bridge => <WalletListSlidingTutorialModal bridge={bridge} />)
        this.setState({ showSlidingTutorial: true })
        userTutorialList[userId].walletListSlideTutorialCount = (tutorialCount + 1).toString()
        await setUserTutorialList(userTutorialList, disklet)
      }
    } catch (error) {
      console.log(error)
    }
  }

  componentDidMount() {
    this.showTutorial()
  }

  handleSort = () => this.setState({ sorting: true })

  render() {
    const { activeWalletIds, theme, wallets } = this.props
    const { showSlidingTutorial, sorting } = this.state
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
            <ActivityIndicator key="spinner" color={theme.primaryText} style={styles.listSpinner} size="large" />
            <WalletList key="fullList" header={PromoCard} footer={WalletListFooter} showSlidingTutorial={showSlidingTutorial} />
            <SortableListView
              key="sortList"
              style={StyleSheet.absoltueFill}
              data={wallets}
              order={activeWalletIds}
              onRowMoved={this.onActiveRowMoved}
              renderRow={this.renderSortableRow}
            />
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
      userId: state.core.account.id,
      wallets: state.ui.wallets.byId,
      disklet: state.core.disklet,
      passwordReminderModal: state.ui.passwordReminder.needsPasswordCheck
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
