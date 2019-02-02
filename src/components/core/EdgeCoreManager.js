// @flow

import type { EdgeContext, EdgeCorePluginFactory } from 'edge-core-js'
import { eosCurrencyPluginFactory, ethereumCurrencyPluginFactory, rippleCurrencyPluginFactory, stellarCurrencyPluginFactory } from 'edge-currency-accountbased'
import {
  bitcoinCurrencyPluginFactory,
  bitcoincashCurrencyPluginFactory,
  bitcoingoldCurrencyPluginFactory,
  bitcoinsvCurrencyPluginFactory,
  dashCurrencyPluginFactory,
  digibyteCurrencyPluginFactory,
  feathercoinCurrencyPluginFactory,
  groestlcoinCurrencyPluginFactory,
  litecoinCurrencyPluginFactory,
  qtumCurrencyPluginFactory,
  smartcashCurrencyPluginFactory,
  ufoCurrencyPluginFactory,
  vertcoinCurrencyPluginFactory,
  zcoinCurrencyPluginFactory
} from 'edge-currency-bitcoin'
import { moneroCurrencyPluginFactory } from 'edge-currency-monero'
import { coinbasePlugin, coincapPlugin, currencyconverterapiPlugin, shapeshiftPlugin } from 'edge-exchange-plugins'
import React, { PureComponent } from 'react'
import { View } from 'react-native'

import { makeCoreContext } from '../../util/makeContext.js'
import EdgeAccountCallbackManager from './EdgeAccountCallbackManager.js'
import EdgeContextCallbackManager from './EdgeContextCallbackManager.js'
import EdgeWalletsCallbackManager from './EdgeWalletsCallbackManager.js'

type Props = {
  onLoad: (context: EdgeContext) => mixed,
  onError: (error: any) => mixed
}

const pluginFactories: Array<EdgeCorePluginFactory> = [
  // Exchanges:
  coinbasePlugin,
  shapeshiftPlugin,
  coincapPlugin,
  currencyconverterapiPlugin,
  // Currencies:
  bitcoincashCurrencyPluginFactory,
  bitcoinCurrencyPluginFactory,
  ethereumCurrencyPluginFactory,
  eosCurrencyPluginFactory,
  stellarCurrencyPluginFactory,
  rippleCurrencyPluginFactory,
  moneroCurrencyPluginFactory,
  dashCurrencyPluginFactory,
  litecoinCurrencyPluginFactory,
  bitcoinsvCurrencyPluginFactory,
  // eboostCurrencyPluginFactory,
  // dogecoinCurrencyPluginFactory,
  qtumCurrencyPluginFactory,
  digibyteCurrencyPluginFactory,
  zcoinCurrencyPluginFactory,
  bitcoingoldCurrencyPluginFactory,
  vertcoinCurrencyPluginFactory,
  feathercoinCurrencyPluginFactory,
  smartcashCurrencyPluginFactory,
  groestlcoinCurrencyPluginFactory,
  ufoCurrencyPluginFactory
]

export class EdgeCoreManager extends PureComponent<Props> {
  componentDidMount () {
    makeCoreContext(pluginFactories)
      .then(this.props.onLoad)
      .catch(this.props.onError)
  }

  render () {
    return (
      <View>
        <EdgeContextCallbackManager />
        <EdgeAccountCallbackManager />
        <EdgeWalletsCallbackManager />
      </View>
    )
  }
}
