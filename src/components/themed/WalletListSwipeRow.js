// @flow

import * as React from 'react'
import { Dimensions, Platform, TouchableOpacity, View } from 'react-native'
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
import { HiddenMenuButtons } from './HiddenMenuButtons'
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
  swipeRow?: SwipeRow,
  isModal?: boolean,
  onPress?: (walletId: string, currencyCode: string) => void
}

type State = {
  swipeDirection: 'left' | 'right' | null,
  leftRowOpened: boolean
}

class WalletListSwipeRowComponent extends React.PureComponent<Props & ThemeProps, State> {
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
    Actions.jump(key, { selectedWalletId: walletId, selectedCurrencyCode: currencyCode, isCameraOpen: true })
  }

  handleOpenRequest = () => {
    this.openScene(Constants.REQUEST)
  }

  handleOpenSend = () => {
    this.openScene(Constants.SEND)
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

  handleOnPress = () => {
    const { currencyCode, onPress, walletId } = this.props
    return onPress ? onPress(walletId, currencyCode) : undefined
  }

  renderRow = () => {
    const {
      currencyCode,
      cryptoAmount,
      differencePercentage,
      differencePercentageStyle,
      exchangeRate,
      exchangeRateFiatSymbol,
      fiatBalance,
      fiatBalanceSymbol,
      isModal,
      onPress,
      theme,
      walletId,
      walletName
    } = this.props
    const styles = getStyles(theme)
    const handlePress = onPress ? this.handleOnPress : this.handleSelectWallet
    const handleLongPress = isModal ? onPress : this.handleOpenWalletListMenuModal

    return (
      <TouchableOpacity onPress={handlePress} onLongPress={handleLongPress}>
        <View style={styles.rowContainer}>
          <View style={styles.iconContainer}>
            <WalletProgressIcon currencyCode={currencyCode} walletId={walletId} />
          </View>
          <View style={styles.detailsContainer}>
            <View style={styles.detailsRow}>
              <EdgeText style={styles.detailsCurrency}>{currencyCode}</EdgeText>
              {!isModal ? (
                <EdgeText style={[styles.exchangeRate, { color: differencePercentageStyle }]}>
                  {exchangeRateFiatSymbol + exchangeRate + '  ' + differencePercentage}
                </EdgeText>
              ) : (
                <View style={{ flex: 1 }} />
              )}
              <EdgeText style={styles.detailsValue}>{cryptoAmount}</EdgeText>
            </View>
            <View style={styles.detailsRow}>
              <EdgeText style={styles.detailsName}>{walletName}</EdgeText>
              <EdgeText style={styles.detailsFiat}>{fiatBalanceSymbol + fiatBalance}</EdgeText>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    )
  }

  render() {
    const { swipeDirection } = this.state
    const { isModal, theme } = this.props
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
        directionalDistanceChangeThreshold={5}
        useNativeDriver
        disableLeftSwipe={isModal}
        disableRightSwipe={isModal}
      >
        <HiddenMenuButtons
          left={{
            children: (
              <View style={styles.swipeOptionsContainer}>
                <EdgeText style={styles.swipeOptionsIcon} adjustsFontSizeToFit={false}>
                  {WALLET_LIST_OPTIONS_ICON}
                </EdgeText>
              </View>
            ),
            color: 'default',
            onPress: this.handleOpenWalletListMenuModal
          }}
          leftSwipable={{
            children: <Fontello name="request" color={theme.icon} size={theme.rem(isSwipingRight ? 1.5 : 1)} />,
            color: 'success',
            onPress: this.handleOpenRequest
          }}
          rightSwipable={{
            children: <Fontello name="send" color={theme.icon} size={theme.rem(isSwipingLeft ? 1.5 : 1)} />,
            color: 'danger',
            onPress: this.handleOpenSend
          }}
          right={{
            children: (
              <View style={styles.swipeOptionsContainer}>
                <EdgeText style={styles.swipeOptionsIcon} adjustsFontSizeToFit={false}>
                  {WALLET_LIST_OPTIONS_ICON}
                </EdgeText>
              </View>
            ),
            color: 'default',
            onPress: this.handleOpenWalletListMenuModal
          }}
          isSwipingRight={isSwipingRight}
          isSwipingLeft={isSwipingLeft}
          swipeDirection={swipeDirection}
        />
        {isModal ? <View style={styles.containerModal}>{this.renderRow()}</View> : <Gradient style={styles.container}>{this.renderRow()}</Gradient>}
      </SwipeRow>
    )
  }
}

const getStyles = cacheStyles((theme: Theme) => ({
  container: {
    flex: 1,
    paddingHorizontal: theme.rem(1)
  },
  containerModal: {
    backgroundColor: theme.modal
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
  swipeOptionsContainer: {
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    width: theme.rem(3.125),
    paddingBottom: Platform.OS === 'ios' ? theme.rem(0.75) : theme.rem(1), // As the swipe options icon behaves like a text. This padding ensures the icon is centered vertically
    backgroundColor: theme.sliderTabMore
  },
  swipeOptionsIcon: {
    fontSize: theme.rem(1.25)
  }
}))

const WalletListSwipeRowInner = withTheme(WalletListSwipeRowComponent)
// $FlowFixMe - forwardRef is not recognize by flow?
const WalletListSwipeRow = React.forwardRef((props, ref) => <WalletListSwipeRowInner {...props} swipeRef={ref} />)
// Lint error about component not having a displayName
WalletListSwipeRow.displayName = 'WalletListRow'
export { WalletListSwipeRow }
