/** A target locale and how Claude should write it. */
export interface LocaleConfig {
  /** The target language as the model should read it. */
  language: string
  /** The language name Jev must detect, or undefined to skip that check. */
  jevLanguage?: string
  instructions: string
}

/** The locales in src/locales/strings, keyed by file name. */
export const LOCALES: Record<string, LocaleConfig> = {
  de: {
    language: 'German',
    jevLanguage: 'German',
    instructions: 'Use the formal register: address the user as "Sie".'
  },
  es: {
    language: 'Spanish (international, Spain)',
    jevLanguage: 'Spanish',
    instructions:
      'Use neutral international Spanish with the informal "tú" register.'
  },
  esMX: {
    language: 'Mexican Spanish',
    jevLanguage: 'Spanish',
    instructions:
      'Use Mexican Spanish vocabulary and phrasing (for example "celular", "computadora", "cuenta de banco") with the informal "tú" register.'
  },
  fr: {
    language: 'French',
    jevLanguage: 'French',
    instructions: 'Use the formal register: address the user as "vous".'
  },
  it: {
    language: 'Italian',
    jevLanguage: 'Italian',
    instructions: 'Use the informal register: address the user as "tu".'
  },
  ja: {
    language: 'Japanese',
    jevLanguage: 'Japanese',
    instructions:
      'Use the polite です/ます form. Buttons and labels stay short noun phrases.'
  },
  kaa: {
    language: 'Karakalpak',
    instructions:
      'Write Karakalpak in the Latin alphabet (2016 standard, with letters such as á, ó, ú, ı, ń, ǵ). Never use Cyrillic.'
  },
  ko: {
    language: 'Korean',
    jevLanguage: 'Korean',
    instructions: 'Use the formal polite 합니다/습니다 style for sentences.'
  },
  pt: {
    language: 'Brazilian Portuguese',
    jevLanguage: 'Portuguese',
    instructions:
      'Use Brazilian Portuguese (not European) and address the user as "você".'
  },
  ru: {
    language: 'Russian',
    jevLanguage: 'Russian',
    instructions: 'Use the formal register: address the user as "Вы".'
  },
  vi: {
    language: 'Vietnamese',
    jevLanguage: 'Vietnamese',
    instructions: 'Use standard Vietnamese.'
  },
  zh: {
    language: 'Simplified Chinese',
    jevLanguage: 'Chinese',
    instructions: 'Use Simplified Chinese characters (mainland China usage).'
  }
}
