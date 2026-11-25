import {
  asArray,
  asJSON,
  asObject,
  asOptional,
  asString,
  uncleaner
} from 'cleaners'
import type { EdgeAccount } from 'edge-core-js'

import { showError } from '../components/services/AirshipInstance'
import { EDGE_CONTENT_SERVER_URI } from '../constants/CdnConstants'
import { lstrings } from '../locales/strings'
import type { ThunkAction } from '../types/reduxTypes'
import type { Theme } from '../types/Theme'
import { getSwapPluginIconUri, hasThemedSwapPluginIcon } from '../util/CdnUris'
import { errorMessage } from '../util/errorMessage'
import { isContentFailure, isMissingFile } from '../util/predicates'
import { reportWarning } from '../util/reportWarning'
import { serializeByKey } from '../util/serializeByKey'
import {
  asPlainObjectValue,
  readSyncedFileForWrite
} from '../util/syncedFileForWrite'
import type { Category, EdgeCategory } from '../util/txDisplay'

// No re-exports of the Node-safe helpers. This module imports `showError`
// from Airship, so re-exporting them would make it the public door to code
// that exists precisely so it can load without react-native. Callers import
// from `util/txDisplay` directly.

/**
 * Which string key names each category, by name rather than by value.
 *
 * The keys are static and only the values must be read late: `applyLocale`
 * mutates `lstrings` in place, so a module-scope capture of the four
 * *strings* is right only if the locale boot happened to run first, and the
 * module that runs it is one nothing here imports. A table of key names is
 * both — one static object, and an indexed read that happens at call time.
 * `src/util/txDisplay/txActionLabels.ts` holds the same shape for the same
 * reason.
 */
const CATEGORY_KEYS: Record<Category, keyof typeof lstrings> = {
  transfer: 'fragment_transaction_transfer',
  exchange: 'fragment_transaction_exchange',
  expense: 'fragment_transaction_expense',
  income: 'fragment_transaction_income'
}

/**
 * One category's name in the user's language.
 *
 * What the readers on a render path want, and all they want:
 * `formatCategory` is called once per visible transaction row while a list
 * scrolls, and `CategoryModal`'s subcategory memo calls it once per entry of
 * `state.ui.subcategories` — 116 of them on an account that has never edited
 * the list — on every keystroke in the field. Rebuilding a four-key literal
 * and reading all four strings to hand back one of them would be that work
 * times four.
 */
export function categoryName(category: Category): string {
  return lstrings[CATEGORY_KEYS[category]]
}

/**
 * All four names, for a caller that shows all four.
 *
 * `CategoryModal`'s row of buttons, once per render. Still a function, not a
 * module-scope object, for the `applyLocale` reason above.
 */
export const displayCategories = (): Record<Category, string> => ({
  transfer: categoryName('transfer'),
  exchange: categoryName('exchange'),
  expense: categoryName('expense'),
  income: categoryName('income')
})

const CATEGORIES_FILENAME = 'Categories.json'

/**
 * Load the account's synced subcategory list into Redux.
 *
 * Inside the same serialization key as `setNewSubcategory`, so the two
 * dispatches are ordered against each other. `CategoryModal` fires this on
 * mount and leaves its rows tappable for the whole disklet round trip, so a
 * mount read that resolves *after* an add has written and dispatched would
 * otherwise overwrite Redux with the pre-add list: the row the user just
 * created would disappear from `state.ui.subcategories` while the synced
 * file holds it, and on the next open `handleCategoryUpdate`'s
 * `categories.includes` gate would fail and write the same entry again.
 */
export function getSubcategories(): ThunkAction<Promise<void>> {
  return async (dispatch, getState) => {
    const { account } = getState().core
    const subcategories = await serializeByKey(
      `categories:${account.rootLoginId}`,
      async () =>
        await readSyncedSubcategories(account).catch((error: unknown) => {
          // A file that will not parse still leaves the modal its 116
          // standard rows; refusing would leave it empty, on every device,
          // with nothing that would ever repair it. What the first add then
          // does depends on why it could not be read:
          // `readSubcategoriesForWrite`.
          if (!isContentFailure(error)) throw error
          reportWarning(
            `Could not read ${CATEGORIES_FILENAME}, showing the defaults: ${errorMessage(
              error
            )}`
          )
          return [...defaultCategories]
        })
    )
    // Only when the list changed. Every `CategoryModal` mount reads the
    // file, and the common answer is the list Redux already holds, as a
    // fresh array each time; dispatching it would re-render the modal and
    // rebuild its 116 sorted rows for nothing.
    if (sameStrings(getState().ui.subcategories, subcategories)) return
    dispatch({
      type: 'SET_TRANSACTION_SUBCATEGORIES',
      data: { subcategories }
    })
  }
}

