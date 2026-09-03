import type { EdgeAccount } from 'edge-core-js'

import { showError } from '../components/services/AirshipInstance'
import { EDGE_CONTENT_SERVER_URI } from '../constants/CdnConstants'
import { lstrings } from '../locales/strings'
import type { ThunkAction } from '../types/reduxTypes'
import type { EdgeCategory } from '../util/txDisplay'

export type { Category, EdgeCategory } from '../util/txDisplay'
export {
  getTxActionDisplayInfo,
  joinCategory,
  splitCategory
} from '../util/txDisplay'
export type { ActionDisplayInfo } from '../util/txDisplay'

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

export function setNewSubcategory(
  newSubcategory: string
): ThunkAction<Promise<void>> {
  return async (dispatch, getState) => {
    const state = getState()
    const { account } = state.core
    const oldSubcats = state.ui.subcategories
    const newSubcategories = [...oldSubcats, newSubcategory]
    await writeSyncedSubcategories(account, {
      categories: newSubcategories.sort()
    })
      .then(() => {
        dispatch({
          type: 'SET_TRANSACTION_SUBCATEGORIES',
          data: { subcategories: newSubcategories.sort() }
        })
      })
      .catch((error: unknown) => {
        showError(error)
      })
  }
}

/**
 * Localizes a category string for display.
 */
export function formatCategory(split: EdgeCategory): string {
  if (split.subcategory === '') return displayCategories[split.category]
  return `${displayCategories[split.category]}:${split.subcategory}`
}

export interface CategoriesFile {
  categories: string[]
}

async function writeSyncedSubcategories(
  account: EdgeAccount,
  subcategories: CategoriesFile
): Promise<void> {
  const stringifiedSubcategories = JSON.stringify(subcategories)
  try {
    await account.disklet.setText(CATEGORIES_FILENAME, stringifiedSubcategories)
  } catch (error: any) {
    showError(error)
  }
}

async function readSyncedSubcategories(
  account: EdgeAccount
): Promise<string[]> {
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

export const pluginIdIcons: Record<string, string> = {
  '0xgasless': EDGE_CONTENT_SERVER_URI + '/0xgasless.png',
  bitrefill: EDGE_CONTENT_SERVER_URI + '/bitrefill.png',
  bitsofgold: EDGE_CONTENT_SERVER_URI + '/bits-of-gold-logo.png',
  bridgeless: EDGE_CONTENT_SERVER_URI + '/bridgeless.png',
  changenow: EDGE_CONTENT_SERVER_URI + '/changenow.png',
  changehero: EDGE_CONTENT_SERVER_URI + '/changehero.png',
  changelly: EDGE_CONTENT_SERVER_URI + '/changelly.png',
  cosmosibc: EDGE_CONTENT_SERVER_URI + '/cosmosibc.png',
  exolix: EDGE_CONTENT_SERVER_URI + '/exolix-logo.png',
  fantomsonicupgrade: EDGE_CONTENT_SERVER_URI + '/fantomsonicupgrade.png',
  godex: EDGE_CONTENT_SERVER_URI + '/godex.png',
  letsexchange: EDGE_CONTENT_SERVER_URI + '/letsexchange-logo.png',
  lifi: EDGE_CONTENT_SERVER_URI + '/lifi.png',
  mayaprotocol: EDGE_CONTENT_SERVER_URI + '/mayaprotocol.png',
  nexchange: EDGE_CONTENT_SERVER_URI + '/exchangeIcons/nexchange/icon.png',
  nymswap: EDGE_CONTENT_SERVER_URI + '/exchangeIcons/nymswap/icon.png',
  rango: EDGE_CONTENT_SERVER_URI + '/rango.png',
  sideshift: EDGE_CONTENT_SERVER_URI + '/sideshift-logo.png',
  simplex: EDGE_CONTENT_SERVER_URI + '/simplex.png',
  swapter: EDGE_CONTENT_SERVER_URI + '/exchangeIcons/swapter/icon.png',
  swapuz: EDGE_CONTENT_SERVER_URI + '/swapuz.png',
  thorchain: EDGE_CONTENT_SERVER_URI + '/thorchain.png',
  unizen: EDGE_CONTENT_SERVER_URI + '/unizen.png',
  swapkit: EDGE_CONTENT_SERVER_URI + '/swapkit.png',
  tronResources: EDGE_CONTENT_SERVER_URI + '/TRON/TRON.png',
  velodrome: EDGE_CONTENT_SERVER_URI + '/velodrome.png',
  xgram: EDGE_CONTENT_SERVER_URI + '/xgram.png',
  xrpdex: EDGE_CONTENT_SERVER_URI + '/xrpdex.png'
}
