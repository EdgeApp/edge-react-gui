import { LocaleStringKey } from '../locales/en_US'
import { lstrings } from '../locales/strings'

type CompliantStringKeys = 'buy_1s' | 'buy_1s_quote' | 'sell_1s' | 'stake_earn_1s' | 'stake_earn_button_label' | 'stake_x_to_earn_y'

const UK_COMPLIANT_STRING_MAP: { [key in CompliantStringKeys]: { default: LocaleStringKey; gb: LocaleStringKey } } = {
  buy_1s: { default: 'buy_1s', gb: 'uk_ways_to_buy_1s' },
  buy_1s_quote: { default: 'buy_1s', gb: 'uk_get_quote_provider_1s' },
  sell_1s: { default: 'sell_1s', gb: 'uk_ways_to_sell_1s' },
  stake_earn_1s: { default: 'stake_earn_1s', gb: 'stake_stake_1s' },
  stake_earn_button_label: { default: 'stake_earn_button_label', gb: 'fragment_stake_label' },
  stake_x_to_earn_y: { default: 'stake_x_to_earn_y', gb: 'transaction_details_stake_subcat_1s' }
}

const formatString = (template: string, values: string[]): string => {
  return template.replace(/%(\d+)\$s/g, (_, index) => values[parseInt(index) - 1] || '')
}

export const getUkCompliantString = (countryCode: string | undefined, key: CompliantStringKeys, ...values: string[]): string => {
  const compliantStringKeys = UK_COMPLIANT_STRING_MAP[key]
  const template = countryCode === 'GB' ? lstrings[compliantStringKeys.gb] : lstrings[compliantStringKeys.default]
  return formatString(template, values)
}
