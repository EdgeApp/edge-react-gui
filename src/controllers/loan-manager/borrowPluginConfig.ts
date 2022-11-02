import { EdgeCorePluginOptions } from 'edge-core-js'

import { makeAaveEthBorrowPlugin, makeAaveKovBorrowPlugin, makeAaveMaticBorrowPlugin } from '../../plugins/borrow-plugins/plugins/aave'
import { BorrowPlugin } from '../../plugins/borrow-plugins/types'

export interface BorrowPluginMap {
  [pluginId: string]: BorrowPlugin
}

const allPlugins = {
  aavePolygon: makeAaveMaticBorrowPlugin,
  aaveEth: makeAaveEthBorrowPlugin,
  aaveKovan: makeAaveKovBorrowPlugin
}

// Optional plugin options:
const pluginConfigs: { [pluginId: string]: EdgeCorePluginOptions } = {
  // Example: aavePolygon: {...},
}

export const borrowPluginMap: BorrowPluginMap = Object.keys(allPlugins).reduce((map, key) => {
  // @ts-expect-error
  const factory = allPlugins[key]
  const config = pluginConfigs[key]
  const plugin = factory(config)
  return { ...map, [key]: plugin }
}, {})
