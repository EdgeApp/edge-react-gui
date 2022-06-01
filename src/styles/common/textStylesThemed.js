// @flow

import { type Theme } from '../../types/Theme.js'

export function textStyle(theme: Theme, ...rules: string[]): Object {
  const textSize = {
    largest: theme.rem(1.5),
    large: theme.rem(1.25),
    normal: theme.rem(1),
    small: theme.rem(0.75),
    smallest: theme.rem(0.5)
  }

  const tweakRules = {
    bold: { fontFamily: theme.fontFaceBold },
    small: { fontSize: textSize.small },
    large: { fontSize: textSize.large }
  }

  const defaultRules = {
    ...tweakRules,
    ...alignmentRules,

    link: {
      textDecoration: 'underline'
    },
    title: {
      ...alignmentRules.center,
      ...tweakRules.large
    }
  }
  const base: Object = {
    color: theme.primaryText,
    fontFamily: theme.fontFaceDefault,
    fontSize: theme.rem(1)
  }
  return Object.assign(base, ...rules.map(rule => defaultRules[rule]))
}

// Alignment schemes:
const alignmentRules = {
  // These work as expected within a `flex-direction: 'column'` container:
  center: { textAlign: 'center', alignSelf: 'center' },
  left: { textAlign: 'left', alignSelf: 'stretch' },
  right: { textAlign: 'right', alignSelf: 'stretch' },

  // Centers signle-line text, or left-justifies multi-line text
  // within a `flex-direction: 'column'` container:
  autoCenter: { textAlign: 'left', alignSelf: 'center' },

  // These work within a `flex-direction: 'row'` container:
  'row-center': { textAlign: 'center', flexShrink: 1 },
  'row-left': { textAlign: 'left', flexShrink: 1 },
  'row-right': { textAlign: 'right', flexShrink: 1 }
}
