import { LocaleStringKey } from '../locales/en_US'
import { lstrings } from '../locales/strings'

/** A common string key that parses into default vs UK compliant equivalents. */
type CompliantStringKeys =
  | 'stake_earn_1s' // stake_earn_1s / stake_stake_1s
  | 'stake_earn_button_label' // stake_earn_button_label / fragment_stake_label
  | 'stake_x_to_earn_y' // stake_x_to_earn_y / transaction_details_stake_subcat_1s
  | 'insufficient_fees_2s' // buy_parent_crypto_modal_message_2s / swap_parent_crypto_modal_message_2s
  | 'insufficient_fees_3s' // buy_parent_crypto_modal_message_3s / swap_parent_crypto_modal_message_3s

const UK_COMPLIANT_STRING_MAP: {
  [key in CompliantStringKeys]: {
    default: LocaleStringKey
    gb: LocaleStringKey
  }
} = {
  stake_earn_1s: { default: 'stake_earn_1s', gb: 'stake_stake_1s' },
  stake_earn_button_label: {
    default: 'stake_earn_button_label',
    gb: 'fragment_stake_label'
  },
  stake_x_to_earn_y: {
    default: 'stake_x_to_earn_y',
    gb: 'transaction_details_stake_subcat_1s'
  },
  insufficient_fees_2s: { default: 'buy_parent_crypto_modal_message_2s', gb: 'swap_parent_crypto_modal_message_2s' },
  insufficient_fees_3s: { default: 'buy_parent_crypto_modal_message_3s', gb: 'swap_parent_crypto_modal_message_3s' }
}

const formatString = (template: string, values: string[]): string => {
  return template.replace(/%(\d+)\$s/g, (_, index) => values[parseInt(index) - 1] || '')
}

/**
 * Returns the UK compliant version of the string
 */
export const getUkCompliantString = (countryCode: string | undefined, key: CompliantStringKeys, ...values: string[]): string => {
  const compliantStringKeys = UK_COMPLIANT_STRING_MAP[key]
  const template = countryCode === 'GB' ? lstrings[compliantStringKeys.gb] : lstrings[compliantStringKeys.default]
  return formatString(template, values)
}
