import { composeAsync, isAvailableAsync } from 'expo-mail-composer'

/**
 * Mail composer via expo-mail-composer.
 */

export class EmailUnavailableError extends Error {
  constructor() {
    super('not_available')
    this.name = 'EmailUnavailableError'
  }
}

export interface ComposeEmailOptions {
  subject?: string
  recipients?: string[]
  body?: string
  isHtml?: boolean
}

export const composeEmail = async (
  options: ComposeEmailOptions
): Promise<void> => {
  const available = await isAvailableAsync()
  if (!available) {
    throw new EmailUnavailableError()
  }
  await composeAsync({
    subject: options.subject,
    recipients: options.recipients,
    body: options.body,
    isHtml: options.isHtml
  })
}
