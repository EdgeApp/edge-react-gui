// @flow

import { add, gte } from 'biggystring'

export const round = (num: string) => {
  const [out, r = '0'] = num.split('.')
  return add(out, gte(r[0], '5') ? '1' : '0')
}
