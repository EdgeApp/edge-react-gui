// @flow

import * as React from 'react'
import { Dimensions, TouchableOpacity, View } from 'react-native'
import { Actions } from 'react-native-router-flux'
import { SwipeRow } from 'react-native-swipe-list-view'

import { Fontello } from '../../assets/vector/index.js'
import * as Constants from '../../constants/indexConstants'
import { getSpecialCurrencyInfo, WALLET_LIST_OPTIONS_ICON } from '../../constants/indexConstants.js'
import { Gradient } from '../../modules/UI/components/Gradient/Gradient.ui.js'
import { WalletListMenuModal } from '../modals/WalletListMenuModal.js'
import { Airship } from '../services/AirshipInstance.js'
import { type Theme, type ThemeProps, cacheStyles, withTheme } from '../services/ThemeContext.js'
import { EdgeText } from './EdgeText.js'
import { WalletProgressIcon } from './WalletProgressIcon.js'

const FULL_WIDTH = Dimensions.get('window').width
const WIDTH_DIMENSION_HIDE = FULL_WIDTH * 0.35
const WIDTH_DIMENSION_SHOW = FULL_WIDTH * 0.15

type Props = {
  cryptoAmount: string,
  currencyCode: string,
  differencePercentage: string,
  differencePercentageStyle: string,
  exchangeRate: string,
  exchangeRateFiatSymbol: string,
  fiatBalance: string,
  fiatBalanceSymbol: string,
  isToken: boolean,
  publicAddress: string,
  openRowLeft: boolean,
  selectWallet(walletId: string, currencyCode: string): void,
  symbolImage?: string,
  walletId: string,
  walletName: string,
  swipeRef: ?React.ElementRef<typeof SwipeRow>,
  swipeRow?: SwipeRow
}

type State = {
  swipeDirection: 'left' | 'right' | null,
  leftRowOpened: boolean
}

class WalletListRowComponent extends React.PureComponent<Props & ThemeProps, State> {
  constructor(props) {
    super(props)
    this.state = {
      swipeDirection: null,
      leftRowOpened: false
    }
  }

  componentDidUpdate() {
    if (this.props.openRowLeft && !this.state.leftRowOpened) {
      const { swipeRow, theme } = this.props
      if (swipeRow) {
        swipeRow.manuallySwipeRow(theme.rem(-6.25))
      }
      this.setState({ leftRowOpened: true })
    }
  }

  closeRow = () => {
    const { swipeRow } = this.props
    if (swipeRow) {
      swipeRow.closeRow()
    }
  }

  handleSelectWallet = (): void => {
    const { currencyCode, isToken, publicAddress, walletId } = this.props
    this.closeRow()
    this.props.selectWallet(walletId, currencyCode)
    if (!isToken) {
      // if it's EOS then we need to see if activated, if not then it will get routed somewhere else
      // if it's not EOS then go to txList, if it's EOS and activated with publicAddress then go to txList
      const { isAccountActivationRequired } = getSpecialCurrencyInfo(currencyCode)
      if (!isAccountActivationRequired || (isAccountActivationRequired && publicAddress)) {
        Actions.transactionList({ params: 'walletList' })
      }
    } else {
      Actions.transactionList({ params: 'walletList' })
    }
  }

  handleOpenWalletListMenuModal = (): void => {
    const { currencyCode, isToken, symbolImage, walletId, walletName } = this.props
    this.closeRow()
    Airship.show(bridge => (
      <WalletListMenuModal bridge={bridge} walletId={walletId} walletName={walletName} currencyCode={currencyCode} image={symbolImage} isToken={isToken} />
    ))
  }

  openScene(key: string) {
    const { currencyCode, walletId } = this.props
    this.closeRow()
    this.props.selectWallet(walletId, currencyCode)
    Actions.jump(key)
  }

  handleOpenRequest = () => {
    this.openScene(Constants.REQUEST)
  }

  handleOpenSend = () => {
    this.openScene(Constants.SCAN)
  }

  handleSwipeValueChange = ({ value }) => {
    if ((value < WIDTH_DIMENSION_SHOW && value >= 0) || (value > -WIDTH_DIMENSION_SHOW && value <= 0)) {
      this.setState({ swipeDirection: null })
    } else if (value > WIDTH_DIMENSION_HIDE) {
      this.setState({ swipeDirection: 'right' })
    } else if (value < -WIDTH_DIMENSION_HIDE) {
      this.setState({ swipeDirection: 'left' })
    }
  }

