// @flow

import { bns } from 'biggystring'
import type { EdgeDenomination, EdgeTransaction } from 'edge-core-js'
import * as React from 'react'
import { ActivityIndicator, Alert, FlatList, Image, StyleSheet, TouchableHighlight, TouchableOpacity, View } from 'react-native'
import { Actions } from 'react-native-router-flux'
import { sprintf } from 'sprintf-js'

import credLogo from '../../assets/images/cred_logo.png'
import requestImage from '../../assets/images/transactions/transactions-request.png'
import sendImage from '../../assets/images/transactions/transactions-send.png'
import TransactionRow from '../../connectors/TransactionRowConnector.js'
import * as Constants from '../../constants/indexConstants.js'
import { guiPlugins } from '../../constants/plugins/GuiPlugins.js'
import { formatNumber } from '../../locales/intl.js'
import s from '../../locales/strings.js'
import T from '../../modules/UI/components/FormattedText/FormattedText.ui.js'
import { Gradient } from '../../modules/UI/components/Gradient/Gradient.ui.js'
import { getSelectedWalletLoadingPercent } from '../../modules/UI/selectors.js'
import type { ContactsState } from '../../reducers/ContactsReducer'
import { THEME } from '../../theme/variables/airbitz.js'
import type { GuiWallet, TransactionListTx } from '../../types/types.js'
import { scale } from '../../util/scaling.js'
import * as UTILS from '../../util/utils'
import BuyCrypto from '../common/BuyCrypto.js'
import { SceneWrapper } from '../common/SceneWrapper.js'
import { ThemedTicker } from '../themed/ThemedTicker.js'
import { WiredProgressBar } from '../themed/WiredProgressBar.js'

const INITIAL_TRANSACTION_BATCH_NUMBER = 10
const SCROLL_THRESHOLD = 0.5
const BALANCE_BOX_OPACITY = 0.9

export type StateProps = {
  loading: boolean,
  displayDenomination: EdgeDenomination,
  transactions: TransactionListTx[],
  selectedWalletId: string,
  selectedCurrencyCode: string,
  isoFiatCurrencyCode: string,
  fiatCurrencyCode: string,
  uiWallet: GuiWallet,
  settings: Object,
  balanceInCrypto: string,
  balanceInFiat: number,
  multiplier: string,
  contacts: ContactsState,
  fiatSymbol: string,
  requiredConfirmations?: number,
  numTransactions: number,
  isBalanceVisible: boolean
}

export type DispatchProps = {
  fetchMoreTransactions: (walletId: string, currencyCode: string, reset: boolean) => any,
  toggleBalanceVisibility: () => void
}

type Props = StateProps & DispatchProps

type State = {
  reset: boolean
}

const emptyArray = []

