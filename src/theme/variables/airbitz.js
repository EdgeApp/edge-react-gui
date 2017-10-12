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
  FONTS: {
    DEFAULT: 'SourceSansPro-Black'
  },

  OPACITY: {
    ACTIVE: 0.3
  },

  COLORS: {
    PRIMARY:   '#2a5799',
    SECONDARY: '#4977bb',

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

    GRADIENT: {
      LIGHT: '#3b7ada',
      DARK:  '#2b5698'
    },

    BLUE_ALPHA_BUTTON: {
      UNPRESSED: 'rgba(42, 87, 153, 0.55)'
    },

    TRANSPARENT_BUTTON: {
      BORDER: 'rgba(256, 256, 256, 0.5)'
    }
  }
}
