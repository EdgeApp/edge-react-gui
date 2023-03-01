import { ObjectCleaner } from 'cleaners'

import { asFiatSepaInfo } from '../plugins/gui/fiatPluginTypes'
import { asHomeAddress, FormDataType } from '../types/FormTypes'

export const getFormCleaner = (formType: FormDataType): ObjectCleaner<any> => {
  switch (formType) {
    case 'addressForm':
      return asHomeAddress
    case 'sepaForm':
      return asFiatSepaInfo
  }
}
