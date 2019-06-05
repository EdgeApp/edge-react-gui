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
import { fakeUser } from '../../fake-user.js'
import EdgeAccountCallbackManager from './EdgeAccountCallbackManager.js'
import EdgeContextCallbackManager from './EdgeContextCallbackManager.js'
import EdgeWalletsCallbackManager from './EdgeWalletsCallbackManager.js'

type Props = {
  onLoad: (context: EdgeContext) => mixed,
  onError: (error: any) => mixed
}

export const currencyPlugins = {
  // edge-currency-accountbased:
  eos: true,
  ethereum: {
    // blockcypherApiKey: '...',
    etherscanApiKey: ENV.ETHERSCAN_API_KEY,
    infuraProjectId: ENV.INFURA_PROJECT_ID
  },
  stellar: true,
  ripple: true,
  // edge-currency-bitcoin:
  bitcoin: true,
  bitcoincash: true,
  bitcoincashtestnet: false,
  bitcoingold: true,
  bitcoingoldtestnet: false,
  bitcoinsv: true,
  bitcointestnet: false,
  dash: true,
  digibyte: true,
  dogecoin: true,
  eboost: false,
  feathercoin: true,
  groestlcoin: true,
  litecoin: true,
  qtum: true,
  ravencoin: true,
  smartcash: true,
  ufo: true,
  vertcoin: true,
  zcoin: true,
  // edge-currency-monero:
  monero: true // { apiKey: '...' }
}

export const ratePlugins = {
  'shapeshift-rate': true,
  coinbase: true,
  coincap: true,
  coincapLegacy: true,
  nomics: ENV.NOMICS_INIT,
  currencyconverterapi: ENV.CURRENCYCONVERTERAPI_INIT,
  herc: true
}

export const swapPlugins = {
  changelly: ENV.CHANGELLY_INIT,
  changenow: { apiKey: ENV.CHANGE_NOW_API_KEY },
  faast: ENV.FAAST_INIT,
  shapeshift: { apiKey: ENV.SHAPESHIFT_API_KEY },
  foxExchange: { apiKey: ENV.FOX_EXCHANGE_API_KEY }
}

const contextOptions = {
  apiKey: ENV.AIRBITZ_API_KEY,
  appId: '',
  plugins: {
    ...currencyPlugins,
    ...ratePlugins,
    ...swapPlugins
  }
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
