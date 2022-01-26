// @flow

import type { Disklet } from 'disklet'
import { type EdgeCurrencyWallet } from 'edge-core-js'
import * as React from 'react'
import { ActivityIndicator, StyleSheet, TouchableOpacity, View } from 'react-native'
import SortableListView from 'react-native-sortable-listview'

import { updateActiveWalletsOrder } from '../../actions/WalletListActions.js'
import s from '../../locales/strings.js'
import { connect } from '../../types/reactRedux.js'
import { getWalletListSlideTutorial, setUserTutorialList } from '../../util/tutorial.js'
import { CrossFade } from '../common/CrossFade.js'
import { SceneWrapper } from '../common/SceneWrapper.js'
import { WalletListSlidingTutorialModal } from '../modals/WalletListSlidingTutorialModal.js'
import { WalletListSortModal } from '../modals/WalletListSortModal.js'
import { Airship } from '../services/AirshipInstance.js'
import { type Theme, type ThemeProps, cacheStyles, withTheme } from '../services/ThemeContext.js'
import { EdgeText } from '../themed/EdgeText.js'
import { PasswordReminderModal } from '../themed/PasswordReminderModal.js'
import { WalletList } from '../themed/WalletList.js'
import { WalletListFooter } from '../themed/WalletListFooter.js'
import { WalletListHeader } from '../themed/WalletListHeader.js'
import { WalletListSortableRow } from '../themed/WalletListSortableRow.js'
import { WiredProgressBar } from '../themed/WiredProgressBar.js'

type StateProps = {
  activeWalletIds: string[],
  wallets: { [walletId: string]: EdgeCurrencyWallet },
  disklet: Disklet,
  needsPasswordCheck: boolean
}

type DispatchProps = {
  updateActiveWalletsOrder: (walletIds: string[]) => void
}

type Props = StateProps & DispatchProps & ThemeProps

type State = {
  sorting: boolean,
  searching: boolean,
  searchText: string,
  showSlidingTutorial: boolean
}

class WalletListComponent extends React.PureComponent<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {
      sorting: false,
      searching: false,
      searchText: '',
      showSlidingTutorial: false
    }
  }

  showTutorial = async () => {
    const { disklet } = this.props
    try {
      const userTutorialList = await getWalletListSlideTutorial(disklet)
      const tutorialCount = userTutorialList.walletListSlideTutorialCount || 0

      if (tutorialCount < 2) {
        Airship.show(bridge => <WalletListSlidingTutorialModal bridge={bridge} />)
        this.setState({ showSlidingTutorial: true })
        userTutorialList.walletListSlideTutorialCount = tutorialCount + 1
        await setUserTutorialList(userTutorialList, disklet)
      }
    } catch (error) {
      console.log(error)
    }
  }

  componentDidMount() {
    this.props.needsPasswordCheck ? Airship.show(bridge => <PasswordReminderModal bridge={bridge} />) : this.showTutorial()
  }

  handleChangeSearchingState = (searching: boolean) => this.setState({ searching })

  handleChangeSearchText = (searchText: string) => this.setState({ searchText })

  handleActivateSearch = () => this.setState({ searching: true })

  handleSort = () => {
    Airship.show(bridge => <WalletListSortModal bridge={bridge} />)
      .then(sort => {
        if (sort === 'manual') {
          this.setState({ sorting: true })
        }
      })
      .catch(error => console.log(error))
  }

  render() {
    const { activeWalletIds, theme, wallets } = this.props
    const { showSlidingTutorial, searching, searchText, sorting } = this.state
    const styles = getStyles(theme)
    const loading = Object.keys(wallets).length <= 0

    return (
      <SceneWrapper>
        <WiredProgressBar />
        {sorting && (
          <View style={styles.headerContainer}>
            <EdgeText style={styles.headerText}>{s.strings.title_wallets}</EdgeText>
            <TouchableOpacity key="doneButton" style={styles.headerButtonsContainer} onPress={this.disableSorting}>
              <EdgeText style={styles.doneButton}>{s.strings.string_done_cap}</EdgeText>
            </TouchableOpacity>
          </View>
        )}
        <View style={styles.listStack}>
          <CrossFade activeKey={loading ? 'spinner' : sorting ? 'sortList' : 'fullList'}>
            <ActivityIndicator key="spinner" color={theme.primaryText} style={styles.listSpinner} size="large" />
            <WalletList
              key="fullList"
              header={
                <WalletListHeader
                  sorting={this.state.sorting}
                  searching={this.state.searching}
                  searchText={this.state.searchText}
                  openSortModal={this.handleSort}
                  onChangeSearchText={this.handleChangeSearchText}
                  onChangeSearchingState={this.handleChangeSearchingState}
                />
              }
              footer={this.state.searching ? null : <WalletListFooter />}
              searching={searching}
              searchText={searchText}
              activateSearch={this.handleActivateSearch}
              showSlidingTutorial={showSlidingTutorial}
            />
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
      </SceneWrapper>
    )
  }

  renderSortableRow = (wallet: EdgeCurrencyWallet | void) => {
    return <WalletListSortableRow wallet={wallet} />
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
  // Header Stack style
  headerContainer: {
    flexDirection: 'row',
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
  doneButton: {
    color: theme.textLink
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

export const WalletListScene = connect<StateProps, DispatchProps, {}>(
  state => {
    let { activeWalletIds } = state.ui.wallets
    const { currencyWallets } = state.core.account

    // FIO disable changes below
    if (global.isFioDisabled) {
      const { currencyWallets } = state.core.account
      activeWalletIds = activeWalletIds.filter(id => {
        const wallet = currencyWallets[id]
        return wallet == null || wallet.type !== 'wallet:fio'
      })
    }

    return {
      activeWalletIds,
      wallets: currencyWallets,
      disklet: state.core.disklet,
      needsPasswordCheck: state.ui.passwordReminder.needsPasswordCheck
    }
  },
  dispatch => ({
    updateActiveWalletsOrder(activeWalletIds) {
      dispatch(updateActiveWalletsOrder(activeWalletIds))
    }
  })
)(withTheme(WalletListComponent))
