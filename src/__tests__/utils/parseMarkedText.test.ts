import { describe, it } from '@jest/globals'
import { asObject, asTuple, asUnknown, asValue, Cleaner } from 'cleaners'

import { parseMarkedText } from '../../util/parseMarkedText'

describe('parseMarkedText', () => {
  const asJsxElement = (asChildren: Cleaner<any> = asUnknown) =>
    asObject({
      props: asObject({
        children: asChildren
      })
    })

  it('Should emphases text', () => {
    const result = parseMarkedText(`I *am* emphasized`)

    asTuple(asValue('I '), asJsxElement(asValue('am')), asValue(' emphasized'))(result)
  })

  it('Should ignore unbalanced markers characters text', () => {
    const result = parseMarkedText(`I *am* emphasized. And*, I am not.`)
    asTuple(asValue('I '), asJsxElement(asValue('am')), asValue(' emphasized. And*, I am not.'))(result)

    const result2 = parseMarkedText(`This is an * (asterisk)`)
    asTuple(asValue('This is an * (asterisk)'))(result2)
  })

  it('Should ignore escaped characters text', () => {
    const result = parseMarkedText(`I \\*am not* emphasized`)

    asTuple(asValue('I *am not* emphasized'))(result)
  })
})
