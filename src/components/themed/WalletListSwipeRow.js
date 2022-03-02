// @flow

import * as React from 'react'
import { Dimensions, Keyboard, Platform, View } from 'react-native'
import { SwipeRow } from 'react-native-swipe-list-view'

import { Fontello } from '../../assets/vector/index.js'
import { REQUEST, SEND, TRANSACTION_LIST } from '../../constants/SceneKeys.js'
import { getPluginId, getSpecialCurrencyInfo, WALLET_LIST_OPTIONS_ICON } from '../../constants/WalletAndCurrencyConstants.js'
import { Actions } from '../../types/routerTypes.js'
import type { GuiWallet } from '../../types/types.js'
import { getCurrencyIcon } from '../../util/CurrencyInfoHelpers.js'
import { WalletListMenuModal } from '../modals/WalletListMenuModal.js'
import { Airship } from '../services/AirshipInstance.js'
import { type Theme, type ThemeProps, cacheStyles, withTheme } from '../services/ThemeContext.js'
import { EdgeText } from './EdgeText.js'
import { HiddenMenuButtons } from './HiddenMenuButtons'
import { WalletListCurrencyRow } from './WalletListCurrencyRow.js'

const FULL_WIDTH = Dimensions.get('window').width
const WIDTH_DIMENSION_HIDE = FULL_WIDTH * 0.35
const WIDTH_DIMENSION_SHOW = FULL_WIDTH * 0.15

type Props = {
  currencyCode: string,
  guiWallet: GuiWallet,
  isToken: boolean,
  openRowLeft: boolean,
  selectWallet(walletId: string, currencyCode: string): void,
  swipeRef: ?React.ElementRef<typeof SwipeRow>,
  swipeRow?: SwipeRow
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
      // eslint-disable-next-line react/no-did-update-set-state
      this.setState({ leftRowOpened: true })
    }
  }

  closeRow = () => {
    const { swipeRow } = this.props
    if (swipeRow) {
      swipeRow.closeRow()
    }
    Keyboard.dismiss()
  }

  handleSelectWallet = (): void => {
    const { currencyCode, guiWallet, isToken } = this.props
    const { id: walletId, type: walletType } = guiWallet
    const publicAddress = guiWallet.receiveAddress.publicAddress

    this.closeRow()
    this.props.selectWallet(walletId, currencyCode)
    if (!isToken) {
      // if it's EOS then we need to see if activated, if not then it will get routed somewhere else
      // if it's not EOS then go to txList, if it's EOS and activated with publicAddress then go to txList
      const { isAccountActivationRequired } = getSpecialCurrencyInfo(walletType)
      if (!isAccountActivationRequired || (isAccountActivationRequired && publicAddress)) {
        Actions.push(TRANSACTION_LIST)
      }
    } else {
      Actions.push(TRANSACTION_LIST)
    }
  }

  handleOpenWalletListMenuModal = (): void => {
    const { currencyCode, guiWallet, isToken } = this.props
    const { metaTokens } = guiWallet
    const contractAddress = metaTokens.find(token => token.currencyCode === currencyCode)?.contractAddress
    const { symbolImage } = getCurrencyIcon(getPluginId(guiWallet.type), contractAddress)

    this.closeRow()
    Airship.show(bridge => (
      <WalletListMenuModal
        bridge={bridge}
        walletId={guiWallet.id}
        walletName={guiWallet.name}
        currencyCode={currencyCode}
        image={symbolImage}
        isToken={isToken}
      />
    ))
  }

  handleOpenRequest = () => {
    const { currencyCode, guiWallet } = this.props
    const walletId = guiWallet.id
    this.closeRow()
    this.props.selectWallet(walletId, currencyCode)
    Actions.jump(REQUEST)
  }

  handleOpenSend = () => {
    const { currencyCode, guiWallet } = this.props
    const walletId = guiWallet.id
    this.closeRow()
    this.props.selectWallet(walletId, currencyCode)
    Actions.jump(SEND, {
      selectedWalletId: walletId,
      selectedCurrencyCode: currencyCode,
      isCameraOpen: true
    })
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
    const { currencyCode, guiWallet, theme } = this.props
    if (guiWallet == null) return null
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
      >
        <HiddenMenuButtons
          left={{
            children: (
              <View style={styles.swipeOptionsContainer}>
                <EdgeText style={styles.swipeOptionsIcon}>{WALLET_LIST_OPTIONS_ICON}</EdgeText>
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
                <EdgeText style={styles.swipeOptionsIcon}>{WALLET_LIST_OPTIONS_ICON}</EdgeText>
              </View>
            ),
            color: 'default',
            onPress: this.handleOpenWalletListMenuModal
          }}
          isSwipingRight={isSwipingRight}
          isSwipingLeft={isSwipingLeft}
          swipeDirection={swipeDirection}
        />
        <WalletListCurrencyRow
          currencyCode={currencyCode}
          gradient
          onPress={this.handleSelectWallet}
          onLongPress={this.handleOpenWalletListMenuModal}
          showRate
          walletId={guiWallet.id}
        />
      </SwipeRow>
    )
  }
}

const getStyles = cacheStyles((theme: Theme) => ({
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