  render() {
    const { swipeDirection } = this.state
    const {
      currencyCode,
      cryptoAmount,
      differencePercentage,
      differencePercentageStyle,
      exchangeRate,
      exchangeRateFiatSymbol,
      fiatBalance,
      fiatBalanceSymbol,
      theme,
      walletId,
      walletName
    } = this.props
    const styles = getStyles(theme)
    const isSwipingLeft = swipeDirection === 'left'
    const isSwipingRight = swipeDirection === 'right'
    const leftOpenValue = isSwipingRight ? FULL_WIDTH : theme.rem(6.25)
    const rightOpenValue = isSwipingLeft ? -FULL_WIDTH : theme.rem(-6.25)
    const swipeToOpenPercent = isSwipingLeft || isSwipingRight ? 0 : 50
    return (
      <SwipeRow
        {...this.props}
        onSwipeValueChange={this.handleSwipeValueChange}
        leftOpenValue={leftOpenValue}
        rightOpenValue={rightOpenValue}
        swipeToOpenPercent={swipeToOpenPercent}
        ref={this.props.swipeRef}
        leftActivationValue={FULL_WIDTH}
        rightActivationValue={-FULL_WIDTH}
        onLeftActionStatusChange={this.handleOpenRequest}
        onRightActionStatusChange={this.handleOpenSend}
        directionalDistanceChangeThreshold={0}
        useNativeDriver
      >
        <View style={styles.swipeContainer}>
          {(isSwipingRight || swipeDirection === null) && (
            <View style={styles.swipeRowContainer}>
              <TouchableOpacity style={styles.swipeOptionsContainer} onPress={this.handleOpenWalletListMenuModal}>
                <EdgeText style={styles.swipeOptionsIcon}>{WALLET_LIST_OPTIONS_ICON}</EdgeText>
              </TouchableOpacity>
              <TouchableOpacity style={styles.swipeRequestContainer} onPress={this.handleOpenRequest}>
                <View style={styles.swipeButton}>
                  <Fontello name="request" color={theme.icon} size={theme.rem(isSwipingRight ? 1.5 : 1)} />
                </View>
              </TouchableOpacity>
            </View>
          )}
          {(isSwipingLeft || swipeDirection === null) && (
            <View style={styles.swipeRowContainer}>
              <TouchableOpacity style={styles.swipeSendContainer} onPress={this.handleOpenSend}>
                <View style={styles.swipeButton}>
                  <Fontello name="send" color={theme.icon} size={theme.rem(isSwipingLeft ? 1.5 : 1)} />
                </View>
              </TouchableOpacity>
              <TouchableOpacity style={styles.swipeOptionsContainer} onPress={this.handleOpenWalletListMenuModal}>
                <EdgeText style={styles.swipeOptionsIcon}>{WALLET_LIST_OPTIONS_ICON}</EdgeText>
              </TouchableOpacity>
            </View>
          )}
        </View>
        <Gradient style={styles.container}>
          <TouchableOpacity onPress={this.handleSelectWallet} onLongPress={this.handleOpenWalletListMenuModal}>
            <View style={styles.rowContainer}>
              <View style={styles.iconContainer}>
                <WalletProgressIcon currencyCode={currencyCode} walletId={walletId} />
              </View>
              <View style={styles.detailsContainer}>
                <View style={styles.detailsRow}>
                  <EdgeText style={styles.detailsCurrency}>{currencyCode}</EdgeText>
                  <EdgeText style={[styles.exchangeRate, { color: differencePercentageStyle }]}>
                    {exchangeRateFiatSymbol + exchangeRate + '  ' + differencePercentage}
                  </EdgeText>
                  <EdgeText style={styles.detailsValue}>{cryptoAmount}</EdgeText>
                </View>
                <View style={styles.detailsRow}>
                  <EdgeText style={styles.detailsName}>{walletName}</EdgeText>
                  <EdgeText style={styles.detailsFiat}>{fiatBalanceSymbol + fiatBalance}</EdgeText>
                </View>
              </View>
            </View>
          </TouchableOpacity>
        </Gradient>
      </SwipeRow>
    )
  }
}

const getStyles = cacheStyles((theme: Theme) => ({
  container: {
    flex: 1,
    paddingHorizontal: theme.rem(1)
  },
  rowContainer: {
    flex: 1,
    flexDirection: 'row',
    marginVertical: theme.rem(1)
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.rem(1)
  },
  detailsContainer: {
    flex: 1,
    flexDirection: 'column'
  },
  detailsRow: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  detailsCurrency: {
    fontFamily: theme.fontFaceBold,
    marginRight: theme.rem(0.75)
  },
  detailsValue: {
    marginLeft: theme.rem(0.5),
    textAlign: 'right'
  },
  detailsName: {
    flex: 1,
    fontSize: theme.rem(0.75),
    color: theme.secondaryText
  },
  detailsFiat: {
    fontSize: theme.rem(0.75),
    textAlign: 'right',
    color: theme.secondaryText
  },
  exchangeRate: {
    flex: 1
  },
  swipeContainer: {
    flex: 1,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    height: theme.rem(5.75),
    marginBottom: theme.rem(1 / 16)
  },
  swipeRowContainer: {
    flex: 1,
    flexDirection: 'row',
    height: '100%'
  },
  swipeRequestContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'flex-start',
    backgroundColor: theme.sliderTabRequest,
    height: '100%'
  },
  swipeSendContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'flex-end',
    backgroundColor: theme.sliderTabSend,
    height: '100%'
  },
  swipeButton: {
    alignItems: 'center',
    justifyContent: 'center',
    width: theme.rem(3.125)
  },
  swipeOptionsContainer: {
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    width: theme.rem(3.125),
    backgroundColor: theme.sliderTabMore
  },
  swipeOptionsIcon: {
    fontSize: theme.rem(1.25)
  }
}))

const WalletListRowInner = withTheme(WalletListRowComponent)
// $FlowFixMe - forwardRef is not recognize by flow?
const WalletListRow = React.forwardRef((props, ref) => <WalletListRowInner {...props} swipeRef={ref} />)
// Lint error about component not having a displayName
WalletListRow.displayName = 'WalletListRow'
export { WalletListRow }
