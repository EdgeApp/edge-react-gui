import { makeTcSaversPlugin } from './thorchainSavers/tcSavers'
import { StakePlugin } from './types'
import { makeUniV2StakePlugin } from './uniswapV2/uniV2Plugin'

export const makeStakePlugins = async (): Promise<StakePlugin[]> => {
  const results = await Promise.all([
    makeUniV2StakePlugin().catch(e => {
      console.warn(e.message)
    }),
    makeTcSaversPlugin().catch(e => {
      console.warn(e.message)
    })
  ])
  const out: StakePlugin[] = []
  results.forEach(result => {
    if (result != null) out.push(result)
  })
  return out
}
