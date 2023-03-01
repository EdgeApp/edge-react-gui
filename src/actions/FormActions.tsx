import { Disklet } from 'disklet'

import { FormProps } from '../types/FormTypes'

export async function getDiskletForm(disklet: Disklet, form: FormProps): Promise<FormProps | undefined> {
  try {
    const rawFormData = JSON.parse(await disklet.getText(form.formType))
    return rawFormData as FormProps
  } catch (error: any) {
    return undefined
  }
}

export const setDiskletForm = async (disklet: Disklet, formData: FormProps): Promise<void> => {
  await disklet.setText(formData.formType, JSON.stringify(formData))
}
