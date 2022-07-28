// @flow

import { add } from 'biggystring'
import { type EdgeAccount } from 'edge-core-js'
import * as React from 'react'

import { AirshipToast } from '../../components/common/AirshipToast'
import { Airship } from '../../components/services/AirshipInstance'
import { queryBorrowPlugins } from '../../plugins/helpers/borrowPluginHelpers'
import { getCurrencyCode } from '../../util/CurrencyInfoHelpers'
import { snooze } from '../../util/utils'
import { type ActionEffect, type ActionProgram, type ActionProgramState, type ExecutionResult, type ExecutionResults } from './types'

export const executeActionProgram = async (account: EdgeAccount, program: ActionProgram, state: ActionProgramState): Promise<ExecutionResults> => {
  const { effect } = state

  // TODO: dry-run program

  // Await Effect
  while (true) {
    if (effect == null) break

    const isEffective = await checkActionEffect(account, effect)
    if (isEffective) break

    await delayForEffect(effect)
  }

  // Execute Action
  const { effect: nextEffect } = await executeActionOp(account, program, state)

  // Return next state
  return {
    nextState: { ...state, effect: nextEffect }
  }
}

async function checkActionEffect(account: EdgeAccount, effect: ActionEffect): Promise<boolean> {
  switch (effect.type) {
    case 'seq': {
      return await checkActionEffect(account, effect.childEffect)
    }
    case 'par': {
      const promises = effect.childEffects.map(async (childEffect, index) => {
        return await checkActionEffect(account, childEffect)
      })
      return (await Promise.all(promises)).every(yes => yes)
    }
    case 'unixtime': {
      return Date.now() >= effect.timestamp
    }
    case 'done': {
      if (effect.error != null) throw effect.error
      return true
    }
    default:
      throw new Error(`No implementation for effect type ${effect.type}`)
  }
}

