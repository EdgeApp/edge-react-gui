// @flow

import type { Disklet } from 'disklet'
import * as React from 'react'
import { View } from 'react-native'
import ConfettiCannon from 'react-native-confetti-cannon'
import { Actions } from 'react-native-router-flux'
import { connect } from 'react-redux'

import { EXCHANGE_SCENE } from '../../constants/SceneKeys.js'
import s from '../../locales/strings.js'
import type { RootState } from '../../reducers/RootReducer'
import { needToShowConfetti } from '../../util/show-confetti'
import { SceneWrapper } from '../common/SceneWrapper.js'
import { type Theme, type ThemeProps, cacheStyles, withTheme } from '../services/ThemeContext.js'
import { EdgeText } from '../themed/EdgeText'
import { Fade } from '../themed/Fade'
import { SecondaryButton } from '../themed/ThemedButtons'

type StateProps = {
  userId: string,
  disklet: Disklet
}

type LocalState = {
  showButton: boolean,
  showConfetti: boolean
}

type Props = StateProps & ThemeProps

const confettiProps = {
  count: 250,
  origin: { x: -50, y: -50 },
  fallSpeed: 4000
}

class CryptoExchangeSuccessComponent extends React.PureComponent<Props, LocalState> {
  constructor() {
    super()
    this.state = { showButton: false, showConfetti: false }
  }

  componentDidMount(): void {
    this.showConfetti()
  }

  done = () => {
    this.setState({ showButton: false })
    Actions.popTo(EXCHANGE_SCENE)
  }

  showConfetti = async () => {
    const { userId, disklet } = this.props
    const show: boolean = await needToShowConfetti(userId, disklet)

    if (show) {
      this.setState({ showConfetti: true })
      setTimeout(() => {
        this.setState({ showButton: true })
      }, 4500)
    } else {
      this.setState({ showButton: true })
    }
  }

  renderConfetti() {
    if (!this.state.showConfetti) return null
    return <ConfettiCannon {...confettiProps} />
  }

  render() {
    const { showButton } = this.state
    const styles = getStyles(this.props.theme)
    return (
      <SceneWrapper background="theme">
        <View style={styles.container}>
          <EdgeText style={styles.title} isBold>
            {s.strings.exchange_congratulations}
          </EdgeText>
          <EdgeText style={styles.text} numberOfLines={2}>
            {s.strings.exchange_congratulations_msg}
          </EdgeText>
          <EdgeText style={[styles.text, styles.textInfo]} numberOfLines={3}>
            {s.strings.exchange_congratulations_msg_info}
          </EdgeText>
          <Fade visible={showButton} hidden>
            <SecondaryButton label={s.strings.string_done_cap} onPress={this.done} />
          </Fade>
          {this.renderConfetti()}
        </View>
      </SceneWrapper>
    )
  }
}

const getStyles = cacheStyles((theme: Theme) => ({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center'
  },
  title: {
    width: '100%',
    textAlign: 'center',
    fontWeight: '600',
    fontSize: theme.rem(1.25),
    marginBottom: theme.rem(1.25)
  },
  text: {
    maxWidth: theme.rem(10),
    textAlign: 'center',
    fontWeight: '600',
    fontSize: theme.rem(0.75),
    marginBottom: theme.rem(1.5)
  },
  textInfo: {
    maxWidth: theme.rem(9.5)
  }
}))

export const CryptoExchangeSuccessScene = connect((state: RootState): StateProps => ({
  userId: state.core.account.id,
  disklet: state.core.disklet
}))(withTheme(CryptoExchangeSuccessComponent))
