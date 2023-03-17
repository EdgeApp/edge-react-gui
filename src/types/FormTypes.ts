import { asObject, asString } from 'cleaners'

export const SEPA_FORM_DISKLET_NAME = 'sepaInfo'

export const asSepaInfo = asObject({
  name: asString,
  iban: asString,
  swift: asString
})

export type SepaInfo = ReturnType<typeof asSepaInfo>
