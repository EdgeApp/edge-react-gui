// @flow

import * as React from 'react'
import { View } from 'react-native'
import { AnimatedCircularProgress } from 'react-native-circular-progress'
import FastImage from 'react-native-fast-image'

import { SMALL_ICON_RATIO } from '../../constants/constantSettings.js'
import { getPluginId } from '../../constants/WalletAndCurrencyConstants.js'
import { connect } from '../../types/reactRedux.js'
import { getCurrencyIcon } from '../../util/CurrencyInfoHelpers.js'
import { type ThemeProps, withTheme } from '../services/ThemeContext.js'

type OwnProps = {
  // eslint-disable-next-line react/no-unused-prop-types
  walletId: string,
  // eslint-disable-next-line react/no-unused-prop-types
  currencyCode: string,
  size?: number
}

type StateProps = {
  icon?: string,
  parentIcon?: string,
  progress: number
}

type Props = OwnProps & StateProps & ThemeProps

type State = {
  isDone: boolean
}

export class WalletProgressIconComponent extends React.PureComponent<Props, State> {
  updateIsDoneState: TimeoutID

  constructor(props: Props) {
    super(props)
    this.state = { isDone: false }
  }

  updateIsDone(isDone: boolean) {
    this.updateIsDoneState = setTimeout(() => {
      this.setState({ isDone })
    }, 500)
  }

  componentDidUpdate() {
    if (this.props.progress === 100) {
      this.updateIsDone(true)
    }
    if (this.props.progress <= 5) {
      this.updateIsDone(false)
    }
  }

  componentDidMount() {
    if (this.props.progress === 100) {
      this.setState({ isDone: true })
    }
  }

  componentWillUnmount() {
    clearTimeout(this.updateIsDoneState)
  }

  getIconSize = (multiplier: number = 1) => {
    const { size = this.props.theme.rem(2) } = this.props
    return { width: size * multiplier, height: size * multiplier }
  }

  render() {
    const { isDone } = this.state
    const { icon, parentIcon, progress, size, theme } = this.props

    let formattedProgress
    if (!icon) {
      formattedProgress = 0
    } else if (progress < 5) {
      formattedProgress = 5
    } else if (progress > 95 && progress < 100) {
      formattedProgress = 95
    } else {
      formattedProgress = progress
    }

    return (
      <View>
        <AnimatedCircularProgress
          size={size ? size + theme.rem(0.25) : theme.rem(2.25)}
          width={theme.rem(3 / 16)}
          fill={formattedProgress}
          tintColor={isDone ? theme.walletProgressIconFillDone : theme.walletProgressIconFill}
          backgroundColor={theme.walletProgressIconBackground}
          rotation={0}
        >
          {() => (icon != null ? <FastImage style={this.getIconSize()} source={{ uri: icon }} /> : <View style={this.getIconSize()} />)}
        </AnimatedCircularProgress>
        {parentIcon != null ? (
          <FastImage
            style={{ position: 'absolute', bottom: theme.rem(3 / 16), right: theme.rem(3 / 16), ...this.getIconSize(SMALL_ICON_RATIO) }}
            source={{ uri: parentIcon }}
          />
        ) : null}
      </View>
    )
  }
}

export const WalletProgressIcon = connect<StateProps, {}, OwnProps>(
  (state, ownProps) => {
    const { walletId, currencyCode } = ownProps

    if (walletId == null) return { progress: 0 }

    const guiWallet = state.ui.wallets.byId[walletId]
    const { metaTokens } = guiWallet
    const contractAddress = metaTokens.find(token => token.currencyCode === currencyCode)?.contractAddress
    const { symbolImage, parentSymbolImage } = getCurrencyIcon(getPluginId(guiWallet.type), contractAddress)
    const { walletLoadingProgress } = state.ui.wallets

    return {
      icon: symbolImage,
      parentIcon: parentSymbolImage,
      progress: walletLoadingProgress[walletId] ? walletLoadingProgress[walletId] * 100 : 0
    }
  },
  dispatch => ({})
)(withTheme(WalletProgressIconComponent))
