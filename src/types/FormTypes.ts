import { asMaybe, asObject, asString } from 'cleaners'

// Field appearance and how user input is handled for a particular form field.
// Defines what keyboard type, validation, autofill, etc is applied to the
// field. Independent from the value stored. Ex: A 'number' type will get user
// input with a number-only keypad, but we may want to store that value as a
// string.
export type FormFieldDataType = 'text' | 'number' | 'address' | 'zip'

export interface FormFieldProps {
  dataType: FormFieldDataType
  key: string
  label: string
  value?: string
}

export type FormDataType = 'addressForm' | 'sepaForm'
export interface FormProps {
  fields: FormFieldProps[]
  formType: FormDataType
  key: string
  title: string
}

export const asHomeAddress = asObject({
  address: asString,
  address2: asMaybe(asString),
  city: asString,
  country: asString,
  state: asString,
  postalCode: asString
})

export type HomeAddress = ReturnType<typeof asHomeAddress>

export const asSepaInfo = asObject({
  name: asString,
  iban: asString,
  swift: asString
})

export type SepaInfo = ReturnType<typeof asSepaInfo>
