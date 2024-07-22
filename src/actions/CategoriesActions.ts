import { eq } from 'biggystring'
import { EdgeAccount, EdgeAssetAction, EdgeAssetAmount, EdgeCurrencyWallet, EdgeMetadata, EdgeTransaction, EdgeTxAction } from 'edge-core-js'
import { sprintf } from 'sprintf-js'

import { showError } from '../components/services/AirshipInstance'
import { EDGE_CONTENT_SERVER_URI } from '../constants/CdnConstants'
import { TX_ACTION_LABEL_MAP } from '../constants/txActionConstants'
import { lstrings } from '../locales/strings'
import { ThunkAction } from '../types/reduxTypes'
import { getCurrencyCodeWithAccount } from '../util/CurrencyInfoHelpers'
import { cleanFiatCurrencyCode } from '../util/CurrencyWalletHelpers'

export type Category = 'transfer' | 'exchange' | 'expense' | 'income'

export interface EdgeCategory {
  category: Category
  subcategory: string
}

/**
 * Use these strings to show categories in a user's language.
 */
export const displayCategories = {
  transfer: lstrings.fragment_transaction_transfer,
  exchange: lstrings.fragment_transaction_exchange,
  expense: lstrings.fragment_transaction_expense,
  income: lstrings.fragment_transaction_income
}

const CATEGORIES_FILENAME = 'Categories.json'

export function getSubcategories(): ThunkAction<Promise<void>> {
  return async (dispatch, getState) => {
    const { account } = getState().core
    const subcategories = await readSyncedSubcategories(account)
    dispatch({
      type: 'SET_TRANSACTION_SUBCATEGORIES',
      data: { subcategories }
    })
  }
}

export function setNewSubcategory(newSubcategory: string): ThunkAction<Promise<void>> {
  return async (dispatch, getState) => {
    const state = getState()
    const { account } = state.core
    const oldSubcats = state.ui.subcategories
    const newSubcategories = [...oldSubcats, newSubcategory]
    return await writeSyncedSubcategories(account, { categories: newSubcategories.sort() })
      .then(() => {
        dispatch({
          type: 'SET_TRANSACTION_SUBCATEGORIES',
          data: { subcategories: newSubcategories.sort() }
        })
      })
      .catch(error => showError(error))
  }
}

/**
 * Splits a string into its category and subcategory strings.
 * The category must fit our enum type, or we will use a fallback.
 * The subcategory can be localized and freely edited.
 */
export function splitCategory(fullCategory: string = '', defaultCategory: Category = 'income'): EdgeCategory {
  if (fullCategory.length > 0 && !fullCategory.includes(':')) {
    fullCategory += ':'
  }
  for (const [category, test, n] of tests) {
    if (test.test(fullCategory)) {
      return {
        category,
        subcategory: fullCategory.slice(n)
      }
    }
  }

  // We can't guarantee that data on disk is correct,
  // but this should usually never happen:
  return {
    category: defaultCategory,
    subcategory: fullCategory.replace(/^[^:]:/, '')
  }
}

/**
 * Combine the category and subcategory into a single string,
 * with the correct capitalization.
 */
export function joinCategory(split: EdgeCategory): string {
  return prefixes[split.category] + split.subcategory
}

/**
 * Localizes a category string for display.
 */
export function formatCategory(split: EdgeCategory): string {
  if (split.subcategory === '') return displayCategories[split.category]
  return `${displayCategories[split.category]}:${split.subcategory}`
}

/**
 * Internal prefixes used on disk.
 */
const prefixes = {
  transfer: 'Transfer:',
  exchange: 'Exchange:',
  expense: 'Expense:',
  income: 'Income:'
}

const tests: Array<[Category, RegExp, number]> = [
  ['transfer', /^Transfer:/i, 9],
  ['exchange', /^Exchange:/i, 9],
  ['expense', /^Expense:/i, 8],
  ['income', /^Income:/i, 7]
]

export interface CategoriesFile {
  categories: string[]
}

