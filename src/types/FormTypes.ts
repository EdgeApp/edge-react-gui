import { OutlinedTextInputProps } from '../components/themed/OutlinedTextInput'

// Define all form field types here.
export type FormFieldType = 'address' | 'address2' | 'text' | 'postalcode' | 'state' | 'city' | 'name' | 'iban' | 'swift'

// For each form field type, define the relevant display properties that will be
// used to pass along to the OutlinedTextInput.
export const FORM_FIELD_DISPLAY_PROPS: {
  readonly [fieldType in FormFieldType]: { widthRem?: number; textInputProps?: Partial<OutlinedTextInputProps> }
} = {
  address: {
    widthRem: undefined,
    textInputProps: undefined
  },
  address2: {
    widthRem: undefined,
    textInputProps: undefined
  },
  city: {
    // TODO: Extend component to also render dropdowns
    widthRem: undefined,
    textInputProps: undefined
  },
  iban: {
    widthRem: 20,
    textInputProps: undefined
  },
  name: {
    widthRem: undefined,
    textInputProps: undefined
  },
  state: {
    // TODO: Extend component to also render dropdowns
    widthRem: undefined,
    textInputProps: undefined
  },
  swift: {
    widthRem: 13,
    textInputProps: undefined
  },
  postalcode: {
    widthRem: 13,
    textInputProps: {
      keyboardType: 'numeric',
      numeric: true
    }
  },
  text: {
    widthRem: undefined,
    textInputProps: undefined
  }
}
