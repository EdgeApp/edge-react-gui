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
import {
  isContentFailure,
  isMissingFile,
  isPlainObject
} from '../util/predicates'
import { reportWarning } from '../util/reportWarning'
import { serializeByKey } from '../util/serializeByKey'
import type { Category, EdgeCategory } from '../util/txDisplay'

// No re-exports of the Node-safe helpers. This module imports `showError`
// from Airship, so re-exporting them made it the public door to code that
// exists precisely so it can load without react-native. Callers import from
// `util/txDisplay` directly.

/**
 * Which string key names each category, by name rather than by value.
 *
 * The keys are static and only the values must be read late: `applyLocale`
 * mutates `lstrings` in place, so a module-scope capture of the four
 * *strings* is right only if the locale boot happened to run first, and the
 * module that runs it is one nothing here imports. A table of key names is
 * both — one static object, and an indexed read that happens at call time.
 * `src/util/txDisplay/txActionLabels.ts` holds the same shape for the same
 * reason, with the measurement that chose it.
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
 * and reading all four strings to hand back one of them was that work times
 * four.
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
 * mount read that resolved *after* an add had written and dispatched
 * overwrote Redux with the pre-add list: the row the user had just created
 * disappeared from `state.ui.subcategories` while the synced file held it,
 * and on the next open `handleCategoryUpdate`'s `categories.includes` gate
 * failed and wrote the same entry again. The file was right and the Redux
 * copy stale — the same "one update silently discards another's" the
 * serialization was added for, arriving on the read side.
 */