async function writeSyncedSubcategories(account: EdgeAccount, subcategories: CategoriesFile) {
  const stringifiedSubcategories = JSON.stringify(subcategories)
  try {
    await account.disklet.setText(CATEGORIES_FILENAME, stringifiedSubcategories)
  } catch (error: any) {
    showError(error)
  }
}

async function readSyncedSubcategories(account: EdgeAccount): Promise<string[]> {
  try {
    const text = await account.disklet.getText(CATEGORIES_FILENAME)
    const categoriesJson = JSON.parse(text)
    return categoriesJson.categories
  } catch (error) {
    // If Categories.json doesn't exist yet, create it, and return it
    await writeSyncedSubcategories(account, {
      categories: defaultCategories
    })
    return defaultCategories
  }
}

export const defaultCategories = [
  'Exchange:Buy Bitcoin',
  'Exchange:Sell Bitcoin',
  'Expense:Air Travel',
  'Expense:Alcohol & Bars',
  'Expense:Allowance',
  'Expense:Amusement',
  'Expense:Arts',
  'Expense:ATM Fee',
  'Expense:Auto & Transport',
  'Expense:Auto Insurance',
  'Expense:Auto Payment',
  'Expense:Baby Supplies',
  'Expense:Babysitter & Daycare',
  'Expense:Bank Fee',
  'Expense:Bills & Utilities',
  'Expense:Books',
  'Expense:Books & Supplies',
  'Expense:Car Wash',
  'Expense:Cash & ATM',
  'Expense:Charity',
  'Expense:Clothing',
  'Expense:Coffee Shops',
  'Expense:Credit Card Payment',
  'Expense:Dentist',
  'Expense:Deposit to Savings',
  'Expense:Doctor',
  'Expense:Education',
  'Expense:Electronics & Software',
  'Expense:Entertainment',
  'Expense:Eye Care',
  'Expense:Fast Food',
  'Expense:Fees & Charges',
  'Expense:Financial',
  'Expense:Financial Advisor',
  'Expense:Food & Dining',
  'Expense:Furnishings',
  'Expense:Gas & Fuel',
  'Expense:Gift',
  'Expense:Gifts & Donations',
  'Expense:Groceries',
  'Expense:Gym',
  'Expense:Hair',
  'Expense:Health & Fitness',
  'Expense:HOA Dues',
  'Expense:Hobbies',
  'Expense:Home',
  'Expense:Home Improvement',
  'Expense:Home Insurance',
  'Expense:Home Phone',
  'Expense:Home Services',
  'Expense:Home Supplies',
  'Expense:Hotel',
  'Expense:Interest Exp',
  'Expense:Internet',
  'Expense:IRA Contribution',
  'Expense:Kids',
  'Expense:Kids Activities',
  'Expense:Late Fee',
  'Expense:Laundry',
  'Expense:Lawn & Garden',
  'Expense:Life Insurance',
  'Expense:Misc.',
  'Expense:Mobile Phone',
  'Expense:Mortgage & Rent',
  'Expense:Mortgage Interest',
  'Expense:Movies & DVDs',
  'Expense:Music',
  'Expense:Network Fee',
  'Expense:Newspaper & Magazines',
  'Expense:Not Sure',
  'Expense:Parking',
  'Expense:Personal Care',
  'Expense:Pet Food & Supplies',
  'Expense:Pet Grooming',
  'Expense:Pets',
  'Expense:Pharmacy',
  'Expense:Property',
  'Expense:Public Transportation',
  'Expense:Registration',
  'Expense:Rental Car & Taxi',
  'Expense:Restaurants',
  'Expense:Service & Parts',
  'Expense:Service Fee',
  'Expense:Shopping',
  'Expense:Spa & Massage',
  'Expense:Sporting Goods',
  'Expense:Sports',
  'Expense:Student Loan',
  'Expense:Tax',
  'Expense:Television',
  'Expense:Tolls',
  'Expense:Toys',
  'Expense:Trade Commissions',
  'Expense:Travel',
  'Expense:Tuition',
  'Expense:Utilities',
  'Expense:Vacation',
  'Expense:Vet',
  'Income:Consulting Income',
  'Income:Div Income',
  'Income:Net Salary',
  'Income:Other Income',
  'Income:Rent',
  'Income:Sales',
  'Transfer:Airbitz',
  'Transfer:Bitcoin Core',
  'Transfer:Blockchain',
  'Transfer:Cash App',
  'Transfer:Coinbase',
  'Transfer:Gemini',
  'Transfer:Edge',
  'Transfer:Electrum',
  'Transfer:Exodus',
  'Transfer:Multibit',
  'Transfer:Mycelium',
  'Transfer:Dark Wallet'
]