/** Element-wise equality, order included: the list's order is its own. */
function sameStrings(a: readonly string[], b: readonly string[]): boolean {
  return a.length === b.length && a.every((item, i) => item === b[i])
}

/**
 * Add one subcategory to the account's synced list.
 *
 * Re-reads `Categories.json` and merges into what is on disk, rather than
 * into `state.ui.subcategories`. The redux copy is only as good as the read
 * that filled it, and a read that *failed* leaves it at the reducer's
 * initial `[]` — `getSubcategories` rejects, `useAsyncEffect` shows the
 * error, and the modal stays open on an empty list. Writing that back would
 * replace the user's whole synced list with one entry.
 *
 * A file that is there but cannot be read is handled by why, in
 * `readSubcategoriesForWrite`: text that is not a JSON object even after a
 * sync is kept as `Categories.json.unreadable-<ms>` and the list starts
 * again from the defaults; a list this version cannot read, or a file that
 * will not decrypt or be read, is refused with the file untouched.
 * Refusing every unreadable file would be a one-way door: nothing rewrites
 * it, so every add would fail on every device for good.
 */
export function setNewSubcategory(
  newSubcategory: string
): ThunkAction<Promise<void>> {
  return async (dispatch, getState) => {
    const { account } = getState().core
    try {
      // Serialized, because the re-read alone is not enough: two of these
      // interleaving would both see the same on-disk list, each merge its
      // own entry, and the later `setText` would win. `CategoryModal`'s rows
      // have no in-flight guard and the modal stays tappable for a whole
      // disklet round trip, so a second tap would lose one of the two
      // entries from the user's synced list with nothing shown. It is the
      // same whole-file read-modify-write that `exportTxInfo.json` and
      // `Settings.json` are serialized for.
      const merged = await serializeByKey(
        `categories:${account.rootLoginId}`,
        async () => {
          const onDisk = await readSubcategoriesForWrite(account)
          const next = [...new Set([...onDisk, newSubcategory])].sort()
          await writeSyncedSubcategories(account, { categories: next })
          return next
        }
      )
      dispatch({
        type: 'SET_TRANSACTION_SUBCATEGORIES',
        data: { subcategories: merged }
      })
    } catch (error: unknown) {
      showError(error)
    }
  }
}

/**
 * Localizes a category string for display.
 */
export function formatCategory(split: EdgeCategory): string {
  const name = categoryName(split.category)
  if (split.subcategory === '') return name
  return `${name}:${split.subcategory}`
}

/**
 * The file's shape, from the cleaner that reads it.
 *
 * Derived rather than declared, so the file is described once and a shape
 * change is a compile error.
 */
export type CategoriesFile = ReturnType<typeof asCategoriesFile>

async function writeSyncedSubcategories(
  account: EdgeAccount,
  subcategories: CategoriesFile
): Promise<void> {
  // Through the uncleaner: an `asJSON` cleaner's uncleaner returns the JSON
  // text, so this is the `JSON.stringify` and the shape check in one.
  //
  // No `catch`, so the caller dispatches `SET_TRANSACTION_SUBCATEGORIES`
  // only once the write has landed. Swallowing a failure here would show
  // the new subcategory as saved for the session while it is gone at the
  // next login and on every other device. The thunk's own `catch` shows the
  // error exactly once.
  await account.disklet.setText(
    CATEGORIES_FILENAME,
    wasCategoriesFile(subcategories)
  )
}

/**
 * `Categories.json`, with a list this version cannot read refused.
 *
 * Not `asMaybe(asArray(asString), defaultCategories)`: substituting the
 * defaults for a list with one bad entry is the same loss as substituting
 * them for an unreadable file, and it would happen silently. A `categories`
 * that is absent is the one case the defaults are right for, because that is
 * what a fresh account has.
 */
const asCategoriesInner = asObject({
  categories: asOptional(asArray(asString), () => [...defaultCategories])
})

/**
 * `asPlainObjectValue` before the shape, because `asObject` accepts an
 * array — the same object test the synced write door uses.
 *
 * Without it, `'[]'` and `'["Expense:Mine"]'` would clean to the 116
 * defaults and report a successful read of a fresh account's list. An
 * array is the likeliest shape for a half-synced file that is valid JSON
 * and not these settings, which is why `localAccountSettings.ts` guards
 * against it too, and the synced settings reads share this same check
 * (`asJsonObject`).
 */