export function getSubcategories(): ThunkAction<Promise<void>> {
  return async (dispatch, getState) => {
    const { account } = getState().core
    const subcategories = await serializeByKey(
      `categories:${account.rootLoginId}`,
      async () =>
        await readSyncedSubcategories(account).catch((error: unknown) => {
          // A file that will not parse still leaves the modal its 116
          // standard rows; refusing left it empty, on every device, with
          // nothing that would ever repair it. The first add moves the
          // unreadable file aside (`readSubcategoriesForWrite`).
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
    // file, and the common answer is the list Redux already holds — a fresh
    // array each time, which re-rendered the modal and rebuilt its 116
    // sorted rows for nothing. The brief's rule: no dispatch when the
    // derived state has not changed.
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
 * initial `[]` — `getSubcategories` rejects, `useAsyncEffect` turns that
 * into a toast, and the modal stays open on an empty list. Writing that back
 * replaced the user's whole synced list with one entry, which is the loss
 * the strict read was added to prevent, arriving through the other door.
 *
 * A present-but-unreadable file is not written over: its bytes are copied
 * to `Categories.json.unreadable-<ms>` first, on the same synced repo, and
 * the list starts again from the defaults — the way out
 * `LocalSettingsActions.ts` takes for `Settings.json`. Refusing instead was
 * a one-way door: nothing rewrote the file, so every add failed and every
 * device showed an empty list for good.
 */
export function setNewSubcategory(
  newSubcategory: string
): ThunkAction<Promise<void>> {
  return async (dispatch, getState) => {
    const { account } = getState().core
    try {
      // Serialized, because the re-read above is only half the fix: two of
      // these interleave and both see the same on-disk list, each merges
      // its own entry, and the later `setText` wins. `CategoryModal`'s rows
      // have no in-flight guard and the modal stays tappable for a whole
      // disklet round trip, so a second tap loses one of the two entries
      // from the user's synced list with nothing shown — the same
      // whole-file read-modify-write `exportTxInfo.json` and `Settings.json`
      // already go through this for.
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
 * Declared rather than derived, a hand-written interface beside the cleaner
 * described the same file twice; a shape change is a compile error now.
 */
export type CategoriesFile = ReturnType<typeof asCategoriesFile>

async function writeSyncedSubcategories(
  account: EdgeAccount,
  subcategories: CategoriesFile
): Promise<void> {
  // Through the uncleaner, like every other file this CLI writes — an
  // `asJSON` cleaner's uncleaner returns the JSON text, so this is the
  // `JSON.stringify` and the shape check in one.
  //
  // No `catch`. It had one, which called `showError` and resolved, so the
  // caller dispatched `SET_TRANSACTION_SUBCATEGORIES` whether or not
  // anything reached the synced repo: the new subcategory showed as saved,
  // survived the session, and was gone at the next login and on every other
  // device. The thunk's own `catch` shows the error exactly once.
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
 * them for an unreadable file, and it happened silently. A `categories` that
 * is absent is the one case the defaults are right for, because that is what
 * a fresh account has.
 */
const asCategoriesInner = asObject({
  categories: asOptional(asArray(asString), () => [...defaultCategories])
})

/**
 * `isPlainObject` before the shape, because `asObject` accepts an array.
 *
 * The third reader of this pattern, and the one the guard was not added to.
 * `'[]'` and `'["Expense:Mine"]'` cleaned to the 116 defaults and reported a
 * successful read, so `setNewSubcategory` merged its one entry into those
 * defaults and `writeSyncedSubcategories` put them on `account.disklet` —
 * the user's whole subcategory list replaced by the defaults plus one
 * entry, on the *synced* repo, on every device. An array is the likeliest
 * shape for a half-synced file that is valid JSON and not these settings,
 * which is why `localAccountSettings.ts` and `syncedSettingsFile.ts` both
 * guard against it.
 */
const asCategoriesFile = asJSON((raw: unknown) => {
  if (!isPlainObject(raw)) {
    throw new TypeError(`${CATEGORIES_FILENAME} is not a categories object`)
  }
  return asCategoriesInner(raw)
})
const wasCategoriesFile = uncleaner(asCategoriesFile)

/**
 * The account's synced subcategory list. A read, and only a read.
 *
 * It used to seed the file with the defaults when it was absent, which put
 * a `setText` inside the one function both callers funnel through — and
 * only one of them holds the `serializeByKey` key. So the single write that
 * was *not* serialized was the one in the shared path: `CategoryModal`
 * dispatches `getSubcategories` on mount, a tap in the window before it
 * resolves runs `setNewSubcategory`, which takes the key, re-reads (still
 * absent), seeds, merges and writes 117 — and the mount's unlocked write
 * of the bare 116 lands last, on the *synced* repo, while Redux has
 * already been told 117.
 *
 * Removing the write also stops a read failing for a write's reason. The
 * seed was awaited, and `writeSyncedSubcategories` deliberately no longer
 * swallows a failure, so on a fresh account whose repo could not be
 * written this threw out of a function whose job is to read — and
 * `CategoryModal` rendered an empty list, offering none of the 116
 * standard categories, on the screen whose whole purpose is to offer them.
 * The defaults need no file to produce.
 *
 * The file is still created the first time there is something to put in
 * it: `setNewSubcategory` reads this, merges its entry and writes, inside
 * the key. `mergeExportTxInfo` is the same shape — its reader never
 * writes, and the absent-file arm lives inside the serialized block.
 *
 * Exported for its test: the loss this guards against — a rewrite of the
 * synced list from the defaults on a file that is present and unreadable —
 * is invisible to the caller, which gets a plausible list either way.
 */
export async function readSyncedSubcategories(
  account: EdgeAccount
): Promise<string[]> {
  let text: string
  try {
    text = await account.disklet.getText(CATEGORIES_FILENAME)
  } catch (error: unknown) {
    // Only an absent file may be answered by writing the defaults back.
    // This caught everything, so a decryption or I/O failure on a file that
    // is *there* rewrote the user's subcategory list from the 116-entry
    // default array — on the synced repo, for every device.
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
  // the key — `{}` — returned `undefined` into `SET_TRANSACTION_SUBCATEGORIES`
  // and so into `state.ui.subcategories`, which `uiReducer.ts` types
  // `string[]`; `CategoryModal` then did `categories.map(...)` and threw on
  // open, with nothing in between to notice.
  return asCategoriesFile(text).categories
}

/**
 * The base a write starts from: the file, or the defaults once an
 * unreadable file has been copied aside.
 *
 * Only a content failure is recovered from; an I/O failure says nothing
 * about the bytes, so it is rethrown and the file stays.
 */
async function readSubcategoriesForWrite(
  account: EdgeAccount
): Promise<string[]> {
  try {
    return await readSyncedSubcategories(account)
  } catch (error: unknown) {
    if (!isContentFailure(error)) throw error
    const keptAs = `${CATEGORIES_FILENAME}.unreadable-${Date.now()}`
    const text = await account.disklet
      .getText(CATEGORIES_FILENAME)
      .catch(() => undefined)
    if (text != null) await account.disklet.setText(keptAs, text)
    reportWarning(
      `${CATEGORIES_FILENAME} could not be read (${errorMessage(error)})${
        text == null ? '' : `; kept as ${keptAs}`
      }; starting again from the defaults`
    )
    return [...defaultCategories]
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
  mptrade: EDGE_CONTENT_SERVER_URI + '/exchangeIcons/mptrade/icon.png',
  mptradedefi: EDGE_CONTENT_SERVER_URI + '/exchangeIcons/mptradedefi/icon.png',
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