/**
 * Given an EdgeTxAction, returns the display value for pre-filling the
 * 'Category' and 'Notes' tiles, if they are not already user-modified.
 */

export interface ActionDisplayInfo {
  direction: 'send' | 'receive'
  iconPluginId?: string
  userData: EdgeMetadata
  savedData: EdgeMetadata
  mergedData: EdgeMetadata
  action?: EdgeTxAction
  assetAction?: EdgeAssetAction
}

export const getTxActionDisplayInfo = (tx: EdgeTransaction, account: EdgeAccount, wallet: EdgeCurrencyWallet): ActionDisplayInfo => {
  const { assetAction, chainAction, chainAssetAction, metadata, savedAction, swapData, tokenId } = tx
  const { currencyConfig, currencyInfo } = wallet

  const { displayName } = tokenId == null ? currencyInfo : currencyConfig.allTokens[tokenId] ?? { displayName: '' }

  const action = savedAction ?? chainAction
  const assetAct = assetAction ?? chainAssetAction

  const getCurrencyCodes = (assets: EdgeAssetAmount[]) => assets.map(asset => getCurrencyCodeWithAccount(account, asset.pluginId, asset.tokenId))

  const isSentTransaction = tx.nativeAmount.startsWith('-') || (eq(tx.nativeAmount, '0') && tx.isSend)

  let payeeText: string | undefined
  let edgeCategory: EdgeCategory
  let direction: 'send' | 'receive'
  let notes: string | undefined
  let iconPluginId: string | undefined

  // Default text for send or receive
  if (isSentTransaction) {
    payeeText = sprintf(lstrings.transaction_sent_1s, displayName)
    direction = 'send'
    edgeCategory = {
      category: 'expense',
      subcategory: ''
    }
  } else {
    payeeText = sprintf(lstrings.transaction_received_1s, displayName)
    direction = 'receive'
    edgeCategory = {
      category: 'income',
      subcategory: ''
    }
  }

  // Override with swapData
  if (swapData != null) {
    const { payoutCurrencyCode } = swapData
    payeeText = sprintf(lstrings.transaction_details_swap_to_subcat_1s, payoutCurrencyCode)
  }

  if (action != null && assetAct != null) {
    const { actionType } = action
    const { assetActionType } = assetAct
    payeeText = TX_ACTION_LABEL_MAP[assetActionType]

    switch (actionType) {
      case 'swap': {
        iconPluginId = action.swapInfo.pluginId
        switch (assetActionType) {
          case 'transfer': {
            const txSrc = action.payoutWalletId !== wallet.id
            const toFromStr = txSrc ? lstrings.transaction_details_swap_to_subcat_1s : lstrings.transaction_details_swap_from_subcat_1s
            const walletName = account.currencyWallets[action.payoutWalletId]?.name ?? displayName
            edgeCategory = {
              category: 'transfer',
              subcategory: sprintf(toFromStr, walletName)
            }
            break
          }
          case 'transferNetworkFee':
          case 'swapNetworkFee': {
            edgeCategory = {
              category: 'expense',
              subcategory: lstrings.wc_smartcontract_network_fee
            }
            break
          }
          case 'swap':
          case 'swapOrderFill': {
            // Determine if the swap destination was to a different asset or if the
            // swap source was from a different asset.
            const txSrcSameAsset = action.fromAsset.tokenId === tokenId && action.fromAsset.pluginId === wallet.currencyInfo.pluginId
            const toFromStr = txSrcSameAsset ? lstrings.transaction_details_swap_to_subcat_1s : lstrings.transaction_details_swap_from_subcat_1s
            const otherAsset = txSrcSameAsset ? action.toAsset : action.fromAsset

            edgeCategory = {
              category: 'exchange',
              subcategory: sprintf(toFromStr, getCurrencyCodeWithAccount(account, otherAsset.pluginId, otherAsset.tokenId))
            }
            direction = txSrcSameAsset ? 'send' : 'receive'
            break
          }

          case 'swapOrderPost': {
            edgeCategory = {
              category: 'expense',
              subcategory: sprintf(lstrings.transaction_details_swap_order_post)
            }
            direction = 'send'
            break
          }
          case 'swapOrderCancel': {
            edgeCategory = {
              category: 'expense',
              subcategory: sprintf(lstrings.transaction_details_swap_order_cancel)
            }
            direction = 'send'
            break
          }
          default:
            console.error(`Unsupported EdgeTxAction assetAction:assetActionType: '${assetAction}:${assetActionType}'`)
        }
        break
      }
      case 'stake': {
        iconPluginId = action.pluginId
        switch (assetActionType) {
          case 'stake': {
            let subcategory
            if (action.stakeAssets.length === 1) subcategory = sprintf(lstrings.transaction_details_stake_subcat_1s, ...getCurrencyCodes(action.stakeAssets))
            else if (action.stakeAssets.length === 2)
              subcategory = sprintf(lstrings.transaction_details_stake_subcat_2s, ...getCurrencyCodes(action.stakeAssets))
            else {
              console.warn(`Unsupported number of assets for '${assetActionType}' EdgeTxActionSwapType`)
              break
            }
            edgeCategory = { category: 'transfer', subcategory }
            direction = 'send'
            break
          }
          case 'stakeOrder': {
            if (action.stakeAssets.length === 1) notes = sprintf(lstrings.transaction_details_unstake_order_notes_1s, ...getCurrencyCodes(action.stakeAssets))
            else if (action.stakeAssets.length === 2)
              notes = sprintf(lstrings.transaction_details_unstake_order_notes_2s, ...getCurrencyCodes(action.stakeAssets))
            else {
              console.error(`Unsupported number of assets for '${assetActionType}' EdgeTxActionSwapType`)
              break
            }

            edgeCategory = { category: 'expense', subcategory: lstrings.transaction_details_stake_order_subcat }
            direction = 'send'
            break
          }
          case 'claim':
          case 'unstake': {
            let subcategory
            if (action.stakeAssets.length === 1) subcategory = sprintf(lstrings.transaction_details_unstake_subcat_1s, ...getCurrencyCodes(action.stakeAssets))
            else if (action.stakeAssets.length === 2)
              subcategory = sprintf(lstrings.transaction_details_unstake_subcat_2s, ...getCurrencyCodes(action.stakeAssets))
            else {
              console.error(`Unsupported number of assets for '${assetActionType}' EdgeTxActionSwapType`)
              break
            }
            edgeCategory = { category: 'transfer', subcategory }
            direction = 'receive'
            break
          }
          case 'claimOrder':
          case 'unstakeOrder': {
            if (action.stakeAssets.length === 1) notes = sprintf(lstrings.transaction_details_unstake_order_notes_1s, ...getCurrencyCodes(action.stakeAssets))
            else if (action.stakeAssets.length === 2)
              notes = sprintf(lstrings.transaction_details_unstake_order_notes_2s, ...getCurrencyCodes(action.stakeAssets))
            else {
              console.error(`Unsupported number of assets for '${assetActionType}' EdgeTxActionSwapType`)
              break
            }

            edgeCategory = { category: 'expense', subcategory: lstrings.transaction_details_unstake_order }
            direction = 'send'
            break
          }
          case 'unstakeNetworkFee':
          case 'stakeNetworkFee': {
            edgeCategory = {
              category: 'expense',
              subcategory: lstrings.wc_smartcontract_network_fee
            }
            break
          }

          default:
            console.error(`Unsupported EdgeTxAction assetAction:assetActionType: '${assetAction}:${assetActionType}'`)
        }
        break
      }
      case 'fiat': {
        iconPluginId = action.fiatPlugin.providerId
        switch (assetActionType) {
          case 'buy': {
            payeeText = sprintf(payeeText, displayName)
            const { fiatAsset } = action
            const { fiatCurrencyCode } = cleanFiatCurrencyCode(fiatAsset.fiatCurrencyCode)
            edgeCategory = { category: 'exchange', subcategory: sprintf(lstrings.transaction_details_swap_from_subcat_1s, fiatCurrencyCode) }
            direction = 'receive'
            break
          }
          case 'sell': {
            payeeText = sprintf(payeeText, displayName)
            const { fiatAsset } = action
            const { fiatCurrencyCode } = cleanFiatCurrencyCode(fiatAsset.fiatCurrencyCode)
            edgeCategory = { category: 'exchange', subcategory: sprintf(lstrings.transaction_details_swap_to_subcat_1s, fiatCurrencyCode) }
            direction = 'send'
            break
          }
          case 'sellNetworkFee': {
            edgeCategory = { category: 'expense', subcategory: lstrings.wc_smartcontract_network_fee }
            direction = 'send'
            break
          }
          default:
            console.error(`Unsupported EdgeTxAction assetAction:assetActionType: '${assetAction}:${assetActionType}'`)
        }
        break
      }
      default:
        console.error(`Unsupported EdgeTxAction assetAction: '${assetAction}'`)
    }
  }
  const savedData: EdgeMetadata = {
    name: payeeText,
    category: joinCategory(edgeCategory),
    notes
  }

  const mergedData: EdgeMetadata = {
    name: metadata?.name != null && metadata.name.length > 0 ? metadata.name : savedData.name,
    category: metadata?.category != null && metadata.category.length > 0 ? metadata.category : savedData.category,
    notes: metadata?.notes != null && metadata.notes.length > 0 ? metadata.notes : savedData.notes
  }

  return {
    action,
    assetAction,
    direction,
    iconPluginId,
    savedData,
    userData: metadata ?? {},
    mergedData
  }
}

