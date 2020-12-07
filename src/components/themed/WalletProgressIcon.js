// @flow
import * as React from 'react'
import { Image } from 'react-native'
import { AnimatedCircularProgress } from 'react-native-circular-progress'
import { connect } from 'react-redux'

import type { RootState } from '../../types/reduxTypes.js'
import { type Theme, type ThemeProps, cacheStyles, withTheme } from '../services/ThemeContext.js'

type OwnProps = {
  walletId: string
}

type StateProps = {
  icon: string | void,
  progress: number
}

type Props = StateProps & ThemeProps

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
    const { icon, progress, theme } = this.props
    const styles = getStyles(this.props.theme)
    return (
      <AnimatedCircularProgress
        size={theme.rem(2.25)}
        width={theme.rem(3 / 16)}
        fill={progress}
        tintColor={isDone ? theme.walletProgressIconFillDone : theme.walletProgressIconFill}
        backgroundColor={theme.walletProgressIconBackground}
        rotation={0}
      >
        {() => <Image style={styles.icon} source={{ uri: icon }} />}
      </AnimatedCircularProgress>
    )
  }
}

export const WalletProgressIcon = connect((state: RootState, ownProps: OwnProps): StateProps => {
  const guiWallet = state.ui.wallets.byId[ownProps.walletId]
  const walletsProgress = state.ui.wallets.walletLoadingProgress
  return {
    icon: guiWallet.symbolImage,
    progress: walletsProgress[ownProps.walletId] ? walletsProgress[ownProps.walletId] * 100 : 0
  }
})(withTheme(WalletProgressIconComponent))

const getStyles = cacheStyles((theme: Theme) => ({
  icon: {
    width: theme.rem(2),
    height: theme.rem(2)
  }
}))
