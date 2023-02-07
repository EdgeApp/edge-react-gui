import { ENV } from '../../env'
import { makeTronStakePlugin } from './currency/tronStakePlugin'
import { makeTcSaversPlugin } from './thorchainSavers/tcSaversPlugin'
import { StakePlugin } from './types'
import { makeUniV2StakePlugin } from './uniswapV2/uniV2Plugin'

// Return the memoized plugins and update them in the background for the next time this function is called
let loadedPlugins: StakePlugin[]

export const getStakePlugins = async (): Promise<StakePlugin[]> => {
  if (loadedPlugins == null) {
    await makeStakePlugins()
  }
  return loadedPlugins ?? []
}

export const makeStakePlugins = async (): Promise<void> => {
  const tcInitOptions = typeof ENV.THORCHAIN_INIT === 'object' ? ENV.THORCHAIN_INIT : {}

  const promises = [
    makeUniV2StakePlugin().catch(e => {
      console.warn(e.message)
    }),
    makeTcSaversPlugin({ initOptions: tcInitOptions }).catch(e => {
      console.warn(e.message)
    }),
    makeTronStakePlugin().catch(e => {
      console.warn(e.message)
    })
  ]

  const results = await Promise.all(promises)

  loadedPlugins = results.filter((result): result is StakePlugin => result != null)
}
