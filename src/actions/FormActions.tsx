import { Disklet } from 'disklet'

export const getDiskletFormData = async <T extends object>(disklet: Disklet, formDataName: string, cleaner: (x: any) => T): Promise<T | undefined> => {
  try {
    const rawFormData = JSON.parse(await disklet.getText(formDataName))
    const formData = cleaner(rawFormData)
    return formData
  } catch (error: any) {
    return undefined
  }
}

export const setDiskletForm = async (disklet: Disklet, formDataName: string, formData: object): Promise<void> => {
  await disklet.setText(formDataName, JSON.stringify(formData))
}