export class TransactionList extends React.Component<Props, State> {
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
    const { selectedCurrencyCode } = this.props
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
    return (
      <SceneWrapper background="body" bodySplit={200}>
        <FlatList
          ListEmptyComponent={this.renderBuyCrypto()}
          ListHeaderComponent={this.currentRenderBalanceBox()}
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

  currentRenderBalanceBox = () => {
    const {
      loading,
      uiWallet,
      selectedCurrencyCode,
      displayDenomination,
      balanceInCrypto,
      fiatSymbol,
      balanceInFiat,
      fiatCurrencyCode,
      isoFiatCurrencyCode,
      isBalanceVisible,
      transactions
    } = this.props

    // should we get rid of "loading" area? Currently unused
    if (loading) {
      return <ActivityIndicator color={THEME.COLORS.ACCENT_MINT} style={{ flex: 1, alignSelf: 'center' }} size="large" />
    }

    let logo

    if (uiWallet.currencyCode !== selectedCurrencyCode) {
      for (const metatoken of uiWallet.metaTokens) {
        if (metatoken.currencyCode === selectedCurrencyCode) {
          logo = metatoken.symbolImage
        }
      }
    } else {
      logo = uiWallet.symbolImage
    }

    const cryptoAmount: string = UTILS.convertNativeToDisplay(displayDenomination.multiplier)(balanceInCrypto) // convert to correct denomination
    const cryptoAmountString = cryptoAmount ? formatNumber(UTILS.decimalOrZero(bns.toFixed(cryptoAmount, 0, 6), 6)) : '0' // limit decimals and check if infitesimal, also cut off trailing zeroes (to right of significant figures)

    // beginning of fiat balance
    let fiatBalanceString
    const receivedFiatSymbol = fiatSymbol ? UTILS.getFiatSymbol(isoFiatCurrencyCode) : ''
    const fiatBalanceFormat = `${formatNumber(balanceInFiat && balanceInFiat > 0.000001 ? balanceInFiat : 0, { toFixed: 2 })} ${fiatCurrencyCode}`
    const currencyCode = this.props.selectedCurrencyCode
    const currencyName = uiWallet.currencyNames[currencyCode]

    if (receivedFiatSymbol.length !== 1) {
      fiatBalanceString = fiatBalanceFormat
    } else {
      fiatBalanceString = receivedFiatSymbol + ' ' + fiatBalanceFormat
    }
    return (
      <View>
        <TouchableOpacity onPress={this.props.toggleBalanceVisibility} style={styles.touchableBalanceBox} activeOpacity={BALANCE_BOX_OPACITY}>
          <Gradient style={styles.currentBalanceBox}>
            <View style={styles.balanceBoxContents}>
              {!isBalanceVisible ? (
                <View style={styles.totalBalanceWrap}>
                  <View style={styles.hiddenBalanceBoxDollarsWrap}>
                    <T style={styles.currentBalanceBoxHiddenText}>{s.strings.string_show_balance}</T>
                  </View>
                </View>
              ) : (
                <View style={styles.balanceShownContainer}>
                  <View style={styles.iconWrap}>
                    {logo ? (
                      <Image style={{ height: '100%' }} source={{ uri: logo }} resizeMode="cover" />
                    ) : (
                      <T style={styles.request}>{displayDenomination.symbol}</T>
                    )}
                  </View>
                  <View style={styles.currentBalanceBoxBitsWrap}>
                    <View style={{ flexDirection: 'row' }}>
                      {displayDenomination.symbol ? (
                        <View style={{ flexDirection: 'row' }}>
                          <T numberOfLines={1} style={[styles.currentBalanceBoxBits, styles.symbol]}>
                            {displayDenomination.symbol + ' '}
                          </T>
                          <ThemedTicker style={[styles.currentBalanceBoxBits, styles.symbol]}>{cryptoAmountString}</ThemedTicker>
                        </View>
                      ) : (
                        <ThemedTicker style={styles.currentBalanceBoxBits}>{cryptoAmountString}</ThemedTicker>
                      )}

                      {!displayDenomination.symbol && (
                        <T numberOfLines={1} style={styles.currentBalanceBoxBits}>
                          {' ' + selectedCurrencyCode}
                        </T>
                      )}
                    </View>
                  </View>
                  <View style={styles.currentBalanceBoxDollarsWrap}>
                    <T numberOfLines={1} style={styles.currentBalanceBoxDollars}>
                      {fiatBalanceString}
                    </T>
                  </View>
                </View>
              )}
              <View style={styles.requestSendRow}>
                <TouchableHighlight style={[styles.requestBox, styles.button]} underlayColor={THEME.COLORS.SECONDARY} onPress={Actions.request}>
                  <View style={styles.requestWrap}>
                    <Image style={{ width: 25, height: 25 }} source={requestImage} />
                    <T style={styles.request}>{s.strings.fragment_request_subtitle}</T>
                  </View>
                </TouchableHighlight>
                <TouchableHighlight style={[styles.sendBox, styles.button]} underlayColor={THEME.COLORS.SECONDARY} onPress={Actions.scan}>
                  <View style={styles.sendWrap}>
                    <Image style={{ width: 25, height: 25 }} source={sendImage} />
                    <T style={styles.send}>{s.strings.fragment_send_subtitle}</T>
                  </View>
                </TouchableHighlight>
              </View>
            </View>
          </Gradient>
          <WiredProgressBar progress={getSelectedWalletLoadingPercent} />
        </TouchableOpacity>
        {transactions.length !== 0 && Constants.getSpecialCurrencyInfo(currencyCode).showEarnInterestCard && (
          <TouchableOpacity onPress={() => Actions[Constants.PLUGIN_EARN_INTEREST]({ plugin: guiPlugins.cred })} style={styles.earnInterestContainer}>
            <View style={styles.earnInterestBox}>
              <Image style={styles.earnInterestImage} source={credLogo} resizeMode="contain" />
              <T style={styles.earnInterestText}>{sprintf(s.strings.earn_interest_on, currencyName)}</T>
            </View>
          </TouchableOpacity>
        )}
      </View>
    )
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

const rawStyles = {
  touchableBalanceBox: {
    height: scale(200)
  },
  currentBalanceBox: {
    flex: 1,
    justifyContent: 'center'
  },
  totalBalanceWrap: {
    flex: 3,
    alignItems: 'center',
    backgroundColor: THEME.COLORS.TRANSPARENT
  },
  hiddenBalanceBoxDollarsWrap: {
    flex: 3,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: THEME.COLORS.TRANSPARENT
  },
  currentBalanceBoxHiddenText: {
    color: THEME.COLORS.WHITE,
    fontSize: scale(44)
  },
  balanceBoxContents: {
    flex: 1,
    paddingTop: scale(10),
    paddingBottom: scale(20),
    justifyContent: 'space-between'
  },
  balanceShownContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'column'
  },
  iconWrap: {
    // two
    height: scale(28),
    width: scale(28),
    justifyContent: 'flex-start',
    backgroundColor: THEME.COLORS.TRANSPARENT
  },
  currentBalanceBoxBitsWrap: {
    // two
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: THEME.COLORS.TRANSPARENT
  },
  currentBalanceBoxBits: {
    color: THEME.COLORS.WHITE,
    fontSize: scale(40)
  },
  currentBalanceBoxDollarsWrap: {
    justifyContent: 'flex-start',
    height: scale(26),
    paddingTop: scale(4),
    backgroundColor: THEME.COLORS.TRANSPARENT
  },
  currentBalanceBoxDollars: {
    // two
    color: THEME.COLORS.WHITE,
    fontSize: scale(20)
  },

  requestSendRow: {
    // two
    height: scale(50),
    flexDirection: 'row'
  },
  button: {
    borderRadius: scale(3)
  },
  requestBox: {
    backgroundColor: `${THEME.COLORS.WHITE}${THEME.ALPHA.LOW}`,
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: scale(8),
    marginRight: scale(2),
    flexDirection: 'row',
    borderColor: THEME.COLORS.GRAY_4
    // borderWidth: 0.1,
  },
  requestWrap: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center'
  },
  sendBox: {
    backgroundColor: `${THEME.COLORS.WHITE}${THEME.ALPHA.LOW}`,
    // opacity: THEME.OPACITY.MID,
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: scale(2),
    marginRight: scale(8),
    flexDirection: 'row',
    borderColor: THEME.COLORS.GRAY_4
    // borderWidth: 0.1,
  },
  sendWrap: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center'
  },
  request: {
    fontSize: scale(18),
    color: THEME.COLORS.WHITE,
    marginHorizontal: scale(12)
  },
  send: {
    fontSize: scale(18),
    color: THEME.COLORS.WHITE,
    marginHorizontal: scale(12)
  },

  // beginning of second half
  transactionsScrollWrap: {
    flex: 1
  },

  symbol: {
    fontFamily: THEME.FONTS.SYMBOLS
  },
  emptyListLoader: {
    backgroundColor: THEME.COLORS.GRAY_4,
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    height: scale(230)
  },

  // Interest:
  earnInterestContainer: {
    backgroundColor: THEME.COLORS.GRAY_4,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: scale(15),
    marginBottom: 0
  },
  earnInterestBox: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    backgroundColor: THEME.COLORS.WHITE,
    padding: scale(15)
  },
  earnInterestImage: {
    width: scale(32),
    height: scale(32),
    marginHorizontal: scale(4)
  },
  earnInterestText: {
    marginTop: scale(10),
    fontSize: scale(17),
    color: THEME.COLORS.GRAY_1
  }
}

const styles: typeof rawStyles = StyleSheet.create(rawStyles)
