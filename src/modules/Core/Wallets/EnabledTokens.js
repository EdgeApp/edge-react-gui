// @flow

import type { EdgeCurrencyWallet } from 'edge-core-js'

const ENABLED_TOKENS_FILENAME = 'EnabledTokens.json'

export const getEnabledTokensFromFile = async (wallet: EdgeCurrencyWallet): Promise<any[]> => {
  try {
    const tokensText = await wallet.disklet.getText(ENABLED_TOKENS_FILENAME)
    const tokens = JSON.parse(tokensText)
    return tokens
  } catch (e) {
    console.log(e)
    return []
  }
}

export async function setEnabledTokens(wallet: EdgeCurrencyWallet, tokens: string[], tokensToDisable?: string[]) {
  // initialize array for eventual setting of file
  const finalTextArray = [...tokens]
  // now stringify the new tokens
  const stringifiedTokens = JSON.stringify(finalTextArray)
  // grab the enabledTokensFile
  await wallet.disklet.setText(ENABLED_TOKENS_FILENAME, stringifiedTokens)
  wallet.changeEnabledTokens(tokens)
  if (tokensToDisable && tokensToDisable.length > 0) {
    wallet.disableTokens(tokensToDisable)
  }
  return tokens
}

export async function updateEnabledTokens(wallet: EdgeCurrencyWallet, tokensToEnable: string[], tokensToDisable: string[]) {
  try {
    const tokensText = await wallet.disklet.getText(ENABLED_TOKENS_FILENAME)
    const enabledTokens = JSON.parse(tokensText)
    const tokensWithNewTokens = [...new Set([...tokensToEnable, ...enabledTokens])]
    const finalTokensToEnable = tokensWithNewTokens.filter(token => !tokensToDisable.includes(token))
    await wallet.changeEnabledTokens(finalTokensToEnable)
    await wallet.disableTokens(tokensToDisable)
    await wallet.disklet.setText(ENABLED_TOKENS_FILENAME, JSON.stringify(finalTokensToEnable))
  } catch (e) {
    console.log(e)
  }
}
