/*
    The purpose of this file is to document common variables and colors for Airbitz,
    making it easier to reference those colors
    Author: Kylan Hurt (kylan@airbitz.co)
    Created: 2017-07-28
*/
// @flow

export const colors = {
  gradient: {
    light: '#3b7ada',
    dark:  '#2b5698',
  },

  primary:   '#2a5799',
  secondary: '#4977bb',

  accentGreen:  '#7fc343',
  accentOrange: '#f7a623',
  accentRed:    '#f03a47',

  black: '#000000',
  gray1: '#58595c',
  gray2: '#909091',
  gray3: '#d8d6d8',
  gray4: '#F7F7F7',
  white: '#FFFFFF',
}

export const opacity = {
  active: 0.3
}

export const font = {
  default:  'SourceSansPro-Black'
}

// https://projects.invisionapp.com/d/main#/console/10954562/239168414/inspect
export default {
  BUTTONS: {
    HEIGHT: 44
  },
  DEBUG: {
    COLORS: {
      HIGHLIGHT: '#f03a47'
    }
  },
  FONTS: {
    DEFAULT: 'SourceSansPro-Black'
  },

  OPACITY: {
    ACTIVE: 0.3,

    FULL: 1.0,
    HIGH: 0.8,
    MID: 0.5,
    LOW: 0.1,
    NONE: 0.0
  },

  COLORS: {
    PRIMARY:   '#2a5799',
    SECONDARY: '#4977bb',

    GRADIENT: {
      LIGHT: '#3b7ada',
      DARK:  '#2b5698'
    },

    ACCENT_GREEN:  '#7fc343',
    ACCENT_ORANGE: '#f7a623',
    ACCENT_RED:    '#f03a47',

    BLACK:  '#000000',
    GRAY_1: '#58595c',
    GRAY_2: '#909091',
    GRAY_3: '#d8d6d8',
    GRAY_4: '#F7F7F7',
    WHITE:  '#FFFFFF',
    CLEAR:  'rgba(0, 0, 0, 0)',

    TRANSPARENT: 'transparent'
  }
}
