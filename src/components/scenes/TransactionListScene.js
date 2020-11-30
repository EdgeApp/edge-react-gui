// @flow

import type { EdgeDenomination, EdgeTransaction } from 'edge-core-js'
import * as React from 'react'
import { ActivityIndicator, Alert, FlatList, View } from 'react-native'
import { Actions } from 'react-native-router-flux'

import TransactionRow from '../../connectors/TransactionRowConnector.js'
import s from '../../locales/strings.js'
import type { ContactsState } from '../../reducers/ContactsReducer'
import { THEME } from '../../theme/variables/airbitz.js'
import type { GuiWallet, TransactionListTx } from '../../types/types.js'
import { scale } from '../../util/scaling.js'
import BuyCrypto from '../common/BuyCrypto.js'
import { SceneWrapper } from '../common/SceneWrapper.js'
import { type Theme, type ThemeProps, cacheStyles, withTheme } from '../services/ThemeContext.js'
import { TransactionListTop } from '../themed/TransactionListTop.js'

const INITIAL_TRANSACTION_BATCH_NUMBER = 10
const SCROLL_THRESHOLD = 0.5

export type StateProps = {
  loading: boolean,
  displayDenomination: EdgeDenomination,
  transactions: TransactionListTx[],
  selectedWalletId: string,
  selectedCurrencyCode: string,
  isoFiatCurrencyCode: string,
  fiatCurrencyCode: string,
  uiWallet: GuiWallet,
  contacts: ContactsState,
  fiatSymbol: string,
  requiredConfirmations?: number,
  numTransactions: number
}

export type DispatchProps = {
  fetchMoreTransactions: (walletId: string, currencyCode: string, reset: boolean) => any,
  toggleBalanceVisibility: () => void
}

type Props = StateProps & DispatchProps & ThemeProps

type State = {
  reset: boolean
}

const emptyArray = []

class TransactionListComponent extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {
      reset: true
    }
  }

  componentDidMount = () => {
    this.props.fetchMoreTransactions(this.props.selectedWalletId, this.props.selectedCurrencyCode, this.state.reset)
    if (this.state.reset) {
      this.setState({ reset: false })
    }
  }

  UNSAFE_componentWillReceiveProps(nextProps: Props) {
    if (nextProps.selectedWalletId !== this.props.selectedWalletId || nextProps.selectedCurrencyCode !== this.props.selectedCurrencyCode) {
      this.props.fetchMoreTransactions(nextProps.selectedWalletId, nextProps.selectedCurrencyCode, this.state.reset)
      if (this.state.reset) {
        this.setState({ reset: false })
      }
    }
  }

  handleScrollEnd = () => {
    this.props.fetchMoreTransactions(this.props.selectedWalletId, this.props.selectedCurrencyCode, this.state.reset)
    if (this.state.reset) {
      this.setState({ reset: false })
    }
  }

  renderBuyCrypto = () => {
    const wallet = this.props.uiWallet
    const { selectedCurrencyCode, theme } = this.props
    const styles = getStyles(theme)
    if (this.props.numTransactions) {
      return (
        <View style={styles.emptyListLoader}>
          <ActivityIndicator color={THEME.COLORS.GRAY_2} size="large" />
        </View>
      )
    }

    switch (selectedCurrencyCode) {
      case 'BTC':
        return <BuyCrypto wallet={wallet} />
      case 'BCH':
        return <BuyCrypto wallet={wallet} />
      case 'ETH':
        return <BuyCrypto wallet={wallet} />
      case 'LTC':
        return <BuyCrypto wallet={wallet} />
      case 'XRP':
        return <BuyCrypto wallet={wallet} />
      case 'BSV':
        return <BuyCrypto wallet={wallet} />
      default:
        return null
    }
  }

  render() {
    const txs = this.state.reset ? emptyArray : this.props.transactions
    const styles = getStyles(this.props.theme)
    return (
      <SceneWrapper bodySplit={200}>
        <FlatList
          ListEmptyComponent={this.renderBuyCrypto()}
          ListHeaderComponent={this.renderHeader()}
          style={styles.transactionsScrollWrap}
          data={txs}
          renderItem={this.renderTx}
          initialNumToRender={INITIAL_TRANSACTION_BATCH_NUMBER}
          onEndReached={this.handleScrollEnd}
          onEndReachedThreshold={SCROLL_THRESHOLD}
          keyExtractor={item => item.key.toString()}
        />
      </SceneWrapper>
    )
  }

  renderHeader = () => {
    return this.props.loading ? <ActivityIndicator style={{ flex: 1, alignSelf: 'center' }} size="large" /> : <TransactionListTop />
  }

  goToTxDetail = (edgeTransaction: EdgeTransaction, thumbnailPath: string) => {
    if (edgeTransaction) {
      Actions.transactionDetails({ edgeTransaction, thumbnailPath })
    } else {
      Alert.alert(s.strings.transaction_details_error_invalid)
    }
  }

  renderTx = (transaction: TransactionListTx) => {
    return (
      <TransactionRow
        transaction={transaction}
        transactions={this.props.transactions}
        selectedCurrencyCode={this.props.selectedCurrencyCode}
        contacts={this.props.contacts}
        uiWallet={this.props.uiWallet}
        displayDenomination={this.props.displayDenomination}
        isoFiatCurrencyCode={this.props.isoFiatCurrencyCode}
        fiatCurrencyCode={this.props.fiatCurrencyCode}
        onClick={this.goToTxDetail}
        fiatSymbol={this.props.fiatSymbol}
        requiredConfirmations={this.props.requiredConfirmations}
      />
    )
  }
}

const getStyles = cacheStyles((theme: Theme) => ({
  transactionsScrollWrap: {
    flex: 1
  },
  emptyListLoader: {
    backgroundColor: THEME.COLORS.GRAY_4,
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    height: scale(230)
  }
}))

export const TransactionList = withTheme(TransactionListComponent)
