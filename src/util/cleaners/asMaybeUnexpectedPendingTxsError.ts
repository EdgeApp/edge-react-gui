import { asMaybe, asObject, asValue } from 'cleaners'

export const asMaybeUnexpectedPendingTxsError = asMaybe(
  asObject({
    message: asValue('Unexpected pending transactions')
  })
)
