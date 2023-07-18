import { Disklet } from 'disklet'
import * as React from 'react'
import { View } from 'react-native'
import ConfettiCannon from 'react-native-confetti-cannon'

import { lstrings } from '../../locales/strings'
import { connect } from '../../types/reactRedux'
import { EdgeSceneProps } from '../../types/routerTypes'
import { needToShowConfetti } from '../../util/show-confetti'
import { NotificationSceneWrapper } from '../common/SceneWrapper'
import { showError } from '../services/AirshipInstance'
import { cacheStyles, Theme, ThemeProps, withTheme } from '../services/ThemeContext'
import { EdgeText } from '../themed/EdgeText'
import { Fade } from '../themed/Fade'
import { MainButton } from '../themed/MainButton'

interface OwnProps extends EdgeSceneProps<'exchangeSuccess'> {}

interface StateProps {
  userId: string
  disklet: Disklet
}

interface LocalState {
  showButton: boolean
  showConfetti: boolean
}

type Props = StateProps & OwnProps & ThemeProps

const confettiProps = {
  count: 250,
  origin: { x: -50, y: -50 },
  fallSpeed: 4000
}

export class CryptoExchangeSuccessComponent extends React.PureComponent<Props, LocalState> {
  constructor() {
    // @ts-expect-error
    super()
    this.state = { showButton: false, showConfetti: false }
  }

  componentDidMount(): void {
    this.showConfetti().catch(err => showError(err))
  }

  done = () => {
    const { navigation } = this.props
    this.setState({ showButton: false })
    navigation.navigate('exchangeTab', { screen: 'exchange' })
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
    const { navigation, theme } = this.props
    const { showButton } = this.state
    const styles = getStyles(theme)
    return (
      <NotificationSceneWrapper navigation={navigation} background="theme">
        <View style={styles.container}>
          <EdgeText style={styles.title}>{lstrings.exchange_congratulations}</EdgeText>
          <EdgeText style={styles.text} numberOfLines={2}>
            {lstrings.exchange_congratulations_msg}
          </EdgeText>
          <EdgeText style={[styles.text, styles.textInfo]} numberOfLines={3}>
            {lstrings.exchange_congratulations_msg_info}
          </EdgeText>
          <Fade visible={showButton}>
            <MainButton label={lstrings.string_done_cap} type="secondary" onPress={this.done} />
          </Fade>
          {this.renderConfetti()}
        </View>
      </NotificationSceneWrapper>
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

export const CryptoExchangeSuccessScene = connect<StateProps, {}, OwnProps>(
  state => ({
    userId: state.core.account.id,
    disklet: state.core.disklet
  }),
  dispatch => ({})
)(withTheme(CryptoExchangeSuccessComponent))