export const pluginIdIcons: Record<string, string> = {
  '0xgasless': EDGE_CONTENT_SERVER_URI + '/0xgasless.png',
  bitrefill: EDGE_CONTENT_SERVER_URI + '/bitrefill.png',
  bitsofgold: EDGE_CONTENT_SERVER_URI + '/bits-of-gold-logo.png',
  changenow: EDGE_CONTENT_SERVER_URI + '/changenow.png',
  changehero: EDGE_CONTENT_SERVER_URI + '/changehero.png',
  cosmosibc: EDGE_CONTENT_SERVER_URI + '/cosmosibc.png',
  exolix: EDGE_CONTENT_SERVER_URI + '/exolix-logo.png',
  godex: EDGE_CONTENT_SERVER_URI + '/godex.png',
  letsexchange: EDGE_CONTENT_SERVER_URI + '/letsexchange-logo.png',
  lifi: EDGE_CONTENT_SERVER_URI + '/lifi.png',
  rango: EDGE_CONTENT_SERVER_URI + '/rango.png',
  sideshift: EDGE_CONTENT_SERVER_URI + '/sideshift-logo.png',
  simplex: EDGE_CONTENT_SERVER_URI + '/simplex.png',
  swapuz: EDGE_CONTENT_SERVER_URI + '/swapuz.png',
  thorchain: EDGE_CONTENT_SERVER_URI + '/thorchain.png',
  thorchainda: EDGE_CONTENT_SERVER_URI + '/thorchain.png',
  tronResources: EDGE_CONTENT_SERVER_URI + '/TRON/TRON.png',
  velodrome: EDGE_CONTENT_SERVER_URI + '/velodrome.png',
  xrpdex: EDGE_CONTENT_SERVER_URI + '/xrpdex.png'
}
