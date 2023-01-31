import { ENV } from '../../env'
import { makeTcSaversPlugin } from './thorchainSavers/tcSaversPlugin'
import { StakePlugin } from './types'
import { makeUniV2StakePlugin } from './uniswapV2/uniV2Plugin'

export const makeStakePlugins = async (): Promise<StakePlugin[]> => {
  const tcInitOptions = typeof ENV.THORCHAIN_INIT === 'object' ? ENV.THORCHAIN_INIT : {}

  if (Object.keys(tcInitOptions).length === 0) return []

  const results = await Promise.all([
    makeUniV2StakePlugin().catch(e => {
      console.warn(e.message)
    }),
    makeTcSaversPlugin({ initOptions: tcInitOptions }).catch(e => {
      console.warn(e.message)
    })
  ])
  const out: StakePlugin[] = []
  results.forEach(result => {
    if (result != null) out.push(result)
  })
  return out
}