async function executeActionOp(account: EdgeAccount, program: ActionProgram, state: ActionProgramState): Promise<ExecutionResult> {
  const { actionOp } = program
  const { effect } = state

  switch (actionOp.type) {
    case 'seq': {
      const opIndex = effect != null && effect.type === 'seq' ? effect.opIndex + 1 : 0
      // Handle done case
      if (opIndex > actionOp.actions.length - 1) {
        return {
          effect: { type: 'done' }
        }
      }
      const nextProgram = {
        programId: `${program.programId}[${opIndex}]`,
        actionOp: actionOp.actions[opIndex]
      }
      const childResult = await executeActionOp(account, nextProgram, state)
      return {
        effect: {
          type: 'seq',
          opIndex,
          childEffect: childResult.effect
        }
      }
    }
    case 'par': {
      const promises = actionOp.actions.map(async (actionOp, index) => {
        const programId = `${program.programId}(${index})`
        const subProgram: ActionProgram = { programId, actionOp }
        return await executeActionOp(account, subProgram, state)
      })
      const childResults = await Promise.all(promises)
      return {
        effect: {
          type: 'par',
          childEffects: childResults.map(result => result.effect)
        }
      }
    }

    case 'exchange-buy': {
      const { exchangePluginId, nativeAmount, tokenId, walletId } = actionOp
      const wallet = account.currencyWallets[walletId]
      const currencyCode = getCurrencyCode(wallet, tokenId)

      // TODO: Remove this
      await Airship.show(bridge => <AirshipToast bridge={bridge} message={`Buy ${nativeAmount} ${currencyCode} on ${exchangePluginId}`} />)
      return {
        effect: { type: 'unixtime', timestamp: Date.now() + 3000 }
      }

      // TOOD: Use exchange plugin ID to do an exchange buy
      // TODO: Return this effect
      // return {
      //   type: 'balance',
      //   address: destAddress,
      //   aboveAmount: expectedNativeBalance,
      //   walletId: string,
      //   tokenId
      // }
    }
    case 'exchange-sell': {
      const { exchangePluginId, nativeAmount, tokenId, walletId } = actionOp
      const wallet = account.currencyWallets[walletId]
      const currencyCode = getCurrencyCode(wallet, tokenId)

      // TODO: Remove this
      await Airship.show(bridge => <AirshipToast bridge={bridge} message={`Buy ${nativeAmount} ${currencyCode} on ${exchangePluginId}`} />)
      return {
        effect: { type: 'unixtime', timestamp: Date.now() + 3000 }
      }

      // TOOD: Use exchange plugin ID to do an exchange sell
      // 1. Fetch address for currencyCode from https://api.sendwyre.com/v2/paymentMethods
      // 2. Send native amount to address
      // 3. Return this effect:
      // return {
      //   type: 'tx-confs',
      //   txId,
      //   walletId,
      //   confirmations: 1
      // }
    }
    case 'loan-borrow': {
      const { borrowPluginId, nativeAmount, walletId, tokenId } = actionOp

      const wallet = account.currencyWallets[walletId]
      if (wallet == null) throw new Error(`Wallet '${walletId}' not found`)

      // Get the borrow-plugin
      const borrowPlugin = queryBorrowPlugins({ borrowPluginId })[0]

      if (borrowPlugin == null) throw new Error(`Borrow plugin '${borrowPluginId}' not found`)

      // Make borrow engine for wallet
      const borrowEngine = await borrowPlugin.makeBorrowEngine(wallet)

      // Do the thing
      const approvableAction = await borrowEngine.borrow({ nativeAmount, tokenId })
      const txs = await approvableAction.approve()

      // Construct a tx-conf effect
      const txId = txs[txs.length - 1].txid
      return {
        effect: {
          type: 'tx-confs',
          txId,
          walletId,
          confirmations: 1
        }
      }
    }
    case 'loan-deposit': {
      const { borrowPluginId, nativeAmount, walletId, tokenId } = actionOp

      const wallet = account.currencyWallets[walletId]
      if (wallet == null) throw new Error(`Wallet '${walletId}' not found`)

      // Get the borrow-plugin
      const borrowPlugin = queryBorrowPlugins({ borrowPluginId })[0]

      if (borrowPlugin == null) throw new Error(`Borrow plugin '${borrowPluginId}' not found`)

      // Make borrow engine for wallet
      const borrowEngine = await borrowPlugin.makeBorrowEngine(wallet)

      // Do the thing
      const approvableAction = await borrowEngine.deposit({ nativeAmount, tokenId })
      const txs = await approvableAction.approve()

      // Construct a tx-conf effect
      const txId = txs[txs.length - 1].txid
      return {
        effect: {
          type: 'tx-confs',
          txId,
          walletId,
          confirmations: 1
        }
      }
    }
    case 'loan-repay': {
      const { borrowPluginId, nativeAmount, walletId, tokenId } = actionOp

      const wallet = account.currencyWallets[walletId]
      if (wallet == null) throw new Error(`Wallet '${walletId}' not found`)

      // Get the borrow-plugin
      const borrowPlugin = queryBorrowPlugins({ borrowPluginId })[0]

      if (borrowPlugin == null) throw new Error(`Borrow plugin '${borrowPluginId}' not found`)

      // Make borrow engine for wallet
      const borrowEngine = await borrowPlugin.makeBorrowEngine(wallet)

      // Do the thing
      const approvableAction = await borrowEngine.repay({ nativeAmount, tokenId })
      const txs = await approvableAction.approve()

      // Construct a tx-conf effect
      const txId = txs[txs.length - 1].txid
      return {
        effect: {
          type: 'tx-confs',
          txId,
          walletId,
          confirmations: 1
        }
      }
    }
    case 'loan-withdraw': {
      const { borrowPluginId, nativeAmount, walletId, tokenId } = actionOp

      const wallet = account.currencyWallets[walletId]
      if (wallet == null) throw new Error(`Wallet '${walletId}' not found`)

      // Get the borrow-plugin
      const borrowPlugin = queryBorrowPlugins({ borrowPluginId })[0]

      if (borrowPlugin == null) throw new Error(`Borrow plugin '${borrowPluginId}' not found`)

      // Make borrow engine for wallet
      const borrowEngine = await borrowPlugin.makeBorrowEngine(wallet)

      // Do the thing
      const approvableAction = await borrowEngine.withdraw({ nativeAmount, tokenId })
      const txs = await approvableAction.approve()

      // Construct a tx-conf effect
      const txId = txs[txs.length - 1].txid
      return {
        effect: {
          type: 'tx-confs',
          txId,
          walletId,
          confirmations: 1
        }
      }
    }
    case 'swap': {
      const { fromTokenId, fromWalletId, nativeAmount, toTokenId, toWalletId } = actionOp

      const fromWallet = account.currencyWallets[fromWalletId]
      if (fromWallet == null) throw new Error(`Wallet '${fromWalletId}' not found for fromWalletId`)

      const toWallet = account.currencyWallets[toWalletId]
      if (toWallet == null) throw new Error(`Wallet '${toWalletId}' not found for toWalletId`)

      const fromCurrencyCode = getCurrencyCode(fromWallet, fromTokenId)
      const toCurrencyCode = getCurrencyCode(toWallet, toTokenId)

      const swapQuote = await account.fetchSwapQuote({
        fromWallet,
        toWallet,
        fromCurrencyCode,
        toCurrencyCode,
        nativeAmount,
        quoteFor: 'from'
      })
      const swapResult = await swapQuote.approve()

      // TOOD: Enable this when we can query wallet address balances
      if (swapResult.destinationAddress) {
        // const currentAddressBalance = (await toWallet.getReceiveAddress({ currencyCode: toCurrencyCode })).nativeAmount
        // const aboveAmount = add(currentAddressBalance, swapQuote.toNativeAmount)
        // return {
        //   type: 'balance',
        //   address: swapResult.destinationAddress,
        //   aboveAmount,
        //   walletId: toWalletId,
        //   tokenId: toTokenId
        // }
      }

      // Fallback to wallet balance:
      const walletBalance = toWallet.balances[toCurrencyCode] ?? '0'
      const aboveAmount = add(walletBalance, swapQuote.toNativeAmount)
      return {
        effect: {
          type: 'address-balance',
          address: '',
          aboveAmount,
          walletId: toWalletId,
          tokenId: toTokenId
        }
      }
    }
    case 'toast': {
      await Airship.show(bridge => <AirshipToast bridge={bridge} message={actionOp.message} />)
      // Delay for 3 seconds because that's how long toasts last
      return {
        effect: { type: 'unixtime', timestamp: Date.now() + 3000 }
      }
    }
    case 'delay': {
      return {
        effect: { type: 'unixtime', timestamp: Date.now() + actionOp.ms }
      }
    }
    default:
      throw new Error(`No implementation for effect type ${actionOp.type} at ${program.programId}`)
  }
}

async function delayForEffect(effect: ActionEffect): Promise<void> {
  const ms = (() => {
    switch (effect.type) {
      case 'unixtime':
        return 300
      default:
        return 0
    }
  })()
  await snooze(ms)
}
