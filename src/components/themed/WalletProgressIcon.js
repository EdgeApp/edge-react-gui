// @flow
import * as React from 'react'
import { Image, View } from 'react-native'
import { AnimatedCircularProgress } from 'react-native-circular-progress'
import { connect } from 'react-redux'

import type { RootState } from '../../types/reduxTypes.js'
import { type ThemeProps, withTheme } from '../services/ThemeContext.js'

type OwnProps = {
  walletId: string,
  currencyCode: string,
  size?: number
}

type StateProps = {
  icon: string | void,
  progress: number
}

type Props = OwnProps & StateProps & ThemeProps

type State = {
  isDone: boolean
}

export class WalletProgressIconComponent extends React.PureComponent<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { isDone: false }
  }

  componentDidUpdate() {
    if (this.props.progress === 100) {
      setTimeout(() => {
        this.setState({ isDone: true })
      }, 5000)
    }
  }

  componentDidMount() {
    if (this.props.progress === 100) {
      this.setState({ isDone: true })
    }
  }

  render() {
    const { isDone } = this.state
    const { icon, progress, size, theme } = this.props
    const iconSize = {
      width: size || theme.rem(2),
      height: size || theme.rem(2)
    }

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
      <AnimatedCircularProgress
        size={size ? size + theme.rem(0.25) : theme.rem(2.25)}
        width={theme.rem(3 / 16)}
        fill={formattedProgress}
        tintColor={isDone ? theme.walletProgressIconFillDone : theme.walletProgressIconFill}
        backgroundColor={theme.walletProgressIconBackground}
        rotation={0}
      >
        {() => (icon ? <Image style={iconSize} source={{ uri: icon }} /> : <View style={iconSize} />)}
      </AnimatedCircularProgress>
    )
  }
}

export const WalletProgressIcon = connect((state: RootState, ownProps: OwnProps): StateProps => {
  const guiWallet = state.ui.wallets.byId[ownProps.walletId]
  const walletsProgress = state.ui.wallets.walletLoadingProgress
  let icon
  if (guiWallet.currencyCode === ownProps.currencyCode) {
    icon = guiWallet.symbolImage
  } else {
    const meta = guiWallet.metaTokens.find(token => token.currencyCode === ownProps.currencyCode)
    icon = meta ? meta.symbolImage : undefined
  }

  return {
    icon,
    progress: walletsProgress[ownProps.walletId] ? walletsProgress[ownProps.walletId] * 100 : 0
  }
})(withTheme(WalletProgressIconComponent))
