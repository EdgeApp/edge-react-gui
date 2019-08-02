// @flow

import detectBundler from 'detect-bundler'
import { type EdgeContext, MakeEdgeContext, MakeFakeEdgeWorld } from 'edge-core-js'
import makeAccountbasedIo from 'edge-currency-accountbased/lib/react-native-io.js'
import makeBitcoinIo from 'edge-currency-bitcoin/lib/react-native-io.js'
import makeMoneroIo from 'edge-currency-monero/lib/react-native-io.js'
import makeExchangeIo from 'edge-exchange-plugins/lib/react-native-io.js'
import React, { PureComponent } from 'react'
import { View } from 'react-native'

import ENV from '../../../env.json'
import { allPlugins } from '../../util/corePlugins.js'
import { fakeUser } from '../../util/fake-user.js'
import EdgeAccountCallbackManager from './EdgeAccountCallbackManager.js'
import EdgeContextCallbackManager from './EdgeContextCallbackManager.js'
import EdgeWalletsCallbackManager from './EdgeWalletsCallbackManager.js'

type Props = {
  onLoad: (context: EdgeContext) => mixed,
  onError: (error: any) => mixed
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

export class EdgeCoreManager extends PureComponent<Props> {
  render () {
    return (
      <View>
        {ENV.USE_FAKE_CORE ? (
          <MakeFakeEdgeWorld
            debug={ENV.DEBUG_CORE_BRIDGE}
            users={[fakeUser]}
            onLoad={world => world.makeEdgeContext(contextOptions).then(this.props.onLoad)}
            onError={this.props.onError}
            nativeIo={nativeIo}
          />
        ) : (
          <MakeEdgeContext debug={ENV.DEBUG_CORE_BRIDGE} options={contextOptions} onLoad={this.props.onLoad} onError={this.props.onError} nativeIo={nativeIo} />
        )}
        <EdgeContextCallbackManager />
        <EdgeAccountCallbackManager />
        <EdgeWalletsCallbackManager />
      </View>
    )
  }
}
