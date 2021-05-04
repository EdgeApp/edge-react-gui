// @flow

import * as React from 'react'
import { View } from 'react-native'
import ConfettiCannon from 'react-native-confetti-cannon'
import { Actions } from 'react-native-router-flux'

import * as Constants from '../../constants/indexConstants'
import s from '../../locales/strings.js'
import { SceneWrapper } from '../common/SceneWrapper.js'
import { type Theme, type ThemeProps, cacheStyles, withTheme } from '../services/ThemeContext.js'
import { EdgeText } from '../themed/EdgeText'
import { Fade } from '../themed/Fade'
import { SecondaryButton } from '../themed/ThemedButtons'

type LocalState = {
  showButton: boolean
}

const confettiProps = {
  count: 250,
  origin: { x: -50, y: -50 },
  fallSpeed: 4000
}

class CryptoExchangeSuccessComponent extends React.PureComponent<ThemeProps, LocalState> {
  constructor() {
    super()
    this.state = { showButton: false }
  }

  componentDidMount(): * {
    setTimeout(() => {
      this.setState({ showButton: true })
    }, 4500)
  }

  done = () => {
    this.setState({ showButton: false })
    Actions.popTo(Constants.EXCHANGE_SCENE)
  }

  renderConfetti() {
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
  }
}))

export const CryptoExchangeSuccessScene = withTheme(CryptoExchangeSuccessComponent)
