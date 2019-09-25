// @flow

import detectBundler from 'detect-bundler'
import { type EdgeContext, type EdgeFakeWorld, MakeEdgeContext, MakeFakeEdgeWorld } from 'edge-core-js'
import makeAccountbasedIo from 'edge-currency-accountbased/lib/react-native-io.js'
import makeBitcoinIo from 'edge-currency-bitcoin/lib/react-native-io.js'
import makeMoneroIo from 'edge-currency-monero/lib/react-native-io.js'
import makeExchangeIo from 'edge-exchange-plugins/lib/react-native-io.js'
import React, { Fragment, PureComponent } from 'react'
import { Alert, AppState } from 'react-native'
import SplashScreen from 'react-native-smart-splash-screen'

import ENV from '../../../env.json'
import { allPlugins } from '../../util/corePlugins.js'
import { fakeUser } from '../../util/fake-user.js'
import { LoadingScene } from '../scenes/LoadingScene.js'
import { Services } from './Services.js'

type Props = {
  onLoad: (context: EdgeContext) => mixed,
  onError: (error: any) => mixed
}

type State = {
  context: EdgeContext | null,
  counter: number
}

const contextOptions = {
  apiKey: ENV.AIRBITZ_API_KEY,
  appId: '',
  plugins: allPlugins
}

const isReactNative = detectBundler.isReactNative
const nativeIo = isReactNative
  ? {
    'edge-currency-accountbased': makeAccountbasedIo(),
    'edge-currency-bitcoin': makeBitcoinIo(),
    'edge-currency-monero': makeMoneroIo(),
    'edge-exchange-plugins': makeExchangeIo()
  }
  : {}

/**
 * Mounts the edge-core-js WebView, and then mounts the rest of the app
 * once the core context is ready.
 */
export class EdgeCoreManager extends PureComponent<Props, State> {
  splashHidden: boolean = false
  paused: boolean = false

  constructor (props: Props) {
    super(props)
    this.state = { context: null, counter: 0 }
  }

  componentDidMount () {
    AppState.addEventListener('change', this.onAppStateChange)
  }

  componentWillUnmount () {
    AppState.removeEventListener('change', this.onAppStateChange)
  }

  onAppStateChange = (appState: string) => {
    const paused = appState !== 'active'
    if (this.paused !== paused) {
      this.paused = paused

      const { context } = this.state
      if (context != null) {
        // TODO: Display a popdown error alert once we get that redux-free:
        context.changePaused(paused, { secondsDelay: paused ? 20 : 0 }).catch(e => console.log(e))
      }
    }
  }

  hideSplash () {
    if (!this.splashHidden) {
      this.splashHidden = true
      SplashScreen.close({
        animationType: SplashScreen.animationType.fade,
        duration: 850,
        delay: 500
      })
    }
  }

  onContext = (context: EdgeContext) => {
    context.on('close', () => {
      this.setState({ context: null })
    })
    this.setState(state => ({ context, counter: state.counter + 1 }), () => this.hideSplash())
  }

  onError = (error: Error) => {
    this.hideSplash()
    Alert.alert('Edge core failed to load', String(error))
  }

  onFakeEdgeWorld = (world: EdgeFakeWorld) => {
    world.makeEdgeContext(contextOptions).then(this.onContext, this.onError)
  }

  renderCore () {
    return ENV.USE_FAKE_CORE ? (
      <MakeFakeEdgeWorld debug={ENV.DEBUG_CORE_BRIDGE} users={[fakeUser]} onLoad={this.onFakeEdgeWorld} onError={this.onError} nativeIo={nativeIo} />
    ) : (
      <MakeEdgeContext debug={ENV.DEBUG_CORE_BRIDGE} options={contextOptions} onLoad={this.onContext} onError={this.onError} nativeIo={nativeIo} />
    )
  }

  render () {
    const { context, counter } = this.state
    const key = `redux${counter}`

    return (
      <Fragment>
        {context == null ? <LoadingScene /> : <Services key={key} context={context} />}
        {this.renderCore()}
      </Fragment>
    )
  }
}
