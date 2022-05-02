// @flow

import { type EdgeCurrencyConfig, type EdgeTokenMap } from 'edge-core-js'

import { useEffect, useMemo, useState } from '../types/reactHooks'

/**
 * Subscribes to the custom tokens on a wallet,
 * returning those merged with the builtin tokens.
 */
export function useTokens(currencyConfig: EdgeCurrencyConfig): {
  allTokens: EdgeTokenMap,
  builtinTokens: EdgeTokenMap,
  customTokens: EdgeTokenMap
} {
  const [builtinTokens, setBuiltinTokens] = useState<EdgeTokenMap>(currencyConfig.builtinTokens ?? {})
  const [customTokens, setCustomTokens] = useState<EdgeTokenMap>(currencyConfig.customTokens ?? {})

  useEffect(() => {
    const cleanups = [currencyConfig.watch('builtinTokens', setBuiltinTokens), currencyConfig.watch('customTokens', setCustomTokens)]
    return () => cleanups.forEach(cleanup => cleanup())
  }, [currencyConfig])

  const allTokens = useMemo(() => ({ ...customTokens, ...builtinTokens }), [builtinTokens, customTokens])

  return { allTokens, builtinTokens, customTokens }
}