const asCategoriesFile = asJSON((raw: unknown) =>
  asCategoriesInner(asPlainObjectValue(raw))
)
const wasCategoriesFile = uncleaner(asCategoriesFile)

/**
 * The account's synced subcategory list. A read, and only a read.
 *
 * An absent file is answered with the defaults, not seeded with them, so a
 * read cannot fail for a write's reason: on a fresh account whose repo
 * cannot be written, `CategoryModal` would otherwise render an empty list,
 * offering none of the 116 standard categories, on the screen whose whole
 * purpose is to offer them. The defaults need no file to produce.
 *
 * The file is created the first time there is something to put in it:
 * `setNewSubcategory` reads it, merges its entry and writes, inside the
 * `serializeByKey` key. `mergeExportTxInfo` is the same shape — its reader
 * never writes, and the absent-file arm lives inside the serialized block.
 *
 * Exported for its test: through `getSubcategories`, an absent file and one
 * that will not parse both show the defaults, so the difference is only
 * visible here.
 */
export async function readSyncedSubcategories(
  account: EdgeAccount
): Promise<string[]> {
  let text: string
  try {
    text = await account.disklet.getText(CATEGORIES_FILENAME)
  } catch (error: unknown) {
    // Only an absent file is answered with the defaults here. A decryption
    // or I/O failure on a file that is *there* must not read as a fresh
    // account's list: it goes to the caller, and only
    // `readSubcategoriesForWrite` decides what a write may do about it.
    // `isMissingFile` exists for this; `localAccountSettings.ts` and
    // `exportTxInfo.ts` both make this exact check.
    if (!isMissingFile(error)) throw error
    // A copy, not the module constant itself. `getSubcategories` dispatches
    // whatever this returns straight into `state.ui.subcategories`, so
    // returning the array would make Redux state an alias of a constant
    // every other importer shares: one in-place `.sort()` or `.push()` on a
    // selector result, now or later, would rewrite the defaults for the rest
    // of the process. Nothing mutates it today; the hazard is free to
    // remove.
    return [...defaultCategories]
  }
  // Cleaned, not `JSON.parse(text).categories`: a file that parses without
  // the key, `{}`, would put `undefined` into `SET_TRANSACTION_SUBCATEGORIES`
  // and so into `state.ui.subcategories`, which `uiReducer.ts` types
  // `string[]`, and `CategoryModal`'s `categories.map(...)` would throw on
  // open.
  return asCategoriesFile(text).categories
}

/**
 * The base a write starts from: `readSyncedFileForWrite`'s policy, shared
 * with the synced `Settings.json`, then this file's own cleaner.
 *
 * Absent, or kept aside because it was not a JSON object even after a
 * sync: the defaults. An object whose `categories` is not a list of strings
 * is refused by the cleaner, so the add fails rather than replacing a list
 * another version wrote; a read shows the defaults in that case
 * (`getSubcategories`). A file that will not decrypt, or cannot be read, is
 * refused with the file untouched.
 *
 * One reader for the bytes: `asCategoriesFile`, the same cleaner
 * `readSyncedSubcategories` uses, so the two cannot disagree about what a
 * categories file is.
 */
async function readSubcategoriesForWrite(
  account: EdgeAccount
): Promise<string[]> {
  const base = await readSyncedFileForWrite(account, CATEGORIES_FILENAME)
  if (base.kind !== 'text') return [...defaultCategories]
  return asCategoriesFile(base.text).categories
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

const pluginIdIcons: Record<string, string> = {
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

export interface PluginIdIcon {
  uri: string

  /**
   * True for a full logo with its own outline, which a thumbnail must fit
   * whole. False for an image drawn to be cropped to a circle.
   */
  fit: boolean
}

/**
 * The provider logo for a transaction. A provider whose logo is a single-color
 * mark uses the logo the swap scenes show: it follows the theme, so it stays
 * visible on a light background, and it is fitted instead of cropped. Every
 * other provider has one static image drawn for the circular thumbnail.
 */
export function getPluginIdIcon(
  pluginId: string | undefined,
  theme: Theme
): PluginIdIcon | undefined {
  if (pluginId == null) return undefined
  if (hasThemedSwapPluginIcon(pluginId)) {
    return { uri: getSwapPluginIconUri(pluginId, theme), fit: true }
  }
  const uri = pluginIdIcons[pluginId]
  return uri == null ? undefined : { uri, fit: false }
}
