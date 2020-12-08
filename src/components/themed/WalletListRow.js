// @flow

import * as React from 'react'
import { Dimensions, Image, TouchableHighlight, TouchableOpacity, View } from 'react-native'
import { Actions } from 'react-native-router-flux'
import { SwipeRow } from 'react-native-swipe-list-view'

import { Fontello } from '../../assets/vector/index.js'
import * as Constants from '../../constants/indexConstants'
import { getSpecialCurrencyInfo, WALLET_LIST_OPTIONS_ICON } from '../../constants/indexConstants.js'
import { ProgressPie } from '../common/ProgressPie.js'
import { WalletListMenuModal } from '../modals/WalletListMenuModal.js'
import { Airship } from '../services/AirshipInstance.js'
import { type Theme, type ThemeProps, cacheStyles, withTheme } from '../services/ThemeContext.js'
import { EdgeText } from './EdgeText.js'

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
  selectWallet(walletId: string, currencyCode: string): void,
  symbolImage?: string,
  walletId: string,
  walletName: string,
  walletProgress: number,
  swipeRef: ?React.ElementRef<typeof SwipeRow>,
  swipeRow: SwipeRow
}

type State = {
  swipeDirection: 'left' | 'right' | null
}

class WalletListRowComponent extends React.PureComponent<Props & ThemeProps, State> {
  constructor(props) {
    super(props)
    this.state = {
      swipeDirection: null
    }
  }

  handleSelectWallet = (): void => {
    const { currencyCode, isToken, publicAddress, swipeRow, walletId } = this.props
    swipeRow.closeRow()
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
    const { currencyCode, isToken, swipeRow, symbolImage, walletId, walletName } = this.props
    swipeRow.closeRow()
    Airship.show(bridge => (
      <WalletListMenuModal bridge={bridge} walletId={walletId} walletName={walletName} currencyCode={currencyCode} image={symbolImage} isToken={isToken} />
    ))
  }

  openScene(key: string) {
    const { currencyCode, swipeRow, walletId } = this.props
    swipeRow.closeRow()
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
      isToken,
      symbolImage,
      theme,
      walletName,
      walletProgress
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
        <View style={styles.container}>
          <TouchableHighlight
            activeOpacity={theme.underlayOpacity}
            underlayColor={theme.underlayColor}
            onPress={this.handleSelectWallet}
            onLongPress={this.handleOpenWalletListMenuModal}
          >
            <View style={[styles.rowContainer, isToken ? styles.tokenBackground : styles.walletBackground]}>
              <View style={styles.iconContainer}>
                {symbolImage && <Image style={styles.icon} source={{ uri: symbolImage }} resizeMode="cover" />}
                <View style={styles.icon}>
                  <ProgressPie size={theme.rem(1.25)} color={theme.iconLoadingOverlay} progress={walletProgress} />
                </View>
              </View>
              <View style={styles.detailsContainer}>
                <View style={styles.detailsRow}>
                  <EdgeText style={styles.detailsCurrency}>{currencyCode}</EdgeText>
                  <EdgeText style={styles.detailsValue}>{cryptoAmount}</EdgeText>
                </View>
                <View style={styles.detailsRow}>
                  <EdgeText style={styles.detailsName}>{walletName}</EdgeText>
                  <EdgeText style={styles.detailsFiat}>{fiatBalanceSymbol + fiatBalance}</EdgeText>
                </View>
                <View style={styles.divider} />
                <View style={styles.detailsRow}>
                  <EdgeText style={styles.exchangeRate}>{exchangeRateFiatSymbol + exchangeRate}</EdgeText>
                  <EdgeText style={[styles.percentage, { color: differencePercentageStyle }]}>{differencePercentage}</EdgeText>
                </View>
              </View>
            </View>
          </TouchableHighlight>
        </View>
      </SwipeRow>
    )
  }
}

const getStyles = cacheStyles((theme: Theme) => ({
  container: {
    flex: 1,
    marginBottom: theme.rem(1 / 16)
  },
  rowContainer: {
    flex: 1,
    flexDirection: 'row',
    height: theme.rem(5.75),
    padding: theme.rem(0.75)
  },
  walletBackground: {
    backgroundColor: theme.walletListBackground
  },
  tokenBackground: {
    backgroundColor: theme.walletListMutedBackground
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: theme.rem(1.25),
    marginRight: theme.rem(0.75)
  },
  icon: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: theme.rem(1.25),
    height: theme.rem(1.25),
    resizeMode: 'contain'
  },
  detailsContainer: {
    flex: 1,
    flexDirection: 'column'
  },
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center'
  },
  detailsCurrency: {
    flex: 1,
    fontFamily: theme.fontFaceBold
  },
  detailsValue: {
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
    flex: 1,
    fontSize: theme.rem(0.75),
    textAlign: 'left'
  },
  percentage: {
    fontSize: theme.rem(0.75),
    fontFamily: theme.fontFaceBold
  },
  divider: {
    height: theme.rem(1 / 16),
    borderColor: theme.lineDivider,
    borderBottomWidth: theme.rem(1 / 16),
    marginVertical: theme.rem(0.5)
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
