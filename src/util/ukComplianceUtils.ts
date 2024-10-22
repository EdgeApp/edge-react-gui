import { LocaleStringKey } from '../locales/en_US'
import { lstrings } from '../locales/strings'

const UK_COMPLIANT_STRING_MAP: { [key: string]: LocaleStringKey } = {
  buy_1s: 'uk_ways_to_buy_1s',
  sell_1s: 'uk_ways_to_sell_1s',
  stake_earn_1s: 'stake_stake_1s',
  stake_earn_button_label: 'fragment_stake_label',
  stake_x_to_earn_y: 'transaction_details_stake_subcat_1s'
}

const formatString = (template: string, values: string[]): string => {
  return template.replace(/%(\d+)\$s/g, (_, index) => values[parseInt(index) - 1] || '')
}

export const getUkCompliantString = (countryCode: string | undefined, key: LocaleStringKey, ...values: string[]): string => {
  const template = countryCode === 'GB' ? lstrings[UK_COMPLIANT_STRING_MAP[key]] : lstrings[key]
  return formatString(template, values)
}
