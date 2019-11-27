// @flow

import type { EdgeCurrencyWallet } from 'edge-core-js'
import _ from 'lodash'
const ENABLED_TOKENS_FILENAME = 'EnabledTokens.json'

export const getEnabledTokensFromFile = async (wallet: EdgeCurrencyWallet): Promise<Array<any>> => {
  try {
    const tokensText = await wallet.disklet.getText(ENABLED_TOKENS_FILENAME)
    const tokens = JSON.parse(tokensText)
    return tokens
  } catch (e) {
    console.log(e)
    return setEnabledTokens(wallet, [])
  }
}

export async function setEnabledTokens (wallet: EdgeCurrencyWallet, tokens: Array<string>, tokensToDisable?: Array<string>) {
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

export async function updateEnabledTokens (wallet: EdgeCurrencyWallet, tokensToEnable: Array<string>, tokensToDisable: Array<string>) {
  try {
    const tokensText = await wallet.disklet.getText(ENABLED_TOKENS_FILENAME)
    const enabledTokens = JSON.parse(tokensText)
    const tokensWithNewTokens = _.union(tokensToEnable, enabledTokens)
    const finalTokensToEnable = _.difference(tokensWithNewTokens, tokensToDisable)
    await wallet.changeEnabledTokens(finalTokensToEnable)
    await wallet.disableTokens(tokensToDisable)
    await wallet.disklet.setText(ENABLED_TOKENS_FILENAME, JSON.stringify(finalTokensToEnable))
  } catch (e) {
    console.log(e)
  }
}
