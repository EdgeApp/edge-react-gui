import { makeTcSaversPlugin } from './thorchainSavers/tcSavers'
import { StakePlugin } from './types'
import { makeUniV2StakePlugin } from './uniswapV2/uniV2Plugin'

export const makeStakePlugins = async (): Promise<StakePlugin[]> => {
  return Promise.all([await makeUniV2StakePlugin(), await makeTcSaversPlugin()])
}
